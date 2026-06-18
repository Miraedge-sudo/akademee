/**
 * Authentication Service - Login/Register Logic
 */

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

    try {
      // Check if user exists
      const existing = await sql`SELECT user_id FROM users WHERE email = ${email}`;
      if (existing.length > 0) {
        throw new Error('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create school
      const school = await sql`
        INSERT INTO schools (name, subdomain, is_active, created_at)
        VALUES (${schoolName}, ${schoolName.toLowerCase().replace(/\s+/g, '-')}, true, NOW())
        RETURNING school_id, name, subdomain
      `;

      // Create user
      const user = await sql`
        INSERT INTO users (school_id, first_name, last_name, email, password_hash, is_active, created_at)
        VALUES (${school[0].school_id}, ${firstName}, ${lastName}, ${email}, ${hashedPassword}, true, NOW())
        RETURNING user_id, email, first_name
      `;

      return { id: user[0].user_id, email: user[0].email, firstName: user[0].first_name };
    } catch (error) {
      throw error;
    }
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
      SELECT * FROM users
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
    try {
      const schools = await sql`
        SELECT school_id, name, subdomain, is_active
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user with all details
   */
  async getCurrentUser(userId, schoolId) {
    try {
      const users = await sql`
        SELECT user_id, email, first_name, last_name, school_id, is_active
        FROM users
        WHERE user_id = ${userId} AND school_id = ${schoolId}
      `;

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];

      // Get user roles
      const roles = await sql`
        SELECT r.role_code, r.role_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.role_id
        WHERE ur.user_id = ${userId}
      `;

      // Get school info
      const schools = await sql`
        SELECT school_id, name, subdomain, email_verified, onboarding_completed
        FROM schools
        WHERE school_id = ${schoolId}
      `;

      return {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        schoolId: user.school_id,
        roles: roles.map(r => r.role_code),
        school: schools[0] || null,
        schoolName: schools[0]?.name || null,
        subdomain: schools[0]?.subdomain || null,
        emailVerified: schools[0]?.email_verified ?? false,
        onboardingCompleted: schools[0]?.onboarding_completed ?? false,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email token
   */
  async verifyEmail(token) {
    // Implement email verification logic
    return true;
  }
}

module.exports = new AuthService();
