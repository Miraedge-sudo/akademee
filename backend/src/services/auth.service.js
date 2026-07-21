/**
 * Authentication Service - Login/Register Logic
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sql = require('../config/database');
const jwtConfig = require('../config/jwt');
const emailConfig = require('../config/email');
const SlugGenerator = require('../utils/slugGenerator');
const { buildSchoolUrls } = require('../utils/domainHelper');

class AuthService {
  generateAccessToken(user, school, roleCodes) {
    return jwt.sign(
      {
        userId: user.user_id,
        schoolId: user.school_id,
        subdomain: school.subdomain,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: roleCodes,
        role: roleCodes[0] || null,
        type: 'access',
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
  }

  generateRefreshToken(user, school, roleCodes) {
    return jwt.sign(
      {
        userId: user.user_id,
        schoolId: user.school_id,
        subdomain: school.subdomain,
        type: 'refresh',
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.refreshExpiresIn }
    );
  }

  async createAuthSession(user, school, roles = []) {
    const roleCodes = roles.map((role) => role.role_code || role);

    const accessToken = this.generateAccessToken(user, school, roleCodes);
    const refreshToken = this.generateRefreshToken(user, school, roleCodes);

    const templateCode = school.template_code || 'bold';
    const urls = buildSchoolUrls(school.subdomain, templateCode);

    return {
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        schoolId: user.school_id,
        subdomain: school.subdomain,
        schoolName: school.name,
        roles: roleCodes,
        userEmailVerified: user.email_verified ?? true,
        schoolEmailVerified: school.email_verified ?? true,
        userVerificationRequired: user.require_email_verification ?? false,
        schoolVerificationRequired: school.require_email_verification ?? false,
        onboardingCompleted: school.onboarding_completed ?? false,
        school: {
          id: school.school_id,
          name: school.name,
          subdomain: school.subdomain,
          educationalSystems: school.educational_systems || [],
          primaryColor: school.primary_color || null,
          logoUrl: school.logo_url || null,
          heroImageUrl: school.hero_image_url || null,
        },
      },
      token: accessToken,
      refreshToken,
      urls,
    };
  }

  async refreshTokens(refreshToken) {
    const decoded = jwt.verify(refreshToken, jwtConfig.secret);
    if (decoded.type !== 'refresh') throw new Error('Invalid refresh token');

    const users = await sql`
      SELECT user_id, school_id, email, first_name, last_name, is_active, email_verified, require_email_verification
      FROM users WHERE user_id = ${decoded.userId} AND school_id = ${decoded.schoolId}
    `;
    if (users.length === 0 || !users[0].is_active) throw new Error('User not found');

    const user = users[0];

    const schools = await sql`
      SELECT s.school_id, s.name, s.subdomain, s.is_active, s.email_verified, s.require_email_verification, s.onboarding_completed, wt.template_code
      FROM schools s
      LEFT JOIN website_templates wt ON s.website_template_id = wt.template_id
      WHERE s.school_id = ${user.school_id}
    `;
    if (schools.length === 0) throw new Error('School not found');

    const school = schools[0];

    if (school.require_email_verification && !school.email_verified) {
      throw new Error('School email is not verified');
    }

    if (user.require_email_verification && !user.email_verified) {
      throw new Error('Admin email is not verified');
    }

    const roleRows = await sql`
      SELECT r.role_code FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = ${user.user_id}
    `;
    const roleCodes = roleRows.map(r => r.role_code);

    const newAccessToken = this.generateAccessToken(user, school, roleCodes);
    const newRefreshToken = this.generateRefreshToken(user, school, roleCodes);

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        schoolId: user.school_id,
        subdomain: school.subdomain,
        schoolName: school.name,
        roles: roleCodes,
        userEmailVerified: user.email_verified ?? true,
        schoolEmailVerified: school.email_verified ?? true,
        onboardingCompleted: school.onboarding_completed ?? false,
      },
    };
  }
  /**
   * Login user with subdomain, email and password
   */
  async login(subdomain, email, password) {
    const normalizedSubdomain = SlugGenerator.sanitize(subdomain);

    const schools = await sql`
      SELECT school_id, name, subdomain, is_active, email_verified, require_email_verification
      FROM schools
      WHERE subdomain = ${normalizedSubdomain}
    `;

    if (schools.length === 0) {
      throw new Error('Invalid email or password');
    }

    const school = schools[0];

    if (!school.is_active) {
      throw new Error('School account is inactive');
    }

    const users = await sql`
      SELECT user_id, school_id, email, login_email, first_name, last_name, password_hash, is_active, phone, email_verified, require_email_verification
      FROM users
      WHERE (login_email = ${email} OR email = ${email}) AND school_id = ${school.school_id}
    `;

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    if (!user.is_active) {
      throw new Error('User account is inactive');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    if (school.require_email_verification && !school.email_verified) {
      throw new Error('School email is not verified');
    }

    if (user.require_email_verification && !user.email_verified) {
      throw new Error('Admin email is not verified');
    }

    const roles = await sql`
      SELECT r.role_code, r.role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = ${user.user_id}
    `;

    await sql`
      UPDATE users
      SET last_login = NOW()
      WHERE user_id = ${user.user_id}
    `;

    const schoolWithTemplate = await sql`
      SELECT s.school_id, s.name, s.subdomain, s.is_active, s.email_verified, s.require_email_verification, s.onboarding_completed,
             s.educational_systems, s.primary_color, s.logo_url, s.hero_image_url,
             wt.template_code
      FROM schools s
      LEFT JOIN website_templates wt ON s.website_template_id = wt.template_id
      WHERE s.school_id = ${school.school_id}
    `;

    return this.createAuthSession(user, schoolWithTemplate[0], roles);
  }

  /**
   * Verify school exists by subdomain
   */
  async verifySchool(subdomain) {
    const schools = await sql`
      SELECT school_id, name, subdomain
      FROM schools
      WHERE subdomain = ${subdomain} AND is_active = true
    `;

    if (schools.length === 0) {
      throw new Error('School not found');
    }

    return {
      exists: true,
      school_id: schools[0].school_id,
      name: schools[0].name,
      subdomain: schools[0].subdomain,
    };
  }

  /**
   * Get current user with all details
   */
  async getCurrentUser(userId, schoolId) {
    const users = await sql`
      SELECT user_id, email, first_name, last_name, school_id, is_active, phone, avatar_url, gender, date_of_birth, nationality, email_verified, require_email_verification
      FROM users
      WHERE user_id = ${userId} AND school_id = ${schoolId}
    `;

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    const roles = await sql`
      SELECT r.role_code, r.role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = ${userId}
    `;

    const schools = await sql`
      SELECT school_id, name, subdomain, email_verified, require_email_verification, onboarding_completed,
             educational_systems, primary_color, logo_url, hero_image_url,
             hero_image_url_2, tagline, city, region,
             exam_type, exam_pass_rate, ranking, ranking_city,
             about_photos, classes_config
      FROM schools
      WHERE school_id = ${schoolId}
    `;

    const school = schools[0]
      ? {
          ...schools[0],
          educationalSystems: schools[0].educational_systems || [],
          primaryColor: schools[0].primary_color,
          logoUrl: schools[0].logo_url,
          heroImageUrl: schools[0].hero_image_url,
          heroImageUrl2: schools[0].hero_image_url_2,
          examType: schools[0].exam_type,
          examPassRate: schools[0].exam_pass_rate,
          ranking: schools[0].ranking,
          rankingCity: schools[0].ranking_city,
          aboutPhotos: schools[0].about_photos || [],
          classesConfig: schools[0].classes_config || {},
        }
      : null;

    return {
      id: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      schoolId: user.school_id,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      gender: user.gender,
      dateOfBirth: user.date_of_birth,
      nationality: user.nationality,
      roles: roles.map(r => r.role_code),
      school,
      schoolName: school?.name || null,
      subdomain: school?.subdomain || null,
      emailVerified: school?.email_verified ?? false,
      userEmailVerified: user.email_verified ?? true,
      schoolEmailVerified: school?.email_verified ?? false,
      userVerificationRequired: user.require_email_verification ?? false,
      schoolVerificationRequired: school?.require_email_verification ?? false,
      onboardingCompleted: school?.onboarding_completed ?? false,
    };
  }

  async verifyAdminEmail(token) {
    console.log('[AuthService] Verifying admin email with token:', token);

    const users = await sql`
      SELECT u.user_id, u.first_name, u.last_name, u.email, u.school_id, u.verification_token_expires_at, u.email_verified,
             s.name AS school_name, s.subdomain, s.email_verified AS school_email_verified
      FROM users u
      INNER JOIN schools s ON s.school_id = u.school_id
      WHERE u.verification_token = ${token}
    `;

    console.log('[AuthService] Admin verification query found', users.length, 'user(s)');

    if (users.length === 0) {
      throw new Error('Invalid or expired verification link');
    }

    const user = users[0];
    const urls = buildSchoolUrls(user.subdomain);

    if (user.email_verified) {
      return {
        alreadyVerified: true,
        verificationType: 'admin',
        schoolName: user.school_name,
        subdomain: user.subdomain,
        loginUrl: urls.loginUrl,
        schoolEmailVerified: user.school_email_verified,
      };
    }

    if (user.verification_token_expires_at && new Date(user.verification_token_expires_at) < new Date()) {
      throw new Error('Verification link has expired. Please request a new one.');
    }

    await sql`
      UPDATE users
      SET email_verified = true,
          verification_token = NULL,
          verification_token_expires_at = NULL,
          updated_at = NOW()
      WHERE user_id = ${user.user_id}
    `;

    return {
      alreadyVerified: false,
      verificationType: 'admin',
      schoolName: user.school_name,
      subdomain: user.subdomain,
      loginUrl: urls.loginUrl,
      schoolEmailVerified: user.school_email_verified,
    };
  }

  /**
   * Forgot password — generate reset token and email reset link.
   * Always returns success to avoid revealing whether the email exists.
   */
  async forgotPassword(email, subdomain) {
    const normalizedSubdomain = SlugGenerator.sanitize(subdomain);

    const schools = await sql`
      SELECT school_id, name FROM schools WHERE subdomain = ${normalizedSubdomain} AND is_active = true
    `;

    if (schools.length === 0) return { sent: true };

    const users = await sql`
      SELECT user_id, email, first_name FROM users
      WHERE email = ${email} AND school_id = ${schools[0].school_id} AND is_active = true
    `;

    if (users.length === 0) return { sent: true };

    const user = users[0];
    const token = crypto.randomBytes(16).toString('hex');
    const resetHours = emailConfig.resetExpiresHours || 24;

    console.log('[AuthService.forgotPassword] Generated reset token for user', user.user_id, 'token:', token, 'expires in hours:', resetHours);

    await sql`
      UPDATE users
      SET reset_password_token = ${token},
          reset_password_token_expires_at = NOW() + (${resetHours} || ' hours')::interval,
          updated_at = NOW()
      WHERE user_id = ${user.user_id}
    `;

    const emailService = require('./email.service');
    await emailService.sendPasswordResetEmail({
      email: user.email,
      firstName: user.first_name,
      schoolName: schools[0].name,
      token,
    });

    return { sent: true };
  }

  /**
   * Reset password — validate token and update password.
   */
  async resetPassword(token, newPassword) {
    console.log('[AuthService.resetPassword] Received token:', token);

    // Use the database clock for expiry checks to avoid app/DB clock skew issues.
    const users = await sql`
      SELECT user_id, school_id, email, reset_password_token_expires_at
      FROM users
      WHERE reset_password_token = ${token}
        AND (reset_password_token_expires_at IS NULL OR reset_password_token_expires_at > NOW())
    `;

    console.log('[AuthService.resetPassword] Matching users found:', users.length);

    if (users.length === 0) {
      // Distinguish expired from missing for logging
      const existing = await sql`
        SELECT reset_password_token_expires_at
        FROM users
        WHERE reset_password_token = ${token}
      `;
      if (existing.length > 0) {
        console.log('[AuthService.resetPassword] Token found but expired at:', existing[0].reset_password_token_expires_at, 'DB time:', new Date());
        throw new Error('Reset token has expired');
      }
      throw new Error('Invalid or expired reset token');
    }

    const user = users[0];

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await sql`
      UPDATE users
      SET password_hash = ${hashedPassword},
          reset_password_token = NULL,
          reset_password_token_expires_at = NULL,
          updated_at = NOW()
      WHERE user_id = ${user.user_id}
    `;

    return { success: true };
  }

  /**
   * Blacklist a JWT token so it can no longer be used.
   * Stores a hash of the token with its expiry time for cleanup.
   */
  async blacklistToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return { blacklisted: false };

      const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(decoded.exp * 1000);

      await sql`
        INSERT INTO token_blacklist (token_hash, expires_at)
        VALUES (${tokenHash}, ${expiresAt})
        ON CONFLICT DO NOTHING
      `;

      return { blacklisted: true };
    } catch {
      return { blacklisted: false };
    }
  }

  /**
   * Check if a token has been blacklisted (logged out).
   */
  async isTokenBlacklisted(token) {
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const rows = await sql`
      SELECT id FROM token_blacklist
      WHERE token_hash = ${tokenHash} AND expires_at > NOW()
    `;

    return rows.length > 0;
  }

  /**
   * Clean up expired blacklist entries (run periodically).
   */
  async cleanExpiredBlacklist() {
    await sql`DELETE FROM token_blacklist WHERE expires_at <= NOW()`;
  }

}

module.exports = new AuthService();
