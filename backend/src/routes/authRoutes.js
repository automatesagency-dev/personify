const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfilePicture, updateProfile, updatePassword } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateUser, getMe);
router.patch('/profile-picture', authenticateUser, updateProfilePicture);
router.patch('/profile', authenticateUser, updateProfile);
router.patch('/password', authenticateUser, updatePassword);

module.exports = router;