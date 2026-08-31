const { verifyToken } = require('../config/jwt');
const { prisma } = require('../config/database');
const { isAdmin } = require('../config/admins');

// Middleware to protect routes
async function authenticateUser(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided. Please login.' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        error: 'Invalid or expired token. Please login again.' 
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, profilePictureUrl: true, referralVerified: true, emailVerified: true, plan: true, subscriptionStatus: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found.' 
      });
    }

    // Attach user to request
    req.user = user;
    req.user.isAdmin = isAdmin(user);
    next();
  } catch (error) {
    return res.status(500).json({ 
      error: 'Authentication failed.',
      message: error.message 
    });
  }
}

// Restrict a route to administrators.
//
// Authorization belongs on the route, not inside each handler. It was
// previously copy-pasted into eleven controllers, which made an admin endpoint
// indistinguishable from an ordinary authenticated one at the routing layer —
// so a single omission in a new handler would expose every user's email,
// revenue figures and prompt history. Must run after authenticateUser.
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

// Require a verified email for gated actions (e.g. content generation).
// Must run after authenticateUser so req.user is populated.
function requireVerifiedEmail(req, res, next) {
  if (!req.user?.emailVerified) {
    return res.status(403).json({
      error: 'Please verify your email to use this feature. Check your inbox for the verification link.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
}

// Founder Pages are an invite-only feature. The UI already presents this
// restriction, but enforcement must live on the API as well so a caller cannot
// bypass it by invoking the endpoint directly.
function requireFounderAccess(req, res, next) {
  if (!req.user?.referralVerified) {
    return res.status(403).json({
      error: 'A Founder Page access code is required to use this feature.',
      code: 'FOUNDER_ACCESS_REQUIRED'
    });
  }
  next();
}

module.exports = { authenticateUser, requireAdmin, requireVerifiedEmail, requireFounderAccess };
