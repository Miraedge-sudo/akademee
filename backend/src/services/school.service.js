/**
 * School Service — registration, verification, and school management.
 * Registration creates the tenant; onboarding (separate service) fills the landing page.
 */

const sql = require('../config/database');
const bcrypt = require('bcrypt');
const SlugGenerator = require('../utils/slugGenerator');
const { buildSchoolUrls } = require('../utils/domainHelper');
const authService = require('./auth.service');
const emailService = require('./email.service');
const onboardingService = require('./onboarding.service');
const emailConfig = require('../config/email');

class SchoolService {
  normalizeSubdomain(subdomain) {
    return SlugGenerator.sanitize(subdomain);
  }

  /**
   * Register a new school with admin user
   */
  async registerSchool(schoolData) {
    const {
      schoolName,
      subdomain,
      city,
      region,
      email,
      firstName,
      lastName,
      adminEmail,
      phone,
      password,
      planId,
      templateCode = 'modern',
    } = schoolData;

    const normalizedSubdomain = this.normalizeSubdomain(subdomain);

    if (!normalizedSubdomain || normalizedSubdomain.length < 3) {
      throw new Error('Subdomain must be at least 3 characters');
    }

    const subdomainCheck = await this.checkSubdomain(normalizedSubdomain);
    if (!subdomainCheck.available) {
      throw new Error('Subdomain already exists');
    }

    // Enforce unique school email and admin email across the system
    const schoolEmailExists = await sql`
      SELECT school_id FROM schools WHERE LOWER(email) = LOWER(${email})
    `;
    if (schoolEmailExists.length > 0) {
      throw new Error('School email is already registered');
    }

    const adminEmailExists = await sql`
      SELECT user_id FROM users WHERE LOWER(email) = LOWER(${adminEmail})
    `;
    if (adminEmailExists.length > 0) {
      throw new Error('Admin email is already in use');
    }

    const templates = await sql`
      SELECT template_id, template_code
      FROM website_templates
      WHERE template_code = ${templateCode}
    `;

    const templateId = templates[0]?.template_id || null;
    const resolvedTemplateCode = templates[0]?.template_code || 'modern';

    const passwordHash = await bcrypt.hash(password, 10);

    const schools = await sql`
      INSERT INTO schools (
        name, email, phone, city, region, subdomain, tagline,
        website_template_id, subscription_plan, subscription_status, is_active,
        email_verified, created_at
      )
      VALUES (
        ${schoolName}, ${email}, ${phone || null}, ${city}, ${region || null}, ${normalizedSubdomain},
        ${`Welcome to ${schoolName}`},
        ${templateId}, ${planId}, 'trial', true,
        true, NOW()
      )
      RETURNING school_id, name, email, subdomain
    `;

    const school = schools[0];

    const users = await sql`
      INSERT INTO users (school_id, first_name, last_name, email, password_hash, phone, is_active, created_at)
      VALUES (${school.school_id}, ${firstName}, ${lastName}, ${adminEmail}, ${passwordHash}, ${phone || null}, true, NOW())
      RETURNING user_id, first_name, last_name, email, school_id
    `;

    const user = users[0];

    const roles = await sql`SELECT role_id, role_code FROM roles WHERE role_code = 'ADMIN'`;
    const adminRole = roles[0];

    if (adminRole) {
      await sql`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${user.user_id}, ${adminRole.role_id})
      `;
    }

    const assignedRoles = adminRole ? [{ role_code: adminRole.role_code }] : [];
    const schoolForSession = {
      ...school,
      template_code: resolvedTemplateCode,
    };

    const session = await authService.createAuthSession(user, schoolForSession, assignedRoles);
    const urls = buildSchoolUrls(school.subdomain, resolvedTemplateCode);

    urls.onboardingUrl = `${urls.campusUrl}/pages/akademee_onboarding_v2.html`;

    return {
      schoolId: school.school_id,
      schoolName: school.name,
      subdomain: school.subdomain,
      templateCode: resolvedTemplateCode,
      campusUrl: urls.campusUrl,
      dashboardUrl: urls.dashboardUrl,
      websiteUrl: urls.websiteUrl,
      onboardingUrl: urls.onboardingUrl,
      loginUrl: urls.loginUrl,
      domainSuffix: urls.domainSuffix,
      adminEmail: user.email,
      adminName: `${user.first_name} ${user.last_name}`,
      planId,
      emailVerified: true,
      token: session.token,
      user: session.user,
      urls,
    };
  }

  /**
   * Resend verification email for the authenticated school.
   */
  async resendVerificationEmail(schoolId) {
    const schools = await sql`
      SELECT school_id, name, email, subdomain, email_verified
      FROM schools WHERE school_id = ${schoolId}
    `;

    if (schools.length === 0) {
      throw new Error('School not found');
    }

    const school = schools[0];
    if (school.email_verified) {
      return { sent: false, alreadyVerified: true };
    }

    const token = onboardingService.createVerificationToken();
    const expires = onboardingService.verificationExpiryDate(emailConfig.verificationExpiresHours);

    await sql`
      UPDATE schools
      SET verification_token = ${token},
          verification_token_expires_at = ${expires},
          updated_at = NOW()
      WHERE school_id = ${schoolId}
    `;

    const admins = await sql`
      SELECT email FROM users u
      INNER JOIN user_roles ur ON u.user_id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.role_id
      WHERE u.school_id = ${schoolId} AND r.role_code = 'ADMIN'
    `;

    const recipients = [school.email, ...admins.map((a) => a.email)];

    const result = await emailService.sendSchoolVerificationEmail({
      schoolName: school.name,
      subdomain: school.subdomain,
      recipients,
      token,
    });

    return { sent: result.sent, alreadyVerified: false };
  }

  /**
   * Check if subdomain is available
   */
  async checkSubdomain(subdomain) {
    const normalizedSubdomain = this.normalizeSubdomain(subdomain);

    if (!normalizedSubdomain) {
      throw new Error('Subdomain is required');
    }

    const result = await sql`SELECT school_id FROM schools WHERE subdomain = ${normalizedSubdomain}`;

    return {
      available: result.length === 0,
      subdomain: normalizedSubdomain,
    };
  }

  /**
   * Get all website templates
   */
  async getTemplates() {
    try {
      const templates = await sql`SELECT * FROM website_templates ORDER BY created_at DESC`;
      return templates;
    } catch (error) {
      throw error;
    }
  }

  async createSchool(schoolData) {
    const { name } = schoolData;

    // Generate slug
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    // Create school
    const school = await sql`
      INSERT INTO schools (name, subdomain, is_active, created_at)
      VALUES (${name}, ${slug}, true, NOW())
      RETURNING school_id, name, subdomain
    `;

    return school[0];
  }

  async getSchool(id) {
    const schools = await sql`SELECT * FROM schools WHERE school_id = ${id}`;
    if (schools.length === 0) {
      throw new Error('School not found');
    }
    return schools[0];
  }

  async updateSchool(id, updateData) {
    const schools = await sql`SELECT * FROM schools WHERE school_id = ${id}`;
    if (schools.length === 0) {
      throw new Error('School not found');
    }

    // Update school
    const updated = await sql`
      UPDATE schools
      SET ${updateData}
      WHERE school_id = ${id}
      RETURNING *
    `;

    return updated[0];
  }

  async getAllSchools(limit = 10, offset = 0) {
    const schools = await sql`
      SELECT * FROM schools
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return schools;
  }
}

module.exports = new SchoolService();
