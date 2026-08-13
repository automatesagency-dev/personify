const { prisma } = require('../config/database');
const { openai } = require('../config/ai');
const { fal } = require('../config/fal');
const { uploadToR2 } = require('../config/r2');
const { getLimits, monthlyWindow } = require('../config/plans');

const NANO_ASPECT_RATIO_MAP = { square: '1:1', portrait: '9:16', landscape: '16:9' };
const SEEDREAM_SIZE_MAP = { square: 'square_hd', portrait: 'portrait_4_3', landscape: 'landscape_4_3' };
const GPT_IMAGE_SIZE_MAP = { square: '1024x1024', portrait: '1024x1536', landscape: '1536x1024' };

// =====================================
// Persist a provider-generated image to our own R2 storage.
// DALL-E and Fal.ai return temporary URLs that expire within hours, which
// would leave broken images in History and on Founder Pages. We download the
// result and re-host it on R2 so the link is permanent.
// =====================================
async function persistImageToR2(sourceUrl) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch generated image (status ${response.status})`);
  }
  const contentType = (response.headers.get('content-type') || 'image/png').split(';')[0];
  const ext = contentType.split('/')[1] || 'png';
  const buffer = Buffer.from(await response.arrayBuffer());
  return uploadToR2(buffer, `generation-${Date.now()}.${ext}`, contentType);
}

// =====================================
// Classify an AI provider error into a safe, user-facing response.
// Distinguishes non-retryable failures (billing/auth/locked account) from
// genuinely transient ones (overload/rate-limit) so the client knows whether
// retrying is worthwhile — and never leaks the provider's raw reason to users.
// =====================================
function classifyAiError(error, label) {
  const status = error?.status || error?.response?.status;
  const detail = String(error?.body?.detail || error?.message || '').toLowerCase();

  // Billing / auth / locked account — retrying will never succeed.
  if (
    status === 401 || status === 402 || status === 403 ||
    detail.includes('balance') || detail.includes('locked') ||
    detail.includes('quota') || detail.includes('billing') || detail.includes('forbidden')
  ) {
    return {
      httpStatus: 503,
      code: 'PROVIDER_UNAVAILABLE',
      retryable: false,
      userMessage: `${label === 'image' ? 'Image' : 'Text'} generation is temporarily unavailable. Please try again later or contact support.`,
    };
  }

  // Overloaded / rate-limited / transient upstream errors — worth a retry.
  if (
    status === 429 || status === 500 || status === 502 || status === 503 ||
    detail.includes('overload') || detail.includes('timeout') || detail.includes('busy') || detail.includes('rate limit')
  ) {
    return {
      httpStatus: 503,
      code: 'PROVIDER_OVERLOADED',
      retryable: true,
      userMessage: `The ${label} service is busy right now. Please try again in a moment.`,
    };
  }

  return {
    httpStatus: 500,
    code: 'GENERATION_FAILED',
    retryable: false,
    userMessage: `Failed to generate ${label}. Please try again.`,
  };
}

// =====================================
// Monthly generation limits (per plan)
// =====================================

// Start of the user's current usage window: their subscription period start if
// they have one, otherwise the start of the calendar month (free users).
function usageWindowStart(user) {
  if (user?.currentPeriodStart) return monthlyWindow(new Date(user.currentPeriodStart)).start;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Atomically reserve a monthly slot and create the pending generation row.
// A per-user Postgres advisory lock serializes concurrent requests for the same
// user, so they can't all read the same count and race past the cap. Failed
// generations are excluded from the count, so an errored attempt is refunded.
// Returns the created generation, or null if the plan's monthly limit is reached.
async function reserveGeneration({ userId, type, prompt, model }) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { plan: true, currentPeriodStart: true, bonusImages: true, bonusTexts: true }
    });
    const limits = getLimits(user?.plan);
    const windowStart = usageWindowStart(user);
    const count = await tx.generation.count({
      where: { userId, type, status: { not: 'failed' }, createdAt: { gte: windowStart } }
    });
    if (count >= limits[type]) {
      // Plan quota used up — draw from any admin-granted bonus pool.
      const bonusField = type === 'image' ? 'bonusImages' : 'bonusTexts';
      if ((user?.[bonusField] || 0) <= 0) return null;
      await tx.user.update({ where: { id: userId }, data: { [bonusField]: { decrement: 1 } } });
    }
    return tx.generation.create({
      data: { userId, type, prompt, model, status: 'pending' }
    });
  });
}

// =====================================
// Generate Image
// =====================================
async function generateImage(req, res) {
  try {
    const userId = req.user.id;
    const {
      prompt,
      model = 'gpt-image-1',
      useFaceConsistency = false,
      faceModel = 'nano-banana-2',
      referenceImagesBase64 = [],
      referenceImagesMimeTypes = [],
      aspectRatio = 'square'
    } = req.body;

    const nanoAspectRatio = NANO_ASPECT_RATIO_MAP[aspectRatio] || '1:1';
    const seedreamImageSize = SEEDREAM_SIZE_MAP[aspectRatio] || 'square_hd';
    const gptImageSize = GPT_IMAGE_SIZE_MAP[aspectRatio] || '1024x1024';

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (referenceImagesBase64.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 reference images allowed' });
    }

    // Persona is only used in Brand Persona (face consistency) mode.
    // Freestyle generates purely from the user's prompt — no persona at all.
    let enhancedPrompt = prompt;
    let persona = null;

    if (useFaceConsistency) {
      persona = await prisma.persona.findUnique({
        where: { userId },
        include: { personaImages: true }
      });

      if (persona) {
        const personaContext = [];
        if (persona.bio) personaContext.push(persona.bio);
        if (persona.industry) personaContext.push(`Industry: ${persona.industry}`);
        if (persona.brandTone) personaContext.push(`Style: ${persona.brandTone}`);

        if (personaContext.length > 0) {
          enhancedPrompt = `${personaContext.join('. ')}. ${prompt}`;
        }
      }
    }

    // Atomically reserve a daily slot + create the pending generation row
    const generation = await reserveGeneration({
      userId,
      type: 'image',
      prompt,
      model: useFaceConsistency ? `fal-${faceModel}` : model
    });

    if (!generation) {
      return res.status(429).json({
        error: `You've reached your monthly image limit for your plan. Upgrade to keep generating, or wait for your next billing cycle.`,
        code: 'LIMIT_REACHED',
        retryable: false
      });
    }

    try {
      let imageUrl;
      let alreadyPersisted = false;

      // =====================================
      // FACE CONSISTENT GENERATION
      // =====================================
      if (
        useFaceConsistency &&
        persona &&
        persona.personaImages &&
        persona.personaImages.length > 0
      ) {

        if (!persona.bio || !persona.industry || !persona.brandTone) {
          await prisma.generation.update({ where: { id: generation.id }, data: { status: 'failed', errorMessage: 'Incomplete persona' } });
          return res.status(400).json({
            error: 'Please complete your persona profile (bio, industry, brand tone) to use face consistency.'
          });
        }

        const personaImage = persona.personaImages[0];
        const imageUrlPath = personaImage.imageUrl;

        if (!imageUrlPath) {
          await prisma.generation.update({ where: { id: generation.id }, data: { status: 'failed', errorMessage: 'Missing persona image' } });
          return res.status(400).json({
            error: 'Persona image not found. Please re-upload your persona images.'
          });
        }

        // Upload reference images to R2 if provided
        const referenceUrls = [];
        for (let i = 0; i < referenceImagesBase64.length; i++) {
          try {
            const mime = referenceImagesMimeTypes[i] || 'image/jpeg';
            const ext = mime.split('/')[1] || 'jpg';
            const refBuffer = Buffer.from(referenceImagesBase64[i], 'base64');
            const refUrl = await uploadToR2(refBuffer, `reference-${i}.${ext}`, mime);
            referenceUrls.push(refUrl);
          } catch (uploadErr) {
            console.warn(`Reference image ${i + 1} upload failed, skipping:`, uploadErr.message);
          }
        }

        const imageUrlsForFal = [imageUrlPath, ...referenceUrls];

        let result;

        try {
          if (faceModel === 'nano-banana-2') {
            result = await fal.subscribe('fal-ai/nano-banana-2/edit', {
              input: {
                image_urls: imageUrlsForFal,
                prompt: enhancedPrompt,
                aspect_ratio: nanoAspectRatio,
                num_inference_steps: 28,
                guidance_scale: 3.5,
                num_images: 1,
                enable_safety_checker: true
              },
              logs: true
            });

          } else if (faceModel === 'bytedance-seedream') {
            result = await fal.subscribe(
              'fal-ai/bytedance/seedream/v4.5/edit',
              {
                input: {
                  image_urls: imageUrlsForFal,
                  prompt: enhancedPrompt,
                  image_size: seedreamImageSize,
                  num_inference_steps: 25,
                  guidance_scale: 7.5,
                  num_images: 1
                },
                logs: true
              }
            );

          } else {
            throw new Error(`Unsupported face model: ${faceModel}`);
          }

          if (result.images && result.images.length > 0) {
            imageUrl = result.images[0].url;
          } else {
            throw new Error('Fal.ai did not return any images');
          }

        } catch (falError) {
          console.error('Fal.ai error:', falError.message);
          throw falError;
        }

      } else {
        // =====================================
        // STANDARD FLOW — OpenAI gpt-image models
        // =====================================
        const response = await openai.images.generate({
          model: model,          // gpt-image-1 | gpt-image-1.5 | gpt-image-2
          prompt: enhancedPrompt,
          n: 1,
          size: gptImageSize,
          quality: 'high'
        });

        const img = response.data && response.data[0];
        if (img && img.b64_json) {
          // gpt-image models return base64 — upload the bytes straight to R2.
          const buffer = Buffer.from(img.b64_json, 'base64');
          imageUrl = await uploadToR2(buffer, `generation-${Date.now()}.png`, 'image/png');
          alreadyPersisted = true;
        } else if (img && img.url) {
          imageUrl = img.url;
        } else {
          throw new Error('OpenAI did not return an image');
        }
      }

      // Re-host provider URLs on R2 so they survive the provider's URL expiry
      // (skip when we already uploaded the bytes ourselves above). Falls back to
      // the provider URL rather than failing a generation the user paid for.
      if (!alreadyPersisted) {
        try {
          imageUrl = await persistImageToR2(imageUrl);
        } catch (persistErr) {
          console.error('⚠️ Failed to persist generated image to R2, using provider URL:', persistErr.message);
        }
      }

      // Save result
      const updatedGeneration = await prisma.generation.update({
        where: { id: generation.id },
        data: {
          result: imageUrl,
          status: 'completed'
        }
      });

      res.status(201).json({
        message: 'Image generated successfully',
        generation: updatedGeneration,
        imageUrl
      });

    } catch (aiError) {
      console.error('AI Generation error:', aiError.status || '', aiError.message, aiError.body?.detail || '');

      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'failed',
          errorMessage: aiError.body?.detail || aiError.message
        }
      });

      const c = classifyAiError(aiError, 'image');
      return res.status(c.httpStatus).json({ error: c.userMessage, code: c.code, retryable: c.retryable });
    }

  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
}

