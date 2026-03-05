const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware'); // ✅ FIXED
const {
  getFounderPage,
  upsertFounderPage,
  publishFounderPage,
  getPublicFounderPage,
  checkUsername,
  deleteFounderPage
} = require('../controllers/founderPageController');

// Protected routes (require authentication)
router.get('/', authenticateUser, getFounderPage);
router.post('/', authenticateUser, upsertFounderPage);
router.patch('/publish', authenticateUser, publishFounderPage);
router.get('/check-username/:username', authenticateUser, checkUsername);
router.delete('/', authenticateUser, deleteFounderPage);

// Public route (no auth required)
router.get('/public/:username', getPublicFounderPage);

module.exports = router;