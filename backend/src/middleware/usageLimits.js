const { prisma } = require('../config/database');

// Check daily usage limits
async function checkUsageLimits(req, res, next) {
  try {
    const userId = req.user.id;
    const generationType = req.path.includes('/image') ? 'image' : 'text';

    // Define limits
    const limits = {
      image: 10,  // 10 images per day
      text: 50    // 50 text generations per day
    };

    // Get today's start time
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Count today's generations
    const todayCount = await prisma.generation.count({
      where: {
        userId,
        type: generationType,
        createdAt: {
          gte: todayStart
        }
      }
    });

    // Check if limit exceeded
    if (todayCount >= limits[generationType]) {
      return res.status(429).json({
        error: 'Daily limit exceeded',
        message: `You have reached your daily limit of ${limits[generationType]} ${generationType} generations. Limit resets at midnight.`,
        limit: limits[generationType],
        used: todayCount
      });
    }

    // Add usage info to request
    req.usageInfo = {
      limit: limits[generationType],
      used: todayCount,
      remaining: limits[generationType] - todayCount
    };

    next();

  } catch (error) {
    console.error('Usage limit check error:', error);
    res.status(500).json({
      error: 'Failed to check usage limits',
      message: error.message
    });
  }
}

module.exports = { checkUsageLimits };