const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../config/auth');
const { generateToken } = require('../config/jwt');
const { OAuth2Client } = require('google-auth-library');
const { generateUniqueCode } = require('./referralController');

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

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        marketingConsent: !!marketingConsent
      },
      select: {
        id: true,
        email: true,
        name: true,
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
          profilePictureUrl: picture
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
        founderPage: { select: { username: true, published: true, template: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users, total: users.length });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
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
  getAdminUsers
};