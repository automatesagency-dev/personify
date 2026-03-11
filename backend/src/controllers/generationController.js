const { prisma } = require('../config/database');
const { openai } = require('../config/ai');
const { fal } = require('../config/fal');

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
      faceModel = 'nano-banana-2'
    } = req.body;

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
        console.log(`🎨 Using Fal.ai ${faceModel}...`);

        const personaImage = persona.personaImages[0];
        let backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        
        // Ensure backendUrl has protocol
        if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
          backendUrl = `https://${backendUrl}`;
        }
        
        // Get image path
        const imagePath = personaImage.imageUrl;
        
        if (!imagePath) {
          return res.status(400).json({
            error: 'Persona image path not found. Please re-upload your persona images.'
          });
        }
        
        // Construct full URL
        const imageUrlPath = `${backendUrl}${imagePath}`;

        console.log('📸 Persona image URL:', imageUrlPath);
        console.log('✍️ Prompt:', enhancedPrompt);

        let result;

        try {
          if (faceModel === 'nano-banana-2') {
            result = await fal.subscribe('fal-ai/nano-banana-2/edit', {
              input: {
                image_urls: [imageUrlPath],
                prompt: enhancedPrompt,
                image_size: 'square_hd',
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
                  image_urls: [imageUrlPath],
                  prompt: enhancedPrompt,
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

        const response = await openai.images.generate({
          model: model,
          prompt: enhancedPrompt,
          n: 1,
          size: '1024x1024',
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
    const { prompt, model = 'gpt-4' } = req.body;

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
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
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