// =====================================
// Generate Text
// =====================================
async function generateText(req, res) {
  try {
    const userId = req.user.id;
    const {
      prompt,
      model = 'gpt-4',
      referenceImagesBase64 = [],
      referenceImagesMimeTypes = []
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (referenceImagesBase64.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 reference images allowed' });
    }

    const persona = await prisma.persona.findUnique({
      where: { userId }
    });

    let systemMessage = 'You are a helpful AI assistant.';

    if (persona) {
      const personaContext = [];
      if (persona.bio) personaContext.push(persona.bio);
      if (persona.industry) personaContext.push(`Industry: ${persona.industry}`);
      if (persona.targetAudience)
        personaContext.push(`Target audience: ${persona.targetAudience}`);
      if (persona.brandTone)
        personaContext.push(`Brand tone: ${persona.brandTone}`);

      if (personaContext.length > 0) {
        systemMessage = `You are a content creator with this profile: ${personaContext.join(
          '. '
        )}. Create content that matches this persona.`;
      }
    }

    const generation = await reserveGeneration({ userId, type: 'text', prompt, model });

    if (!generation) {
      return res.status(429).json({
        error: `You've reached your monthly text limit for your plan. Upgrade to keep generating, or wait for your next billing cycle.`,
        code: 'LIMIT_REACHED',
        retryable: false
      });
    }

    try {
      // If reference images are provided, force gpt-4o (vision) and include the images
      const hasImages = referenceImagesBase64.length > 0;
      const effectiveModel = hasImages ? 'gpt-4o' : model;
      const userContent = hasImages
        ? [
            { type: 'text', text: prompt },
            ...referenceImagesBase64.map((b64, i) => ({
              type: 'image_url',
              image_url: {
                url: `data:${referenceImagesMimeTypes[i] || 'image/jpeg'};base64,${b64}`
              }
            }))
          ]
        : prompt;

      const response = await openai.chat.completions.create({
        model: effectiveModel,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userContent }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const generatedText = response.choices[0].message.content;

      const updatedGeneration = await prisma.generation.update({
        where: { id: generation.id },
        data: {
          result: generatedText,
          status: 'completed'
        }
      });

      res.status(201).json({
        message: 'Text generated successfully',
        generation: updatedGeneration,
        text: generatedText
      });

    } catch (err) {
      console.error('Text generation error:', err.status || '', err.message, err.body?.detail || '');

      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'failed',
          errorMessage: err.body?.detail || err.message
        }
      });

      const c = classifyAiError(err, 'text');
      return res.status(c.httpStatus).json({ error: c.userMessage, code: c.code, retryable: c.retryable });
    }

  } catch (error) {
    console.error('Generate text error:', error);
    res.status(500).json({ error: 'Failed to generate text' });
  }
}

