const express = require('express');
const { requestPasswordReset, resetPassword } = require('../controllers/passwordResetController');
const {
  passwordResetRequestLimiter,
  tokenSubmissionLimiter
} = require('../middleware/rateLimiters');

const router = express.Router();

// Both routes are unauthenticated and were previously unthrottled.
// /forgot-password sends mail to a caller-chosen address, so it is limited per
// IP *and* per target address; /reset-password is limited because an unbounded
// endpoint lets an attacker guess tokens against the whole user table.
router.post('/forgot-password', passwordResetRequestLimiter, requestPasswordReset);
router.post('/reset-password', tokenSubmissionLimiter, resetPassword);

module.exports = router;
