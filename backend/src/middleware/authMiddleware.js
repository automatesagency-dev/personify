const { verifyToken } = require('../config/jwt');
const { prisma } = require('../config/database');

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
      select: { id: true, email: true, name: true, profilePictureUrl: true, referralVerified: true, emailVerified: true, plan: true }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found.' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ 
      error: 'Authentication failed.',
      message: error.message 
    });
  }
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

module.exports = { authenticateUser, requireVerifiedEmail };
