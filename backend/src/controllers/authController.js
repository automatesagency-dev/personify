const crypto = require('crypto');
const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../config/auth');
const { generateToken } = require('../config/jwt');
const { OAuth2Client } = require('google-auth-library');
const { generateUniqueCode } = require('./referralController');
const { sendVerificationEmail } = require('../config/email');

// Canonical public app URL used to build links in emails. Prefer a dedicated
// APP_URL (e.g. https://personify.so) so email links don't depend on the order
// of the FRONTEND_URL CORS list; fall back to the first FRONTEND_URL entry.
const APP_URL = () => (process.env.APP_URL || (process.env.FRONTEND_URL || '').split(',')[0] || '').trim().replace(/\/+$/, '');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Register new user
 */
async function register(req, res) {
  try {
    const { email, password, name, marketingConsent } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Email verification token (valid 24h)
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        marketingConsent: !!marketingConsent,
        emailVerifyToken,
        emailVerifyExpires
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Auto-generate personal referral code for new user
    try {
      const code = await generateUniqueCode();
      await prisma.referralCode.create({ data: { code, ownerId: user.id, maxUses: 5 } });
    } catch (e) {
      console.error('Failed to create referral code for new user:', e.message);
    }

    // Send verification email (non-fatal — user can request a resend later)
    try {
      await sendVerificationEmail(user.email, user.name, `${APP_URL()}/verify-email?token=${emailVerifyToken}`);
    } catch (e) {
      console.error('Failed to send verification email:', e.message);
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Get current user (protected route)
 */
async function getMe(req, res) {
  try {
    // User is already attached by authenticateUser middleware
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
}

/**
 * Update user profile picture
 */
const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profilePictureUrl } = req.body;

    if (!profilePictureUrl) {
      return res.status(400).json({ error: 'Profile picture URL is required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePictureUrl },
      select: {
        id: true,
        email: true,
        name: true,
        profilePictureUrl: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Profile picture updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
};

/**
 * Update user profile (name, email)
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ error: 'At least one field (name or email) is required' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;

    if (email && email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email is already in use' });
      }
      updateData.email = email;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        profilePictureUrl: true,
        createdAt: true
      }
    });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

/**
 * Update user password
 */
async function updatePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
}

async function googleAuth(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Google credential is required' });

    // Verify access token by fetching user info from Google
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${credential}` }
    });
    if (!googleRes.ok) return res.status(401).json({ error: 'Invalid Google token' });
    const { email, name, picture, sub: googleId } = await googleRes.json();

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Update googleId and picture if missing
      if (!user.googleId || !user.profilePictureUrl) {
        user = await prisma.user.update({
          where: { email },
          data: {
            googleId: user.googleId || googleId,
            profilePictureUrl: user.profilePictureUrl || picture
          },
          select: { id: true, email: true, name: true, profilePictureUrl: true, createdAt: true }
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: await hashPassword(googleId + process.env.JWT_SECRET),
          googleId,
          profilePictureUrl: picture,
          emailVerified: true // Google has already verified this email
        },
        select: { id: true, email: true, name: true, profilePictureUrl: true, createdAt: true }
      });

      // Auto-generate personal referral code for new Google user
      try {
        const code = await generateUniqueCode();
        await prisma.referralCode.create({ data: { code, ownerId: user.id, maxUses: 5 } });
      } catch (e) {
        console.error('Failed to create referral code for Google user:', e.message);
      }
    }

    const token = generateToken(user.id);
    res.json({ message: 'Google login successful', user, token });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
}

const ADMIN_EMAIL = 'admin@automatesagency.com';

async function getAdminUsers(req, res) {
  try {
    if (req.user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        profilePictureUrl: true,
        googleId: true,
        _count: { select: { generations: true } },
        founderPage: { select: { username: true, published: true, template: true } },
        persona: { select: { id: true, industry: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users, total: users.length });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
}

async function getAdminOverview(req, res) {
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Access denied' });
  try {
    const [totalUsers, googleUsers, usersWithPersona, publishedPages, totalGenerations] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { googleId: { not: null } } }),
      prisma.persona.count(),
      prisma.founderPage.count({ where: { published: true } }),
      prisma.generation.count(),
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); sevenDaysAgo.setHours(0, 0, 0, 0);

    const [todayImages, todayText, newUsersWeek, recentGens] = await Promise.all([
      prisma.generation.count({ where: { createdAt: { gte: today }, type: 'image' } }),
      prisma.generation.count({ where: { createdAt: { gte: today }, type: 'text' } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.generation.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true, type: true } }),
    ]);

    const dailyMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = { label: d.toLocaleDateString('en-US', { weekday: 'short' }), images: 0, text: 0 };
    }
    recentGens.forEach(g => {
      const key = new Date(g.createdAt).toISOString().split('T')[0];
      if (dailyMap[key]) {
        if (g.type === 'image') dailyMap[key].images++;
        else dailyMap[key].text++;
      }
    });

    const allGens = await prisma.generation.findMany({ select: { model: true } });
    const modelMap = {};
    allGens.forEach(g => { modelMap[g.model] = (modelMap[g.model] || 0) + 1; });
    const modelUsage = Object.entries(modelMap)
      .sort(([, a], [, b]) => b - a)
      .map(([model, count]) => ({ model, count, pct: totalGenerations ? Math.round((count / totalGenerations) * 100) : 0 }));

    const recentActivity = await prisma.generation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, model: true, status: true, createdAt: true, prompt: true,
        user: { select: { name: true, email: true } },
      },
    });

    res.json({
      users: { total: totalUsers, google: googleUsers, withPersona: usersWithPersona, publishedPages, newThisWeek: newUsersWeek },
      generations: { total: totalGenerations, todayImages, todayText, todayTotal: todayImages + todayText },
      dailyCounts: Object.values(dailyMap),
      modelUsage,
      recentActivity,
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to get overview' });
  }
}

async function getAdminAllGenerations(req, res) {
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Access denied' });
  try {
    const generations = await prisma.generation.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, prompt: true, model: true, status: true, createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });
    res.json({ generations });
  } catch (error) {
    console.error('Admin generations error:', error);
    res.status(500).json({ error: 'Failed to get generations' });
  }
}

/**
 * Verify email with token (public)
 */
async function verifyEmail(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification token is required' });

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token, emailVerifyExpires: { gte: new Date() } }
    });

    if (!user) {
      return res.status(400).json({ error: 'This verification link is invalid or has expired.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null }
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
}

/**
 * Resend verification email (authenticated)
 */
async function resendVerification(req, res) {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.json({ message: 'Email already verified', alreadyVerified: true });

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken, emailVerifyExpires }
    });

    await sendVerificationEmail(user.email, user.name, `${APP_URL()}/verify-email?token=${emailVerifyToken}`);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfilePicture,
  updateProfile,
  updatePassword,
  googleAuth,
  verifyEmail,
  resendVerification,
  getAdminUsers,
  getAdminOverview,
  getAdminAllGenerations,
};