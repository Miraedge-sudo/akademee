/**
 * Authentication Service - Login/Register Logic
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sql = require('../config/database');
const jwtConfig = require('../config/jwt');
const SlugGenerator = require('../utils/slugGenerator');
const { buildSchoolUrls } = require('../utils/domainHelper');

class AuthService {
  async createAuthSession(user, school, roles = []) {
    const roleCodes = roles.map((role) => role.role_code || role);

    const token = jwt.sign(
      {
        userId: user.user_id,
        schoolId: user.school_id,
        subdomain: school.subdomain,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: roleCodes,
        role: roleCodes[0] || null,
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    const templateCode = school.template_code || 'modern';
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
      },
      token,
      urls,
    };
  }
  /**
   * Register a new user with school
   */
  async register(userData) {
    const { email, password, firstName, lastName, schoolName } = userData;

    const existing = await sql`SELECT user_id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const subdomain = SlugGenerator.sanitize(schoolName);

    const result = await sql.begin(async (tx) => {
      const schools = await tx`
        INSERT INTO schools (name, subdomain, is_active, created_at)
        VALUES (${schoolName}, ${subdomain}, true, NOW())
        RETURNING school_id, name, subdomain
      `;

      const users = await tx`
        INSERT INTO users (school_id, first_name, last_name, email, password_hash, is_active, created_at)
        VALUES (${schools[0].school_id}, ${firstName}, ${lastName}, ${email}, ${hashedPassword}, true, NOW())
        RETURNING user_id, email, first_name
      `;

      return { school: schools[0], user: users[0] };
    });

    return { id: result.user.user_id, email: result.user.email, firstName: result.user.first_name };
  }

  /**
   * Login user with subdomain, email and password
   */
  async login(subdomain, email, password) {
    const normalizedSubdomain = SlugGenerator.sanitize(subdomain);

    const schools = await sql`
      SELECT school_id, name, subdomain, is_active, email_verified
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
      SELECT user_id, school_id, email, first_name, last_name, password_hash, is_active, phone
      FROM users
      WHERE email = ${email} AND school_id = ${school.school_id}
    `;

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    if (!user.is_active) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
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
      SELECT s.school_id, s.name, s.subdomain, s.is_active, wt.template_code
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
      SELECT user_id, email, first_name, last_name, school_id, is_active
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
      SELECT school_id, name, subdomain, email_verified, onboarding_completed,
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
      roles: roles.map(r => r.role_code),
      school,
      schoolName: school?.name || null,
      subdomain: school?.subdomain || null,
      emailVerified: school?.email_verified ?? false,
      onboardingCompleted: school?.onboarding_completed ?? false,
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
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sql`
      UPDATE users
      SET reset_password_token = ${token},
          reset_password_token_expires_at = ${expiresAt},
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
    const users = await sql`
      SELECT user_id, school_id, email, reset_password_token_expires_at
      FROM users
      WHERE reset_password_token = ${token}
    `;

    if (users.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const user = users[0];

    if (user.reset_password_token_expires_at && new Date(user.reset_password_token_expires_at) < new Date()) {
      throw new Error('Reset token has expired');
    }

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
   * Verify email token — delegates to onboarding service
   */
  async verifyEmail(token) {
    const onboardingService = require('./onboarding.service');
    return onboardingService.verifySchoolEmail(token);
  }
}

module.exports = new AuthService();
