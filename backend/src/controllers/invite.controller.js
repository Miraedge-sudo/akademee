const response = require('../utils/response');
const emailService = require('../services/email.service');
const domains = require('../config/domains');
const crypto = require('crypto');
const sql = require('../config/database');
const bcrypt = require('bcrypt');

class InviteController {
  /**
   * Send invitation email to a user
   */
  async sendInvite(req, res, next) {
    try {
      const { email, firstName, lastName, role } = req.body;
      const schoolId = req.schoolId || req.user.schoolId;
      const inviterName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'Administrator';

      // Validate required fields
      if (!email || !email.includes('@')) {
        return response.error(res, 'Valid email is required', null, 400);
      }

      if (!role) {
        return response.error(res, 'Role is required', null, 400);
      }

      // Generate invite token
      const inviteToken = crypto.randomBytes(32).toString('hex');
      
      // Store invite in database (for validation later)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await sql`
        INSERT INTO invites (invite_token, email, first_name, last_name, role_code, school_id, expires_at, created_by)
        VALUES (${inviteToken}, ${email}, ${firstName || null}, ${lastName || null}, ${role}, ${schoolId}, ${expiresAt}, ${req.user?.userId || null})
      `;
      
      // Build invite URL
      const protocol = domains.getProtocol();
      const domain = domains.getActiveTenantDomain();
      const port = domains.isProduction ? '' : `:${domains.frontendPort}`;
      const subdomain = req.subdomain || 'www';
      const inviteUrl = `${protocol}://${subdomain}.${domain}${port}/accept-invite?token=${inviteToken}&email=${encodeURIComponent(email)}`;

      // Get school name (from request or default)
      const schoolName = req.schoolName || 'Your School';

      // Send email
      const emailResult = await emailService.sendUserInviteEmail({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        schoolName,
        inviterName,
        role,
        inviteUrl,
      });

      if (emailResult.sent) {
        response.success(res, 'Invitation sent successfully', { 
          email, 
          role,
          inviteUrl: emailResult.inviteUrl 
        });
      } else {
        // In development, return the URL even if email wasn't sent
        response.success(res, 'Invitation created (email not sent - SMTP not configured)', {
          email,
          role,
          inviteUrl: emailResult.inviteUrl,
          reason: emailResult.reason,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate invite token
   */
  async validateInvite(req, res, next) {
    try {
      const { token } = req.params;
      
      const invite = await sql`
        SELECT * FROM invites 
        WHERE invite_token = ${token} 
        AND expires_at > NOW() 
        AND status = 'pending'
      `;
      
      if (invite.length === 0) {
        return response.error(res, 'Invalid or expired invite token', null, 400);
      }

      response.success(res, 'Invite token is valid', { 
        valid: true, 
        email: invite[0].email,
        role: invite[0].role_code,
        firstName: invite[0].first_name,
        lastName: invite[0].last_name,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept invitation and create user
   */
  async acceptInvite(req, res, next) {
    try {
      const { token, password, firstName, lastName, phone } = req.body;

      // Validate invite
      const invite = await sql`
        SELECT * FROM invites 
        WHERE invite_token = ${token} 
        AND expires_at > NOW() 
        AND status = 'pending'
      `;
      
      if (invite.length === 0) {
        return response.error(res, 'Invalid or expired invite token', null, 400);
      }

      const inviteData = invite[0];

      // Check if user already exists
      const existing = await sql`SELECT user_id FROM users WHERE email = ${inviteData.email}`;
      if (existing.length > 0) {
        return response.error(res, 'User with this email already exists', null, 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await sql`
        INSERT INTO users (school_id, first_name, last_name, email, password_hash, phone, is_active)
        VALUES (${inviteData.school_id}, ${firstName || inviteData.first_name}, ${lastName || inviteData.last_name}, ${inviteData.email}, ${passwordHash}, ${phone || null}, true)
        RETURNING *
      `;

      // Assign role
      const role = await sql`SELECT role_id FROM roles WHERE role_code = ${inviteData.role_code}`;
      if (role.length > 0) {
        await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${user[0].user_id}, ${role[0].role_id})`;
      }

      // Update invite status
      await sql`UPDATE invites SET status = 'accepted', accepted_at = NOW() WHERE invite_token = ${token}`;

      response.success(res, 'Invitation accepted and user created successfully', {
        userId: user[0].user_id,
        email: user[0].email,
        role: inviteData.role_code,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Decline invitation
   */
  async declineInvite(req, res, next) {
    try {
      const { token } = req.body;

      // Validate invite
      const invite = await sql`
        SELECT * FROM invites 
        WHERE invite_token = ${token} 
        AND expires_at > NOW() 
        AND status = 'pending'
      `;
      
      if (invite.length === 0) {
        return response.error(res, 'Invalid or expired invite token', null, 400);
      }

      // Update invite status
      await sql`UPDATE invites SET status = 'declined', declined_at = NOW() WHERE invite_token = ${token}`;

      response.success(res, 'Invitation declined successfully', { declined: true });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InviteController();
