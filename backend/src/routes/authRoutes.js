const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfilePicture, updateProfile, updatePassword, googleAuth, verifyEmail, resendVerification, getAdminUsers, getAdminOverview, getAdminAllGenerations, getAdminFinancials } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');
const {
  authLimiter,
  tokenSubmissionLimiter,
  resendVerificationLimiter
} = require('../middleware/rateLimiters');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/verify-email', tokenSubmissionLimiter, verifyEmail);
router.post('/resend-verification', authenticateUser, resendVerificationLimiter, resendVerification);
router.get('/me', authenticateUser, getMe);
router.patch('/profile-picture', authenticateUser, updateProfilePicture);
router.patch('/profile', authenticateUser, updateProfile);
router.patch('/password', authenticateUser, updatePassword);
router.get('/admin/users', authenticateUser, getAdminUsers);
router.get('/admin/overview', authenticateUser, getAdminOverview);
router.get('/admin/generations', authenticateUser, getAdminAllGenerations);
router.get('/admin/financials', authenticateUser, getAdminFinancials);

module.exports = router;