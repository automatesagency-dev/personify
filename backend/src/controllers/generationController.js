const { prisma } = require('../config/database');
const { openai } = require('../config/ai');
const { fal } = require('../config/fal');
const { uploadToR2 } = require('../config/r2');

const NANO_ASPECT_RATIO_MAP = { square: '1:1', portrait: '9:16', landscape: '16:9' };
const SEEDREAM_SIZE_MAP = { square: 'square_hd', portrait: 'portrait_4_3', landscape: 'landscape_4_3' };
const DALLE_SIZE = { square: '1024x1024', portrait: '1024x1792', landscape: '1792x1024' };

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
// Generate Image
// =====================================
async function generateImage(req, res) {
  try {
    const userId = req.user.id;
    const {
      prompt,
      model = 'dall-e-3',
      useFaceConsistency = false,
      faceModel = 'nano-banana-2',
      referenceImagesBase64 = [],
      referenceImagesMimeTypes = [],
      aspectRatio = 'square'
    } = req.body;

    const nanoAspectRatio = NANO_ASPECT_RATIO_MAP[aspectRatio] || '1:1';
    const seedreamImageSize = SEEDREAM_SIZE_MAP[aspectRatio] || 'square_hd';
    const dalleImageSize = DALLE_SIZE[aspectRatio] || '1024x1024';

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (referenceImagesBase64.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 reference images allowed' });
    }

    // Get persona — include images only when face consistency is needed
    const persona = await prisma.persona.findUnique({
      where: { userId },
      ...(useFaceConsistency
        ? { include: { personaImages: true } }
        : { select: { bio: true, industry: true, brandTone: true } })
    });

    // Enhance prompt with persona
    let enhancedPrompt = prompt;

    if (persona) {
      const personaContext = [];
      if (persona.bio) personaContext.push(persona.bio);
      if (persona.industry) personaContext.push(`Industry: ${persona.industry}`);
      if (persona.brandTone) personaContext.push(`Style: ${persona.brandTone}`);

      if (personaContext.length > 0) {
        enhancedPrompt = `${personaContext.join('. ')}. ${prompt}`;
      }
    }

    // Create pending generation
    const generation = await prisma.generation.create({
      data: {
        userId,
        type: 'image',
        prompt: prompt,
        model: useFaceConsistency ? `fal-${faceModel}` : model,
        status: 'pending'
      }
    });

    try {
      let imageUrl;

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
          return res.status(400).json({
            error: 'Please complete your persona profile (bio, industry, brand tone) to use face consistency.'
          });
        }

        const personaImage = persona.personaImages[0];
        const imageUrlPath = personaImage.imageUrl;

        if (!imageUrlPath) {
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
        // STANDARD DALL-E FLOW
        // =====================================

        // DALL-E 2 only supports square
        const effectiveSize = model === 'dall-e-2' ? '1024x1024' : dalleImageSize;
        const response = await openai.images.generate({
          model: model,
          prompt: enhancedPrompt,
          n: 1,
          size: effectiveSize,
          quality: model === 'dall-e-3' ? 'standard' : undefined
        });

        imageUrl = response.data[0].url;
      }

      // Re-host the result on R2 so it survives the provider's URL expiry.
      // If this fails, fall back to the (temporary) provider URL rather than
      // failing a generation the user has already been charged for.
      try {
        imageUrl = await persistImageToR2(imageUrl);
      } catch (persistErr) {
        console.error('⚠️ Failed to persist generated image to R2, using provider URL:', persistErr.message);
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

    const generation = await prisma.generation.create({
      data: {
        userId,
        type: 'text',
        prompt,
        model,
        status: 'pending'
      }
    });

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
