/**
 * Email Service — sends school verification emails via SMTP (Nodemailer).
 */

const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');
const domains = require('../config/domains');

let transporter = null;

function getTransporter() {
  if (!emailConfig.isConfigured) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }
  return transporter;
}

function buildVerificationUrl(token, subdomain) {
  const protocol = domains.getProtocol();
  const domain = domains.getActiveTenantDomain();
  const port = domains.isProduction ? '' : `:${domains.frontendPort}`;
  const base = `${protocol}://${subdomain}.${domain}${port}`;
  return `${base}/pages/akademee_verify_email.html?token=${encodeURIComponent(token)}`;
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
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#2a3029">
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
      </div>
    `;

    await transport.sendMail({
      from: emailConfig.from,
      to: recipientList.join(', '),
      subject: `Verify ${schoolName} on Akademee`,
      html,
      text: `Verify ${schoolName}: ${verifyUrl}`,
    });

    return { sent: true, verifyUrl: null };
  }
}

module.exports = new EmailService();
