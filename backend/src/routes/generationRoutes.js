const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  generateImage,
  generateText,
  getGenerations,
  getGenerationById,
  deleteGeneration
} = require('../controllers/generationController');
const { authenticateUser, requireVerifiedEmail } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authenticateUser);

// Per-user burst limit on the expensive generation endpoints. Set well above
// normal human usage — it only rejects rapid-fire bursts (abuse). Keyed on the
// user id so one user can't exhaust another's budget.
const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  // These routes always run after authenticateUser, so a user is guaranteed.
  // Keying on the user id (never req.ip) avoids the IPv6 keygen validation.
  keyGenerator: (req) => req.user?.id || 'anonymous',
  message: { error: 'You are generating too quickly. Please wait a moment and try again.', code: 'RATE_LIMITED', retryable: false },
  standardHeaders: true,
  legacyHeaders: false
});

// Generation routes: verified email required and burst-limited. The daily
// limit is enforced atomically inside the controller (reserveGeneration).
router.post('/image', generationLimiter, requireVerifiedEmail, generateImage);
router.post('/text', generationLimiter, requireVerifiedEmail, generateText);

// History routes (no limits)
router.get('/', getGenerations);
router.get('/:id', getGenerationById);
router.delete('/:id', deleteGeneration);

module.exports = router;
