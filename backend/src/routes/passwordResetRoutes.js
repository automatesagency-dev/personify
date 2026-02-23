const express = require('express');
const { requestPasswordReset, resetPassword } = require('../controllers/passwordResetController');

const router = express.Router();

// Request password reset
router.post('/forgot-password', requestPasswordReset);

// Reset password with token
router.post('/reset-password', resetPassword);

module.exports = router;