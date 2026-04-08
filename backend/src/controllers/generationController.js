const { prisma } = require('../config/database');
const { openai } = require('../config/ai');
const { fal } = require('../config/fal');
const { uploadToR2 } = require('../config/r2');

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

    // Map aspect ratio to model-specific size strings
    // nano-banana-2 uses aspect_ratio param with these string values
    const nanoAspectRatioMap = {
      square: '1:1',
      portrait: '9:16',
      landscape: '16:9'
    };
    // seedream uses image_size
    const seedreamSizeMap = {
      square: 'square_hd',
      portrait: 'portrait_4_3',
      landscape: 'landscape_4_3'
    };
    const dalleSize = {
      square: '1024x1024',
      portrait: '1024x1792',
      landscape: '1792x1024'
    };
    const nanoAspectRatio = nanoAspectRatioMap[aspectRatio] || '1:1';
    const seedreamImageSize = seedreamSizeMap[aspectRatio] || 'square_hd';
    const dalleImageSize = dalleSize[aspectRatio] || '1024x1024';

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    // Get persona
    const persona = await prisma.persona.findUnique({
      where: { userId },
      include: { personaImages: true }
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
        console.log(`🎨 Using Fal.ai ${faceModel}...`);

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
            console.log(`📎 Reference image ${i + 1} uploaded:`, refUrl);
          } catch (uploadErr) {
            console.warn(`⚠️ Reference image ${i + 1} upload failed, skipping:`, uploadErr.message);
          }
        }

        const imageUrlsForFal = [imageUrlPath, ...referenceUrls];

        console.log('📸 Persona image URL:', imageUrlPath);
        console.log('✍️ Prompt:', enhancedPrompt);

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
              logs: true,
              onQueueUpdate: (update) =>
                console.log('⏳ Queue:', update.status)
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
                logs: true,
                onQueueUpdate: (update) =>
                  console.log('⏳ Queue:', update.status)
              }
            );

          } else {
            throw new Error(`Unsupported face model: ${faceModel}`);
          }

          if (result.images && result.images.length > 0) {
            imageUrl = result.images[0].url;
            console.log('✅ Fal.ai generation successful');
          } else {
            throw new Error('Fal.ai did not return any images');
          }

        } catch (falError) {
          console.error('❌ Fal.ai error:', falError.message);
          console.error('❌ Fal.ai error status:', falError.status);
          console.error('❌ Fal.ai error body:', JSON.stringify(falError.body, null, 2));
          throw falError;
        }

      } else {
        // =====================================
        // STANDARD DALL-E FLOW
        // =====================================
        console.log('🖼 Using DALL-E...');

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
      console.error('AI Generation error:', aiError.message);

      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'failed',
          errorMessage: aiError.message
        }
      });

      throw aiError;
    }

  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      message: error.message
    });
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
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'failed',
          errorMessage: err.message
        }
      });

      throw err;
    }

  } catch (error) {
    console.error('Generate text error:', error);
    res.status(500).json({
      error: 'Failed to generate text',
      message: error.message
    });
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
    res.status(500).json({
      error: 'Failed to get generations',
      message: error.message
    });
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
    res.status(500).json({
      error: 'Failed to get generation',
      message: error.message
    });
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
    res.status(500).json({
      error: 'Failed to delete generation',
      message: error.message
    });
  }
}

module.exports = {
  generateImage,
  generateText,
  getGenerations,
  getGenerationById,
  deleteGeneration
};