// =====================================
// Get History
// =====================================
async function getGenerations(req, res) {
  try {
    const userId = req.user.id;
    const { type, limit = 100 } = req.query;

    const where = { userId };
    if (type === 'image' || type === 'text') {
      where.type = type;
    }

    const generations = await prisma.generation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({ count: generations.length, generations });

  } catch (error) {
    res.status(500).json({ error: 'Failed to get generations' });
  }
}

// =====================================
// Get Single
// =====================================
async function getGenerationById(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const generation = await prisma.generation.findUnique({
      where: { id }
    });

    if (!generation)
      return res.status(404).json({ error: 'Generation not found' });

    if (generation.userId !== userId)
      return res.status(403).json({
        error: 'You do not have permission to view this generation'
      });

    res.json({ generation });

  } catch (error) {
    res.status(500).json({ error: 'Failed to get generation' });
  }
}

// =====================================
// Delete
// =====================================
async function deleteGeneration(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const generation = await prisma.generation.findUnique({
      where: { id }
    });

    if (!generation)
      return res.status(404).json({ error: 'Generation not found' });

    if (generation.userId !== userId)
      return res.status(403).json({
        error: 'You do not have permission to delete this generation'
      });

    await prisma.generation.delete({ where: { id } });

    res.json({ message: 'Generation deleted successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete generation' });
  }
}

module.exports = {
  generateImage,
  generateText,
  getGenerations,
  getGenerationById,
  deleteGeneration
};
