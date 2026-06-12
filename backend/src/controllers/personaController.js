const { prisma } = require('../config/database');
const { uploadToR2, deleteFromR2 } = require('../config/r2');

// Returns detected MIME type from buffer magic bytes, or null if not a recognised image
function validateImageBytes(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return 'image/gif';
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'image/webp';
  // HEIC/HEIF: 'ftyp' box at offset 4
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) return 'image/heic';
  return null;
}

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
    res.status(500).json({ error: 'Failed to create persona' });
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
    res.status(500).json({ error: 'Failed to get persona' });
  }
}

// Upload persona image
async function uploadPersonaImage(req, res) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate actual file content against magic bytes (not just Content-Type header)
    const detectedType = validateImageBytes(req.file.buffer);
    if (!detectedType) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and HEIC images are allowed.' });
    }

    // Find or create persona
    let persona = await prisma.persona.findUnique({
      where: { userId: userId }
    });

    if (!persona) {
      // Auto-create empty persona if it doesn't exist
      persona = await prisma.persona.create({
        data: {
          userId,
          bio: null,
          industry: null,
          targetAudience: null,
          brandTone: null
        }
      });
    }

    // Upload to R2
    const imageUrl = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Save to database
    const personaImage = await prisma.personaImage.create({
      data: {
        personaId: persona.id,
        imageUrl: imageUrl,
      }
    });

    res.json({
      message: 'Image uploaded successfully',
      image: personaImage
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}

// Delete persona image
async function deletePersonaImage(req, res) {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;

    const image = await prisma.personaImage.findUnique({
      where: { id: imageId },
      include: { persona: true }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (image.persona.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete from R2
    await deleteFromR2(image.imageUrl);

    // Delete from database
    await prisma.personaImage.delete({
      where: { id: imageId }
    });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
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

    // Delete all images from R2
    for (const image of persona.personaImages) {
      const imageUrl = image.imageUrl || image.url;
      if (imageUrl) {
        await deleteFromR2(imageUrl);
      }
    }

    // Delete persona (cascade will delete image records from DB)
    await prisma.persona.delete({
      where: { userId }
    });

    res.json({
      message: 'Persona deleted successfully'
    });
  } catch (error) {
    console.error('Delete persona error:', error);
    res.status(500).json({ error: 'Failed to delete persona' });
  }
}

module.exports = {
  createPersona,
  getPersona,
  uploadPersonaImage,
  deletePersonaImage,
  deletePersona
};
