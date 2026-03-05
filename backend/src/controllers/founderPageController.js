const { prisma } = require('../config/database');

// =====================================
// Get User's Founder Page
// =====================================
async function getFounderPage(req, res) {
  try {
    const userId = req.user.id;

    const founderPage = await prisma.founderPage.findUnique({
      where: { userId }
    });

    res.json({ founderPage });

  } catch (error) {
    console.error('Get founder page error:', error);
    res.status(500).json({
      error: 'Failed to get founder page',
      message: error.message
    });
  }
}

// =====================================
// Create or Update Founder Page
// =====================================
async function upsertFounderPage(req, res) {
  try {
    const userId = req.user.id;
    const {
      username,
      template,
      design,
      basicInfo,
      contact,
      services,
      portfolio,
      featured
    } = req.body;

    // Check if username is taken by another user
    if (username) {
      const existing = await prisma.founderPage.findUnique({
        where: { username }
      });

      if (existing && existing.userId !== userId) {
        return res.status(400).json({
          error: 'Username already taken'
        });
      }
    }

    // Upsert founder page
    const founderPage = await prisma.founderPage.upsert({
      where: { userId },
      update: {
        username,
        template,
        design,
        basicInfo,
        contact,
        services,
        portfolio,
        featured
      },
      create: {
        userId,
        username,
        template: template || 'visionary',
        design,
        basicInfo,
        contact,
        services,
        portfolio,
        featured
      }
    });

    res.json({
      message: 'Founder page saved successfully',
      founderPage
    });

  } catch (error) {
    console.error('Upsert founder page error:', error);
    res.status(500).json({
      error: 'Failed to save founder page',
      message: error.message
    });
  }
}

// =====================================
// Publish/Unpublish Page
// =====================================
async function publishFounderPage(req, res) {
  try {
    const userId = req.user.id;
    const { published } = req.body;

    const founderPage = await prisma.founderPage.update({
      where: { userId },
      data: { published }
    });

    res.json({
      message: published ? 'Page published successfully' : 'Page unpublished',
      founderPage
    });

  } catch (error) {
    console.error('Publish founder page error:', error);
    res.status(500).json({
      error: 'Failed to publish page',
      message: error.message
    });
  }
}

// =====================================
// Get Public Founder Page by Username
// =====================================
async function getPublicFounderPage(req, res) {
  try {
    const { username } = req.params;

    const founderPage = await prisma.founderPage.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!founderPage) {
      return res.status(404).json({
        error: 'Page not found'
      });
    }

    if (!founderPage.published) {
      return res.status(403).json({
        error: 'This page is not published'
      });
    }

    res.json({ founderPage });

  } catch (error) {
    console.error('Get public founder page error:', error);
    res.status(500).json({
      error: 'Failed to get page',
      message: error.message
    });
  }
}

// =====================================
// Check Username Availability
// =====================================
async function checkUsername(req, res) {
  try {
    const { username } = req.params;
    const userId = req.user?.id;

    const existing = await prisma.founderPage.findUnique({
      where: { username }
    });

    // Available if doesn't exist or belongs to current user
    const available = !existing || existing.userId === userId;

    res.json({ available });

  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({
      error: 'Failed to check username',
      message: error.message
    });
  }
}

// =====================================
// Delete Founder Page
// =====================================
async function deleteFounderPage(req, res) {
  try {
    const userId = req.user.id;

    await prisma.founderPage.delete({
      where: { userId }
    });

    res.json({
      message: 'Founder page deleted successfully'
    });

  } catch (error) {
    console.error('Delete founder page error:', error);
    res.status(500).json({
      error: 'Failed to delete page',
      message: error.message
    });
  }
}

module.exports = {
  getFounderPage,
  upsertFounderPage,
  publishFounderPage,
  getPublicFounderPage,
  checkUsername,
  deleteFounderPage
};