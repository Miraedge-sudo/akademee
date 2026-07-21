/**
 * Email Service — sends school verification emails via SMTP (Nodemailer).
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');
const domains = require('../config/domains');

const BRAND_LOGO_PATH = path.resolve(__dirname, '../../../frontend/src/assets/Logo.png');

function getBrandAttachments() {
  if (!fs.existsSync(BRAND_LOGO_PATH)) {
    return [];
  }

  return [
    {
      filename: 'akademee-logo.png',
      path: BRAND_LOGO_PATH,
      cid: 'akademee-logo',
    },
  ];
}

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

function buildSchoolVerificationUrl(token, subdomain) {
  const protocol = domains.getProtocol();
  const domain = domains.getActiveTenantDomain();

  if (domains.isProduction) {
    const base = `${protocol}://${subdomain}.${domain}`;
    return `${base}/verify-email?type=school&token=${encodeURIComponent(token)}`;
  } else {
    // In development, use main domain with subdomain as query param for better compatibility
    const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${domains.frontendPort}`;
    return `${frontendUrl}/verify-email?type=school&token=${encodeURIComponent(token)}&subdomain=${encodeURIComponent(subdomain)}`;
  }
}

function buildAdminVerificationUrl(token, subdomain) {
  const protocol = domains.getProtocol();
  const domain = domains.getActiveTenantDomain();

  if (domains.isProduction) {
    const base = `${protocol}://${subdomain}.${domain}`;
    return `${base}/verify-email?type=admin&token=${encodeURIComponent(token)}`;
  } else {
    // In development, use main domain with subdomain as query param for better compatibility
    const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${domains.frontendPort}`;
    return `${frontendUrl}/verify-email?type=admin&token=${encodeURIComponent(token)}&subdomain=${encodeURIComponent(subdomain)}`;
  }
}

function buildResetPasswordUrl(token) {
  const frontendUrl = domains.isProduction
    ? process.env.FRONTEND_URL_PRODUCTION || 'https://akademee.cm'
    : process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function brandTemplate(bodyHtml) {
  const logoMarkup = fs.existsSync(BRAND_LOGO_PATH)
    ? '<img src="cid:akademee-logo" alt="Akademee" style="height:52px" />'
    : '<div style="font-size:28px;font-weight:700;color:#085041">Akademee</div>';

  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#2a3029">
      <div style="text-align:center;padding:32px 0 16px">
        ${logoMarkup}
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
  async sendSchoolVerificationEmail({ schoolName, subdomain, email, token }) {
    const verifyUrl = buildSchoolVerificationUrl(token, subdomain);
    const recipientList = [email].filter(Boolean);

    console.log('[EmailService] School verification URL:', verifyUrl, 'token:', token);

    if (!emailConfig.isConfigured) {
      console.warn('[EmailService] SMTP not configured — verification URL (dev only):', verifyUrl);
      return { sent: false, verifyUrl, reason: 'SMTP not configured' };
    }

    const transport = getTransporter();
    const bodyHtml = `
      <h2 style="color:#085041">Verify your Akademee campus</h2>
      <p>Hello,</p>
      <p>Thank you for registering <strong>${schoolName}</strong> on Akademee.</p>
      <p>Please confirm your school email to unlock onboarding for your campus:</p>
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
        subject: `Verify your school email for ${schoolName}`,
        html: brandTemplate(bodyHtml),
        text: `Verify ${schoolName}: ${verifyUrl}`,
        attachments: getBrandAttachments(),
      });
      return { sent: true, verifyUrl: null };
    } catch (error) {
      console.error('[EmailService] Failed to send verification email:', error.message);
      return { sent: false, verifyUrl, reason: error.message };
    }
  }

  async sendAdminVerificationEmail({ schoolName, subdomain, email, firstName, token }) {
    const verifyUrl = buildAdminVerificationUrl(token, subdomain);

    console.log('[EmailService] Admin verification URL:', verifyUrl, 'token:', token);

    if (!emailConfig.isConfigured) {
      console.warn('[EmailService] SMTP not configured — admin verification URL (dev only):', verifyUrl);
      return { sent: false, verifyUrl, reason: 'SMTP not configured' };
    }

    const transport = getTransporter();
    const bodyHtml = `
      <h2 style="color:#085041">Verify your administrator email</h2>
      <p>Hello ${firstName || 'there'},</p>
      <p>Your administrator account for <strong>${schoolName}</strong> has been created on Akademee.</p>
      <p>Please confirm your admin email before you can sign in and access the dashboard:</p>
      <p style="margin:28px 0">
        <a href="${verifyUrl}" style="background:#085041;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Verify admin email
        </a>
      </p>
      <p style="font-size:13px;color:#6e7a70">Or copy this link: ${verifyUrl}</p>
      <p style="font-size:13px;color:#6e7a70">This link expires in ${emailConfig.verificationExpiresHours} hours.</p>
    `;

    try {
      await transport.sendMail({
        from: emailConfig.from,
        to: email,
        subject: `Verify your admin email for ${schoolName}`,
        html: brandTemplate(bodyHtml),
        text: `Verify your admin email for ${schoolName}: ${verifyUrl}`,
        attachments: getBrandAttachments(),
      });
      return { sent: true, verifyUrl: null };
    } catch (error) {
      console.error('[EmailService] Failed to send admin verification email:', error.message);
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
        attachments: getBrandAttachments(),
      });
      return { sent: true };
    } catch (error) {
      console.error('[EmailService] Failed to send password reset email:', error.message);
      return { sent: false, reason: error.message };
    }
  }

  /**
   * Send user invitation email with professional template.
   */
  async sendUserInviteEmail({ email, firstName, lastName, schoolName, inviterName, role, inviteUrl }) {
    if (!emailConfig.isConfigured) {
      console.warn('[EmailService] SMTP not configured — invite URL (dev only):', inviteUrl);
      return { sent: false, inviteUrl, reason: 'SMTP not configured' };
    }

    const transport = getTransporter();
    const fullName = `${firstName} ${lastName}`.trim();
    const displayName = firstName || fullName || 'there';

    const bodyHtml = `
      <div style="background:linear-gradient(135deg,#085041 0%,#1D9E75 100%);padding:32px;border-radius:12px;margin-bottom:24px">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">You're Invited to Join ${schoolName}</h1>
      </div>
      
      <p style="font-size:16px;color:#2a3029;line-height:1.6">
        Hello <strong>${displayName}</strong>,
      </p>
      
      <p style="font-size:15px;color:#4a5a52;line-height:1.6">
        <strong>${inviterName}</strong> has invited you to join <strong>${schoolName}</strong> on Akademee as a <strong>${role}</strong>.
      </p>
      
      <p style="font-size:15px;color:#4a5a52;line-height:1.6">
        Akademee is a comprehensive school management platform that will help you stay connected with your school community, manage your tasks, and access important information.
      </p>
      
      <div style="background:#f0fdf4;border:2px solid #085041;border-radius:12px;padding:20px;margin:24px 0">
        <h3 style="color:#085041;margin:0 0 12px;font-size:16px">What you can do as a ${role}:</h3>
        <ul style="margin:0;padding-left:20px;color:#4a5a52;font-size:14px;line-height:1.8">
          ${role === 'Teacher' ? `
            <li>Manage your classes and students</li>
            <li>Record grades and attendance</li>
            <li>Access teaching resources</li>
          ` : role === 'Student' ? `
            <li>View your grades and reports</li>
            <li>Track attendance and assignments</li>
            <li>Access class materials</li>
          ` : role === 'Admin' ? `
            <li>Manage school settings</li>
            <li>Oversee all users and activities</li>
            <li>Access comprehensive reports</li>
          ` : role === 'Accountant' ? `
            <li>Manage fee payments</li>
            <li>Track financial records</li>
            <li>Generate payment reports</li>
          ` : role === 'Secretary' ? `
            <li>Manage student enrollments</li>
            <li>Handle administrative tasks</li>
            <li>Maintain school records</li>
          ` : `
            <li>Access school portal</li>
            <li>Stay updated with school activities</li>
            <li>Connect with the community</li>
          `}
        </ul>
      </div>
      
      <p style="margin:28px 0">
        <a href="${inviteUrl}" style="background:#085041;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;margin-right:12px">
          Accept Invitation
        </a>
        <a href="${inviteUrl}&action=decline" style="background:#fff;color:#6e7a70;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;border:2px solid #e2e8e4">
          Decline
        </a>
      </p>
      
      <p style="font-size:13px;color:#6e7a70">
        Or copy this link: <a href="${inviteUrl}" style="color:#085041">${inviteUrl}</a>
      </p>
      
      <p style="font-size:13px;color:#8a9a8e;margin-top:24px">
        This invitation will expire in 7 days. If you have any questions, please contact your school administrator.
      </p>
      
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8e4">
        <p style="font-size:12px;color:#8a9a8e;margin:0">
          If you believe this invitation was sent in error, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      await transport.sendMail({
        from: emailConfig.from,
        to: email,
        subject: `You're invited to join ${schoolName} on Akademee`,
        html: brandTemplate(bodyHtml),
        text: `You're invited to join ${schoolName} on Akademee. Accept your invitation: ${inviteUrl}`,
        attachments: getBrandAttachments(),
      });
      return { sent: true };
    } catch (error) {
      console.error('[EmailService] Failed to send invite email:', error.message);
      return { sent: false, reason: error.message };
    }
  }

  /**
   * Send welcome email for manually created users
   */
  async sendWelcomeEmail({ email, loginEmail, firstName, lastName, password, role, schoolName, loginUrl, phone, className, guardianName, guardianPhone, feeAmount, gender, dob, nationality, educationalSystem }) {
    if (!emailConfig.isConfigured) {
      console.warn('[EmailService] SMTP not configured — welcome email not sent');
      return { sent: false, reason: 'SMTP not configured' };
    }

    const transport = getTransporter();
    const fullName = `${firstName} ${lastName}`.trim();
    const displayName = firstName || fullName || 'there';

    // Build additional details section
    let additionalDetails = '';
    if (phone) additionalDetails += `<li><strong>Phone:</strong> ${phone}</li>`;
    if (gender) additionalDetails += `<li><strong>Gender:</strong> ${gender}</li>`;
    if (dob) additionalDetails += `<li><strong>Date of Birth:</strong> ${dob}</li>`;
    if (nationality) additionalDetails += `<li><strong>Nationality:</strong> ${nationality}</li>`;
    if (educationalSystem) additionalDetails += `<li><strong>Educational System:</strong> ${educationalSystem}</li>`;
    if (className) additionalDetails += `<li><strong>Class:</strong> ${className}</li>`;
    if (guardianName) additionalDetails += `<li><strong>Guardian Name:</strong> ${guardianName}</li>`;
    if (guardianPhone) additionalDetails += `<li><strong>Guardian Phone:</strong> ${guardianPhone}</li>`;
    if (feeAmount) additionalDetails += `<li><strong>Fee Amount:</strong> ${feeAmount}</li>`;

    const bodyHtml = `
      <div style="background:linear-gradient(135deg,#085041 0%,#1D9E75 100%);padding:32px;border-radius:12px;margin-bottom:24px">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">Welcome to ${schoolName}</h1>
      </div>
      
      <p style="font-size:16px;color:#2a3029;line-height:1.6">
        Hello <strong>${displayName}</strong>,
      </p>
      
      <p style="font-size:15px;color:#4a5a52;line-height:1.6">
        Your account has been created at <strong>${schoolName}</strong> on Akademee as a <strong>${role}</strong>.
      </p>
      
      <div style="background:#f0fdf4;border:2px solid #085041;border-radius:12px;padding:20px;margin:24px 0">
        <h3 style="color:#085041;margin:0 0 12px;font-size:16px">Your Account Details:</h3>
        <ul style="margin:0;padding-left:20px;color:#4a5a52;font-size:14px;line-height:1.8">
          <li><strong>Name:</strong> ${fullName}</li>
          <li><strong>Email:</strong> ${email}</li>
          ${loginEmail && loginEmail !== email ? `<li><strong>Account Email (for login):</strong> ${loginEmail}</li>` : ''}
          <li><strong>Password:</strong> ${password}</li>
          <li><strong>Role:</strong> ${role}</li>
          ${additionalDetails}
        </ul>
      </div>
      
      <p style="margin:28px 0">
        <a href="${loginUrl}" style="background:#085041;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
          Log In to Your Account
        </a>
      </p>
      
      <p style="font-size:13px;color:#6e7a70">
        Or copy this link: <a href="${loginUrl}" style="color:#085041">${loginUrl}</a>
      </p>
      
      <p style="font-size:13px;color:#8a9a8e;margin-top:24px">
        For security reasons, please change your password after your first login. If you have any questions, please contact your school administrator.
      </p>
      
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8e4">
        <p style="font-size:12px;color:#8a9a8e;margin:0">
          If you believe this account was created in error, please contact your school administrator.
        </p>
      </div>
    `;

    try {
      await transport.sendMail({
        from: emailConfig.from,
        to: email,
        subject: `Welcome to ${schoolName} on Akademee`,
        html: brandTemplate(bodyHtml),
        text: `Welcome to ${schoolName} on Akademee. Your account has been created. Name: ${fullName}, Email: ${email}, Password: ${password}, Role: ${role}. Log in: ${loginUrl}`,
        attachments: getBrandAttachments(),
      });
      return { sent: true };
    } catch (error) {
      console.error('[EmailService] Failed to send welcome email:', error.message);
      return { sent: false, reason: error.message };
    }
  }
}

module.exports = new EmailService();
