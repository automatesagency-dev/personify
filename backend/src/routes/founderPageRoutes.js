const express = require('express');
const router = express.Router();
const { authenticateUser, requireFounderAccess } = require('../middleware/authMiddleware');
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
router.get('/', authenticateUser, getFounderPage);
router.post('/', authenticateUser, requireFounderAccess, upsertFounderPage);
router.patch('/publish', authenticateUser, requireFounderAccess, publishFounderPage);
router.get('/preview', authenticateUser, requireFounderAccess, previewFounderPage);
router.get('/check-username/:username', authenticateUser, checkUsername);
router.delete('/', authenticateUser, requireFounderAccess, deleteFounderPage);

// Public routes (no auth required)
// Note: /published must be declared before /public/:username is irrelevant here
// (different prefixes), but keep both grouped so the public surface is obvious.
router.get('/published', listPublishedFounderPages);
router.get('/public/:username', getPublicFounderPage);

module.exports = router;
