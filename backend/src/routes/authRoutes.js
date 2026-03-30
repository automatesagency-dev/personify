const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfilePicture } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.patch('/profile-picture', authenticate, updateProfilePicture); // Add this

module.exports = router;