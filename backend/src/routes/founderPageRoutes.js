const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware'); 
const {
  getFounderPage,
  upsertFounderPage,
  publishFounderPage,
  getPublicFounderPage,
  previewFounderPage,
  checkUsername,
  deleteFounderPage
} = require('../controllers/founderPageController');

// Protected routes (require authentication)
router.get('/', authenticateUser, getFounderPage);
router.post('/', authenticateUser, upsertFounderPage);
router.patch('/publish', authenticateUser, publishFounderPage);
router.get('/preview', authenticateUser, previewFounderPage);
router.get('/check-username/:username', authenticateUser, checkUsername);
router.delete('/', authenticateUser, deleteFounderPage);

// Public route (no auth required)
router.get('/public/:username', getPublicFounderPage);

module.exports = router;