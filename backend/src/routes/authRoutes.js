const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfilePicture, updateProfile, updatePassword, googleAuth, getAdminUsers } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', authenticateUser, getMe);
router.patch('/profile-picture', authenticateUser, updateProfilePicture);
router.patch('/profile', authenticateUser, updateProfile);
router.patch('/password', authenticateUser, updatePassword);
router.get('/admin/users', authenticateUser, getAdminUsers);

module.exports = router;