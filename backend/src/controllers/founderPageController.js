const { prisma } = require('../config/database');
const { uploadToR2, deleteFromR2 } = require('../config/r2');
const { isReservedUsername } = require('../config/reservedUsernames');

const USERNAME_REGEX = /^[a-z0-9-]{3,30}$/;

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
    res.status(500).json({ error: 'Failed to get founder page' });
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
      featured,
      faq,
      ecommerce
    } = req.body;

    // Server-side username validation
    if (username && !USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-30 characters and contain only lowercase letters, numbers, and hyphens'
      });
    }

    // Founder Pages live at the site root, so a claimed word blocks that path
    // for the site itself. See config/reservedUsernames.
    if (username && isReservedUsername(username)) {
      return res.status(400).json({
        error: 'That username is reserved. Please choose another.'
      });
    }

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
        featured,
        faq,
        ecommerce
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
        featured,
        faq,
        ecommerce
      }
    });

    res.json({
      message: 'Founder page saved successfully',
      founderPage
    });

  } catch (error) {
    console.error('Upsert founder page error:', error);
    res.status(500).json({ error: 'Failed to save founder page' });
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
    res.status(500).json({ error: 'Failed to publish page' });
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
            name: true
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
    res.status(500).json({ error: 'Failed to get page' });
  }
}

// =====================================
// List Published Pages (public — powers the sitemap)
// =====================================
// Returns only what a sitemap needs: the public slug and when it last changed.
// No profile content, no owner details. Everything here is already reachable
// at /:username, so this exposes nothing that was not already public.
const SITEMAP_MAX = 5000;

async function listPublishedFounderPages(req, res) {
  try {
    const pages = await prisma.founderPage.findMany({
      where: { published: true },
      select: { username: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: SITEMAP_MAX
    });

    // If this ever hits the cap the sitemap is silently truncated, so say so.
    if (pages.length === SITEMAP_MAX) {
      console.warn(`⚠️  Published page list hit the ${SITEMAP_MAX} cap — sitemap needs pagination.`);
    }

    res.json({ pages, count: pages.length });
  } catch (error) {
    console.error('List published founder pages error:', error);
    res.status(500).json({ error: 'Failed to list published pages' });
  }
}

// =====================================
// Preview Own Founder Page (auth, ignores published)
// =====================================
async function previewFounderPage(req, res) {
  try {
    const userId = req.user.id;

    const founderPage = await prisma.founderPage.findUnique({
      where: { userId }
    });

    if (!founderPage) {
      return res.status(404).json({ error: 'No founder page found' });
    }

    res.json({ founderPage });
  } catch (error) {
    console.error('Preview founder page error:', error);
    res.status(500).json({ error: 'Failed to get preview' });
  }
}

// =====================================
// Check Username Availability
// =====================================
async function checkUsername(req, res) {
  try {
    const { username } = req.params;
    const userId = req.user?.id;

    if (!USERNAME_REGEX.test(username)) {
      return res.json({ available: false, reason: 'Invalid format' });
    }

    if (isReservedUsername(username)) {
      return res.json({ available: false, reason: 'Reserved' });
    }

    const existing = await prisma.founderPage.findUnique({
      where: { username }
    });

    // Available if doesn't exist or belongs to current user
    const available = !existing || existing.userId === userId;

    res.json({ available });

  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ error: 'Failed to check username' });
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
    res.status(500).json({ error: 'Failed to delete page' });
  }
}

module.exports = {
  getFounderPage,
  listPublishedFounderPages,
  upsertFounderPage,
  publishFounderPage,
  getPublicFounderPage,
  previewFounderPage,
  checkUsername,
  deleteFounderPage
};
