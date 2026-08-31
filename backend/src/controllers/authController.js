const { prisma } = require('../config/database');
const { normalizeEmail, isValidEmail, findUserByEmail } = require('../utils/email');
const { createSecureToken, hashToken, TTL } = require('../utils/tokens');
const { hashPassword, comparePassword } = require('../config/auth');
const { generateToken } = require('../config/jwt');
const { OAuth2Client } = require('google-auth-library');
const { generateUniqueCode } = require('./referralController');
const { sendVerificationEmail } = require('../config/email');
const { isAdmin } = require('../config/admins');
const { getPlan } = require('../config/plans');
const { GENERATION_COST_CENTS } = require('../config/costs');

// Canonical public app URL used to build links in emails. Prefer a dedicated
// APP_URL (e.g. https://personify.so) so email links don't depend on the order
// of the FRONTEND_URL CORS list; fall back to the first FRONTEND_URL entry.
const APP_URL = () => (process.env.APP_URL || (process.env.FRONTEND_URL || '').split(',')[0] || '').trim().replace(/\/+$/, '');

// Google OAuth client for the authorization-code flow. The client secret is
// required to exchange a code for tokens, and 'postmessage' is the redirect URI
// reserved for the popup/JS code flow (it is not a real URL and does not need
// registering in the Google console).
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

// normalizeEmail / isValidEmail / findUserByEmail live in utils/email so every
// auth path shares one lookup. Password reset was the odd one out and silently
// failed for accounts created before email canonicalization.

function serializeUser(user) {
  const {
    password,
    resetPasswordToken,
    resetPasswordExpires,
    emailVerifyToken,
    emailVerifyExpires,
    role,
    ...safeUser
  } = user;
  return { ...safeUser, isAdmin: isAdmin(user) };
}

/**
 * Register new user
 */
