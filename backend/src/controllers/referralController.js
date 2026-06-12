const { prisma } = require('../config/database');

const ADMIN_EMAIL = 'admin@automatesagency.com';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

async function generateUniqueCode() {
  let attempts = 0;
  while (attempts < 20) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    const exists = await prisma.referralCode.findUnique({ where: { code } });
    if (!exists) return code;
    attempts++;
  }
  throw new Error('Could not generate unique code after 20 attempts');
}

// POST /referral/use — user enters a code to unlock founder page access
async function useCode(req, res) {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    if (req.user.referralVerified) {
      return res.json({ message: 'Already verified', alreadyVerified: true });
    }

    const referralCode = await prisma.referralCode.findUnique({
      where: { code: code.toUpperCase().trim() }
    });

    if (!referralCode || !referralCode.isActive) {
      return res.status(400).json({ error: 'Invalid or inactive code' });
    }

    if (referralCode.ownerId === userId) {
      return res.status(400).json({ error: 'You cannot use your own referral code' });
    }

    if (referralCode.maxUses !== -1 && referralCode.usedCount >= referralCode.maxUses) {
      return res.status(400).json({ error: 'This code has reached its maximum uses' });
    }

    const existing = await prisma.referralUsage.findUnique({ where: { userId } });
    if (existing) {
      // Already redeemed a code before — just ensure verified
      await prisma.user.update({ where: { id: userId }, data: { referralVerified: true } });
      return res.json({ message: 'Access unlocked' });
    }

    await prisma.$transaction([
      prisma.referralUsage.create({ data: { codeId: referralCode.id, userId } }),
      prisma.referralCode.update({
        where: { id: referralCode.id },
        data: { usedCount: { increment: 1 } }
      }),
      prisma.user.update({ where: { id: userId }, data: { referralVerified: true } })
    ]);

    res.json({ message: 'Access unlocked successfully' });
  } catch (error) {
    console.error('Use code error:', error);
    res.status(500).json({ error: 'Failed to apply code' });
  }
}

// GET /referral/my-code — get user's personal code + who used it
async function getMyCode(req, res) {
  try {
    const userId = req.user.id;

    let myCode = await prisma.referralCode.findUnique({
      where: { ownerId: userId },
      include: {
        uses: {
          include: {
            user: { select: { name: true, email: true, createdAt: true } }
          },
          orderBy: { usedAt: 'desc' }
        }
      }
    });

    // Create personal code if not yet generated (legacy users)
    if (!myCode) {
      const code = await generateUniqueCode();
      myCode = await prisma.referralCode.create({
        data: { code, ownerId: userId, maxUses: 5 },
        include: {
          uses: {
            include: { user: { select: { name: true, email: true, createdAt: true } } }
          }
        }
      });
    }

    res.json({ referralCode: myCode });
  } catch (error) {
    console.error('Get my code error:', error);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
}

// POST /admin/referral/generate — admin generates campaign codes
async function adminGenerateCodes(req, res) {
  try {
    if (req.user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { count = 1, maxUses = 5 } = req.body;
    const safeCount = Math.min(Math.max(1, count), 100);
    const safeMaxUses = maxUses === 0 ? -1 : maxUses; // 0 means unlimited

    const codes = [];
    for (let i = 0; i < safeCount; i++) {
      const code = await generateUniqueCode();
      const created = await prisma.referralCode.create({
        data: { code, ownerId: null, maxUses: safeMaxUses }
      });
      codes.push(created);
    }

    res.json({ codes, generated: codes.length });
  } catch (error) {
    console.error('Admin generate codes error:', error);
    res.status(500).json({ error: 'Failed to generate codes' });
  }
}

// GET /admin/referral/codes — admin views all campaign codes + usage
async function adminGetCodes(req, res) {
  try {
    if (req.user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const codes = await prisma.referralCode.findMany({
      where: { ownerId: null },
      include: {
        uses: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { usedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ codes });
  } catch (error) {
    console.error('Admin get codes error:', error);
    res.status(500).json({ error: 'Failed to get codes' });
  }
}

// PATCH /admin/referral/codes/:id/toggle — revoke or reactivate a code
async function adminToggleCode(req, res) {
  try {
    if (req.user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const code = await prisma.referralCode.findUnique({ where: { id } });
    if (!code) return res.status(404).json({ error: 'Code not found' });

    const updated = await prisma.referralCode.update({
      where: { id },
      data: { isActive: !code.isActive }
    });

    res.json({ code: updated });
  } catch (error) {
    console.error('Admin toggle code error:', error);
    res.status(500).json({ error: 'Failed to toggle code' });
  }
}

// GET /admin/referral/stats — overview stats for admin dashboard
async function adminGetStats(req, res) {
  try {
    if (req.user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [totalUsers, verifiedUsers, totalCodes, totalRedemptions] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { referralVerified: true } }),
      prisma.referralCode.count({ where: { ownerId: null } }),
      prisma.referralUsage.count()
    ]);

    res.json({ totalUsers, verifiedUsers, totalCodes, totalRedemptions });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}

module.exports = {
  useCode,
  getMyCode,
  adminGenerateCodes,
  adminGetCodes,
  adminToggleCode,
  adminGetStats,
  generateUniqueCode
};
