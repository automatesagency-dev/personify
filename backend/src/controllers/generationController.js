const { prisma } = require('../config/database');
const { openai } = require('../config/openai');

// Generate Image with DALL-E
async function generateImage(req, res) {
  try {
    const userId = req.user.id;
    const { prompt, model = 'dall-e-3' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    // Get user's persona to enhance the prompt
    const persona = await prisma.persona.findUnique({
      where: { userId },
      include: { personaImages: true }
    });

    // Enhance prompt with persona context
    let enhancedPrompt = prompt;
    if (persona) {
      const personaContext = [];
      if (persona.bio) personaContext.push(persona.bio);
      if (persona.industry) personaContext.push(`Industry: ${persona.industry}`);
      if (persona.brandTone) personaContext.push(`Tone: ${persona.brandTone}`);
      
      if (personaContext.length > 0) {
        enhancedPrompt = `${personaContext.join('. ')}. ${prompt}`;
      }
    }

    // Create pending generation record
    const generation = await prisma.generation.create({
      data: {
        userId,
        type: 'image',
        prompt: prompt,
        model: model,
        status: 'pending'
      }
    });

    try {
      // Call OpenAI DALL-E API
      const response = await openai.images.generate({
        model: model,
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      });

      const imageUrl = response.data[0].url;

      // Update generation with result
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
        imageUrl: imageUrl
      });

    } catch (openaiError) {
      // Update generation with error
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'failed',
          errorMessage: openaiError.message
        }
      });

      throw openaiError;
    }

  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      message: error.message
    });
  }
}

// Generate Text with GPT
async function generateText(req, res) {
  try {
    const userId = req.user.id;
    const { prompt, model = 'gpt-4' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    // Get user's persona to enhance the prompt
    const persona = await prisma.persona.findUnique({
      where: { userId }
    });

    // Build system message with persona context
    let systemMessage = 'You are a helpful AI assistant.';
    if (persona) {
      const personaContext = [];
      if (persona.bio) personaContext.push(persona.bio);
      if (persona.industry) personaContext.push(`Industry: ${persona.industry}`);
      if (persona.targetAudience) personaContext.push(`Target audience: ${persona.targetAudience}`);
      if (persona.brandTone) personaContext.push(`Brand tone: ${persona.brandTone}`);
      
      if (personaContext.length > 0) {
        systemMessage = `You are a content creator with this profile: ${personaContext.join('. ')}. Create content that matches this persona.`;
      }
    }

    // Create pending generation record
    const generation = await prisma.generation.create({
      data: {
        userId,
        type: 'text',
        prompt: prompt,
        model: model,
        status: 'pending'
      }
    });

    try {
      // Call OpenAI Chat API
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const generatedText = response.choices[0].message.content;

      // Update generation with result
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

    } catch (openaiError) {
      // Update generation with error
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'failed',
          errorMessage: openaiError.message
        }
      });

      throw openaiError;
    }

  } catch (error) {
    console.error('Generate text error:', error);
    res.status(500).json({
      error: 'Failed to generate text',
      message: error.message
    });
  }
}

// Get user's generation history
async function getGenerations(req, res) {
  try {
    const userId = req.user.id;
    const { type, limit = 20 } = req.query;

    const where = { userId };
    if (type === 'image' || type === 'text') {
      where.type = type;
    }

    const generations = await prisma.generation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      count: generations.length,
      generations
    });

  } catch (error) {
    console.error('Get generations error:', error);
    res.status(500).json({
      error: 'Failed to get generations',
      message: error.message
    });
  }
}

// Get single generation by ID
async function getGenerationById(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const generation = await prisma.generation.findUnique({
      where: { id }
    });

    if (!generation) {
      return res.status(404).json({
        error: 'Generation not found'
      });
    }

    // Check if generation belongs to user
    if (generation.userId !== userId) {
      return res.status(403).json({
        error: 'You do not have permission to view this generation'
      });
    }

    res.json({ generation });

  } catch (error) {
    console.error('Get generation error:', error);
    res.status(500).json({
      error: 'Failed to get generation',
      message: error.message
    });
  }
}

// Delete generation
async function deleteGeneration(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const generation = await prisma.generation.findUnique({
      where: { id }
    });

    if (!generation) {
      return res.status(404).json({
        error: 'Generation not found'
      });
    }

    // Check if generation belongs to user
    if (generation.userId !== userId) {
      return res.status(403).json({
        error: 'You do not have permission to delete this generation'
      });
    }

    await prisma.generation.delete({
      where: { id }
    });

    res.json({
      message: 'Generation deleted successfully'
    });

  } catch (error) {
    console.error('Delete generation error:', error);
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