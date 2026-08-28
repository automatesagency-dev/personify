const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');
const { sendPasswordResetEmail } = require('../config/email');
const { createSecureToken, hashToken, TTL } = require('../utils/tokens');

// Canonical public app URL for links in emails (see authController for rationale).
const APP_URL = () => (process.env.APP_URL || (process.env.FRONTEND_URL || '').split(',')[0] || '').trim().replace(/\/+$/, '');

// Request password reset
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return res.json({
        message: 'If that email exists, a reset link has been sent'
      });
    }

    // Only the hash is persisted; the raw token exists solely in the emailed link.
    const { token: resetToken, tokenHash, expiresAt } = createSecureToken(TTL.passwordReset);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: expiresAt
      }
    });

    // Send the reset link by email (non-fatal — we don't reveal delivery status)
    try {
      await sendPasswordResetEmail(user.email, user.name, `${APP_URL()}/reset-password?token=${resetToken}`);
    } catch (e) {
      console.error('Failed to send password reset email:', e.message);
    }

    res.json({
      message: 'If that email exists, a reset link has been sent'
    });

  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
}

// Reset password with token
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Token and new password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    // Look the token up by hash — the stored value is never the emailed one.
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashToken(token),
        resetPasswordExpires: {
          gte: new Date() // Token hasn't expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.json({
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

module.exports = {
  requestPasswordReset,
  resetPassword
};