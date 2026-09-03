const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const {
  getFounderPage,
  upsertFounderPage,
  publishFounderPage,
  getPublicFounderPage,
  listPublishedFounderPages,
  previewFounderPage,
  checkUsername,
  deleteFounderPage
} = require('../controllers/founderPageController');

// Protected routes (require authentication)
// Founder Page is open to all authenticated users — no referral code required.
// (requireFounderAccess still exists in authMiddleware if a future paywall
// needs it; it's just not wired in here anymore.)
router.get('/', authenticateUser, getFounderPage);
router.post('/', authenticateUser, upsertFounderPage);
router.patch('/publish', authenticateUser, publishFounderPage);
router.get('/preview', authenticateUser, previewFounderPage);
router.get('/check-username/:username', authenticateUser, checkUsername);
router.delete('/', authenticateUser, deleteFounderPage);

// Public routes (no auth required)
// Note: /published must be declared before /public/:username is irrelevant here
// (different prefixes), but keep both grouped so the public surface is obvious.
router.get('/published', listPublishedFounderPages);
router.get('/public/:username', getPublicFounderPage);

module.exports = router;
