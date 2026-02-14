const { prisma } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Create or update persona
async function createPersona(req, res) {
  try {
    const userId = req.user.id;
    const { bio, industry, targetAudience, brandTone } = req.body;

    // Check if persona already exists for this user
    const existingPersona = await prisma.persona.findUnique({
      where: { userId }
    });

    let persona;

    if (existingPersona) {
      // Update existing persona
      persona = await prisma.persona.update({
        where: { userId },
        data: {
          bio: bio || existingPersona.bio,
          industry: industry || existingPersona.industry,
          targetAudience: targetAudience || existingPersona.targetAudience,
          brandTone: brandTone || existingPersona.brandTone
        },
        include: {
          personaImages: true
        }
      });

      return res.json({
        message: 'Persona updated successfully',
        persona
      });
    } else {
      // Create new persona
      persona = await prisma.persona.create({
        data: {
          userId,
          bio: bio || null,
          industry: industry || null,
          targetAudience: targetAudience || null,
          brandTone: brandTone || null
        },
        include: {
          personaImages: true
        }
      });

      return res.status(201).json({
        message: 'Persona created successfully',
        persona
      });
    }
  } catch (error) {
    console.error('Create persona error:', error);
    res.status(500).json({
      error: 'Failed to create persona',
      message: error.message
    });
  }
}

// Get user's persona
async function getPersona(req, res) {
  try {
    const userId = req.user.id;

    const persona = await prisma.persona.findUnique({
      where: { userId },
      include: {
        personaImages: true
      }
    });

    if (!persona) {
      return res.status(404).json({
        error: 'Persona not found. Please create a persona first.'
      });
    }

    res.json({ persona });
  } catch (error) {
    console.error('Get persona error:', error);
    res.status(500).json({
      error: 'Failed to get persona',
      message: error.message
    });
  }
}

// Upload persona image
async function uploadPersonaImage(req, res) {
  try {
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    // Get or create persona
    let persona = await prisma.persona.findUnique({
      where: { userId }
    });

    if (!persona) {
      // Create persona if it doesn't exist
      persona = await prisma.persona.create({
        data: { userId }
      });
    }

    // Save image reference to database
    const imageUrl = `/uploads/${req.file.filename}`;
    
    const personaImage = await prisma.personaImage.create({
      data: {
        personaId: persona.id,
        imageUrl
      }
    });

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: personaImage
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      message: error.message
    });
  }
}

// Delete persona image
async function deletePersonaImage(req, res) {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;

    // Get the image
    const image = await prisma.personaImage.findUnique({
      where: { id: imageId },
      include: {
        persona: true
      }
    });

    if (!image) {
      return res.status(404).json({
        error: 'Image not found'
      });
    }

    // Check if image belongs to user's persona
    if (image.persona.userId !== userId) {
      return res.status(403).json({
        error: 'You do not have permission to delete this image'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../', image.imageUrl);
    try {
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue even if file deletion fails
    }

    // Delete from database
    await prisma.personaImage.delete({
      where: { id: imageId }
    });

    res.json({
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      error: 'Failed to delete image',
      message: error.message
    });
  }
}

// Delete entire persona
async function deletePersona(req, res) {
  try {
    const userId = req.user.id;

    const persona = await prisma.persona.findUnique({
      where: { userId },
      include: {
        personaImages: true
      }
    });

    if (!persona) {
      return res.status(404).json({
        error: 'Persona not found'
      });
    }

    // Delete all image files
    for (const image of persona.personaImages) {
      const filePath = path.join(__dirname, '../../', image.imageUrl);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    }

    // Delete persona (cascade will delete images)
    await prisma.persona.delete({
      where: { userId }
    });

    res.json({
      message: 'Persona deleted successfully'
    });
  } catch (error) {
    console.error('Delete persona error:', error);
    res.status(500).json({
      error: 'Failed to delete persona',
      message: error.message
    });
  }
}

module.exports = {
  createPersona,
  getPersona,
  uploadPersonaImage,
  deletePersonaImage,
  deletePersona
};