/**
 * Email Service — sends school verification emails via SMTP (Nodemailer).
 */

const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');
const domains = require('../config/domains');

function getTransporter() {
  if (!emailConfig.isConfigured) {
    return null;
  }
  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth,
  });
}

function buildVerificationUrl(token, subdomain) {
  const protocol = domains.getProtocol();
  const domain = domains.getActiveTenantDomain();
  const port = domains.isProduction ? '' : `:${domains.frontendPort}`;
  const base = `${protocol}://${subdomain}.${domain}${port}`;
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}

function buildResetPasswordUrl(token) {
  const frontendUrl = domains.isProduction
    ? process.env.FRONTEND_URL_PRODUCTION || 'https://akademee.cm'
    : process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function brandTemplate(bodyHtml) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#2a3029">
      <div style="text-align:center;padding:32px 0 16px">
        <img src="https://res.cloudinary.com/drpzwluhj/image/upload/v1/akademee_logo" alt="Akademee" style="height:40px" />
      </div>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #e2e8e4;margin:32px 0 16px" />
      <p style="font-size:12px;color:#8a9a8e;text-align:center">
        Akademee — School Management Platform
      </p>
    </div>
  `;
}

class EmailService {
  /**
   * Send verification email to school contact and admin after registration.
   */
  async sendSchoolVerificationEmail({ schoolName, subdomain, recipients, token }) {
    const verifyUrl = buildVerificationUrl(token, subdomain);
    const recipientList = [...new Set(recipients.filter(Boolean))];

    if (!emailConfig.isConfigured) {
      console.warn('[EmailService] SMTP not configured — verification URL (dev only):', verifyUrl);
      return { sent: false, verifyUrl, reason: 'SMTP not configured' };
    }

    const transport = getTransporter();
    const bodyHtml = `
      <h2 style="color:#085041">Verify your Akademee campus</h2>
      <p>Hello,</p>
      <p>Thank you for registering <strong>${schoolName}</strong> on Akademee.</p>
      <p>Please confirm your school email to activate login and publish your campus website:</p>
      <p style="margin:28px 0">
        <a href="${verifyUrl}" style="background:#085041;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Verify school email
        </a>
      </p>
      <p style="font-size:13px;color:#6e7a70">Or copy this link: ${verifyUrl}</p>
      <p style="font-size:13px;color:#6e7a70">This link expires in ${emailConfig.verificationExpiresHours} hours.</p>
    `;

    try {
      await transport.sendMail({
        from: emailConfig.from,
        to: recipientList.join(', '),
        subject: `Verify ${schoolName} on Akademee`,
        html: brandTemplate(bodyHtml),
        text: `Verify ${schoolName}: ${verifyUrl}`,
      });
      return { sent: true, verifyUrl: null };
    } catch (error) {
      console.error('[EmailService] Failed to send verification email:', error.message);
      return { sent: false, verifyUrl, reason: error.message };
    }
  }

  /**
   * Send password reset email with branded template.
   */
  async sendPasswordResetEmail({ email, firstName, schoolName, token }) {
    const resetUrl = buildResetPasswordUrl(token);

    if (!emailConfig.isConfigured) {
      console.warn('[EmailService] SMTP not configured — reset URL (dev only):', resetUrl);
      return { sent: false, resetUrl, reason: 'SMTP not configured' };
    }

    const transport = getTransporter();
    const bodyHtml = `
      <h2 style="color:#085041">Reset your password</h2>
      <p>Hello ${firstName},</p>
      <p>We received a request to reset the password for <strong>${schoolName}</strong> on Akademee.</p>
      <p style="margin:28px 0">
        <a href="${resetUrl}" style="background:#085041;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Reset your password
        </a>
      </p>
      <p style="font-size:13px;color:#6e7a70">Or copy this link: ${resetUrl}</p>
      <p style="font-size:13px;color:#6e7a70">This link expires in ${emailConfig.resetExpiresHours} hour${emailConfig.resetExpiresHours > 1 ? 's' : ''}.</p>
      <p style="font-size:13px;color:#8a9a8e;margin-top:24px">If you did not request this, you can safely ignore this email.</p>
    `;

    try {
      await transport.sendMail({
        from: emailConfig.from,
        to: email,
        subject: `Reset your ${schoolName} password`,
        html: brandTemplate(bodyHtml),
        text: `Reset your password: ${resetUrl}`,
      });
      return { sent: true };
    } catch (error) {
      console.error('[EmailService] Failed to send password reset email:', error.message);
      return { sent: false, reason: error.message };
    }
  }
}

module.exports = new EmailService();
