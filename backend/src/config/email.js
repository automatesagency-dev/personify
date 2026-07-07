const { Resend } = require('resend');

// Only initialize when a key is present so the app still boots without email
// configured (emails are then skipped with a warning instead of crashing).
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Use your verified domain in production, e.g. "Personify <noreply@yourdomain.com>".
// Falls back to Resend's shared test sender, which can only deliver to your own
// Resend account email — fine for initial testing.
const FROM = process.env.EMAIL_FROM || 'Personify <onboarding@resend.dev>';

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn(`⚠️  RESEND_API_KEY not set — skipping email "${subject}" to ${to}`);
    return { skipped: true };
  }
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    throw new Error(error.message || 'Email send failed');
  }
  return data;
}

function layout(title, bodyHtml) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #111;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">${title}</h1>
    ${bodyHtml}
    <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0 16px;" />
    <p style="font-size: 12px; color: #888; margin: 0;">Personify — AI-powered personal branding</p>
  </div>`;
}

function button(href, label) {
  return `<a href="${href}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px;">${label}</a>`;
}

async function sendVerificationEmail(to, name, url) {
  const html = layout(
    'Confirm your email',
    `<p style="font-size: 15px; line-height: 1.6;">Hi ${name || 'there'}, welcome to Personify! Please confirm your email address to unlock content generation.</p>
     <p style="margin: 24px 0;">${button(url, 'Verify email')}</p>
     <p style="font-size: 13px; color: #666;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`
  );
  return sendEmail({ to, subject: 'Verify your email — Personify', html });
}

async function sendPasswordResetEmail(to, name, url) {
  const html = layout(
    'Reset your password',
    `<p style="font-size: 15px; line-height: 1.6;">Hi ${name || 'there'}, we received a request to reset your Personify password.</p>
     <p style="margin: 24px 0;">${button(url, 'Reset password')}</p>
     <p style="font-size: 13px; color: #666;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`
  );
  return sendEmail({ to, subject: 'Reset your password — Personify', html });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