async function register(req, res) {
  try {
    const { password, name, marketingConsent } = req.body;
    const email = normalizeEmail(req.body.email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters'
      });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Email verification token (valid 24h). Only the hash is stored.
    const verification = createSecureToken(TTL.emailVerification);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        marketingConsent: !!marketingConsent,
        emailVerifyToken: verification.tokenHash,
        emailVerifyExpires: verification.expiresAt
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
      await sendVerificationEmail(user.email, user.name, `${APP_URL()}/verify-email?token=${verification.token}`);
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
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await findUserByEmail(email);

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

    res.json({
      message: 'Login successful',
      user: serializeUser(user),
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
    const { name, currentPassword } = req.body;
    const email = normalizeEmail(req.body.email);

    if (name === undefined && req.body.email === undefined) {
      return res.status(400).json({ error: 'At least one field (name or email) is required' });
    }

    const updateData = {};
    let rawVerificationToken = null;
    if (name !== undefined) updateData.name = name;

    if (req.body.email !== undefined && !email) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    if (email && email !== req.user.email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Enter a valid email address' });
      }

      // Email is both a login identifier and a recovery channel.  Require the
      // account password before changing it, then require verification of the
      // new address before email-gated product actions are available again.
      if (!currentPassword) {
        return res.status(400).json({ error: 'Enter your current password to change your email address' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const isPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const existing = await prisma.user.findFirst({
        where: {
          id: { not: userId },
          email: { equals: email, mode: 'insensitive' }
        }
      });
      if (existing) {
        return res.status(400).json({ error: 'Email is already in use' });
      }
      updateData.email = email;
      updateData.emailVerified = false;
      const verification = createSecureToken(TTL.emailVerification);
      updateData.emailVerifyToken = verification.tokenHash;
      updateData.emailVerifyExpires = verification.expiresAt;
      rawVerificationToken = verification.token;
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

    if (updateData.emailVerifyToken) {
      try {
        await sendVerificationEmail(
          updatedUser.email,
          updatedUser.name,
          `${APP_URL()}/verify-email?token=${rawVerificationToken}`
        );
      } catch (emailError) {
        console.error('Failed to send email-change verification:', emailError.message);
      }
    }

    res.json({
      message: updateData.emailVerifyToken
        ? 'Profile updated. Check your new email address to verify it.'
        : 'Profile updated successfully',
      user: updatedUser
    });
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

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
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

/**
 * Google sign-in (authorization-code flow).
 *
 * SECURITY: the client sends a one-time authorization code, never an access
 * token. We exchange it server-side (which requires the client secret, so only
 * we can do it) and then verify the returned ID token's *audience* against our
 * own client id.
 *
 * The audience check is the load-bearing part. Google's userinfo endpoint
 * accepts any valid access token regardless of which OAuth app minted it, so
 * trusting a caller-supplied access token would let anyone who can obtain a
 * token for a victim — via their own Google app — sign in as that victim here.
 * Never reintroduce a path that accepts an access token from the client.
 */
async function googleAuth(req, res) {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Google authorization code is required' });

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google auth is not configured: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing');
      return res.status(503).json({ error: 'Google sign-in is not available right now.' });
    }

    // Exchange the one-time code for tokens. Requires the client secret, so a
    // code intercepted by a third party is useless without it.
    let idToken;
    try {
      const { tokens } = await googleClient.getToken({ code, redirect_uri: 'postmessage' });
      idToken = tokens.id_token;
    } catch (e) {
      console.warn('Google code exchange failed:', e.message);
      return res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
    }
    if (!idToken) return res.status(401).json({ error: 'Google sign-in failed. Please try again.' });

    // Verify signature, issuer, expiry — and critically, that the token was
    // issued for THIS application.
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (e) {
      console.warn('Google ID token verification failed:', e.message);
      return res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
    }

    const googleId = payload?.sub;
    const name = payload?.name;
    const picture = payload?.picture;
    const email = normalizeEmail(payload?.email);

    if (!googleId) return res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
    if (!isValidEmail(email)) {
      return res.status(401).json({ error: 'Google did not return a valid email address' });
    }
    // Only a Google-verified address may be used to match an existing account,
    // otherwise an unverified Google address could claim someone else's login.
    if (payload.email_verified !== true) {
      return res.status(401).json({ error: 'Your Google email address is not verified.' });
    }

    // Identity is keyed on the immutable Google subject id first; the verified
    // email is used only to link a pre-existing password account on first use.
    let user = await prisma.user.findUnique({ where: { googleId } });
    if (!user) user = await findUserByEmail(email);

    if (user) {
      // Update googleId and picture if missing
      if (!user.googleId || !user.profilePictureUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId || googleId,
            profilePictureUrl: user.profilePictureUrl || picture
          },
          select: { id: true, email: true, name: true, profilePictureUrl: true, createdAt: true, role: true }
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
        select: { id: true, email: true, name: true, profilePictureUrl: true, createdAt: true, role: true }
      });

      // Auto-generate personal referral code for new Google user
      // (named referralCode, not code — `code` is the Google auth code above)
      try {
        const referralCode = await generateUniqueCode();
        await prisma.referralCode.create({ data: { code: referralCode, ownerId: user.id, maxUses: 5 } });
      } catch (e) {
        console.error('Failed to create referral code for Google user:', e.message);
      }
    }

    const token = generateToken(user.id);
    res.json({ message: 'Google login successful', user: serializeUser(user), token });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
}

async function getAdminUsers(req, res) {
  try {
    if (!req.user.isAdmin) {
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
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Access denied' });
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
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Access denied' });
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
      where: { emailVerifyToken: hashToken(token), emailVerifyExpires: { gte: new Date() } }
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

    const verification = createSecureToken(TTL.emailVerification);

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken: verification.tokenHash, emailVerifyExpires: verification.expiresAt }
    });

    await sendVerificationEmail(user.email, user.name, `${APP_URL()}/verify-email?token=${verification.token}`);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
}

// GET /auth/admin/financials — revenue/margin/cost + referral affiliate stats
async function getAdminFinancials(req, res) {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Access denied' });
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── Subscriptions / MRR ──
    const paidUsers = await prisma.user.findMany({
      where: { plan: { not: 'free' } },
      select: { plan: true, billingInterval: true, subscriptionStatus: true },
    });
    const activeByPlan = { starter: 0, pro: 0, studio: 0 };
    let trialing = 0, pastDue = 0, mrrCents = 0;
    for (const u of paidUsers) {
      if (u.subscriptionStatus === 'trialing') trialing++;
      else if (u.subscriptionStatus === 'past_due') pastDue++;
      else if (u.subscriptionStatus === 'active') {
        if (activeByPlan[u.plan] !== undefined) activeByPlan[u.plan]++;
        const p = getPlan(u.plan);
        const monthly = u.billingInterval === 'yearly' ? (p.yearlyPriceAud || 0) / 12 : (p.monthlyPriceAud || 0);
        mrrCents += Math.round(monthly * 100);
      }
    }

    // ── Cost this month ──
    const [imageCount, textCount] = await Promise.all([
      prisma.generation.count({ where: { type: 'image', status: { not: 'failed' }, createdAt: { gte: monthStart } } }),
      prisma.generation.count({ where: { type: 'text', status: { not: 'failed' }, createdAt: { gte: monthStart } } }),
    ]);
    const costCents = imageCount * GENERATION_COST_CENTS.image + textCount * GENERATION_COST_CENTS.text;

    // ── Referral / affiliate ──
    const [pendingAgg, walletAgg, monthCommAgg, lifetimeCommAgg, referredTotal, referredPaid] = await Promise.all([
      prisma.commission.aggregate({ where: { status: 'pending' }, _sum: { amountCents: true } }),
      prisma.user.aggregate({ _sum: { creditCents: true } }),
      prisma.commission.aggregate({ where: { status: { not: 'reversed' }, createdAt: { gte: monthStart } }, _sum: { amountCents: true } }),
      prisma.commission.aggregate({ where: { status: { not: 'reversed' } }, _sum: { amountCents: true } }),
      prisma.user.count({ where: { referredById: { not: null } } }),
      prisma.user.count({ where: { referredById: { not: null }, subscriptionStatus: { in: ['active', 'trialing'] }, plan: { not: 'free' } } }),
    ]);
    const outstandingLiabilityCents = (pendingAgg._sum.amountCents || 0) + (walletAgg._sum.creditCents || 0);

    // Top referrers by lifetime earnings
    const grouped = await prisma.commission.groupBy({
      by: ['referrerId'],
      where: { status: { not: 'reversed' } },
      _sum: { amountCents: true },
      orderBy: { _sum: { amountCents: 'desc' } },
      take: 10,
    });
    const referrerIds = grouped.map(g => g.referrerId);
    const [referrerUsers, refCounts] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: referrerIds } }, select: { id: true, name: true, email: true } }),
      prisma.user.groupBy({ by: ['referredById'], where: { referredById: { in: referrerIds } }, _count: { id: true } }),
    ]);
    const refCountMap = Object.fromEntries(refCounts.map(r => [r.referredById, r._count.id]));
    const topReferrers = grouped.map(g => {
      const u = referrerUsers.find(x => x.id === g.referrerId);
      return { name: u?.name || null, email: u?.email || '', earnedCents: g._sum.amountCents || 0, referredCount: refCountMap[g.referrerId] || 0 };
    });

    // ── Top users by usage this month ──
    const topGen = await prisma.generation.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: monthStart }, status: { not: 'failed' } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    });
    const topUserIds = topGen.map(g => g.userId);
    const topUsersData = await prisma.user.findMany({ where: { id: { in: topUserIds } }, select: { id: true, name: true, email: true, plan: true } });
    const topUsers = topGen.map(g => {
      const u = topUsersData.find(x => x.id === g.userId);
      return { name: u?.name || null, email: u?.email || '', plan: u?.plan || 'free', generations: g._count.id };
    });

    res.json({
      subscriptions: { activeByPlan, trialing, pastDue, mrrCents, activeTotal: activeByPlan.starter + activeByPlan.pro + activeByPlan.studio },
      cost: { thisMonthCents: costCents, imageCount, textCount, rates: GENERATION_COST_CENTS },
      marginCents: mrrCents - costCents,
      referral: {
        outstandingLiabilityCents,
        commissionsThisMonthCents: monthCommAgg._sum.amountCents || 0,
        lifetimeCommissionsCents: lifetimeCommAgg._sum.amountCents || 0,
        referredTotal,
        referredPaid,
        topReferrers,
      },
      topUsers,
    });
  } catch (error) {
    console.error('Admin financials error:', error);
    res.status(500).json({ error: 'Failed to load financials' });
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
  getAdminFinancials,
};
