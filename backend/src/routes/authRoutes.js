const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, getMe, updateProfilePicture, updateProfile, updatePassword, googleAuth, verifyEmail, resendVerification, getAdminUsers, getAdminOverview, getAdminAllGenerations } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  message: { error: 'Too many attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', authenticateUser, resendVerification);
router.get('/me', authenticateUser, getMe);
router.patch('/profile-picture', authenticateUser, updateProfilePicture);
router.patch('/profile', authenticateUser, updateProfile);
router.patch('/password', authenticateUser, updatePassword);
router.get('/admin/users', authenticateUser, getAdminUsers);
router.get('/admin/overview', authenticateUser, getAdminOverview);
router.get('/admin/generations', authenticateUser, getAdminAllGenerations);

module.exports = router;