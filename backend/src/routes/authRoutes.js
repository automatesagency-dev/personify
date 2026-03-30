const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfilePicture } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateUser, getMe);
router.patch('/profile-picture', authenticateUser, updateProfilePicture); // Add this

module.exports = router;