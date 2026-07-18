const bcrypt = require('bcrypt');
const sql = require('../config/database');
const emailService = require('./email.service');
const domains = require('../config/domains');
const mediaService = require('./media.service');
const { generateLoginEmail } = require('../utils/emailGenerator');

class UserManagementService {
  formatUser(row) {
    return {
      id: row.user_id,
      schoolId: row.school_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      loginEmail: row.login_email,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      gender: row.gender,
      dateOfBirth: row.date_of_birth,
      nationality: row.nationality,
      isActive: row.is_active,
      lastLogin: row.last_login,
      roles: row.roles || [],
      createdAt: row.created_at,
    };
  }

  async list(schoolId, { limit = 50, offset = 0, search, role, includeInactive = false } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);
    const searchTerm = search ? `%${search.toLowerCase()}%` : null;

    const rows = await sql`
      SELECT u.*, COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object('code', r.role_code, 'name', r.role_name)) FILTER (WHERE r.role_code IS NOT NULL),
        '[]'::jsonb
      ) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.school_id = ${schoolId}
        ${!includeInactive ? sql`AND u.is_active = true` : sql``}
        ${searchTerm ? sql`AND (LOWER(u.first_name) LIKE ${searchTerm} OR LOWER(u.last_name) LIKE ${searchTerm} OR LOWER(u.email) LIKE ${searchTerm})` : sql``}
        ${role ? sql`AND r.role_code = ${role}` : sql``}
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM users WHERE school_id = ${schoolId}
        ${!includeInactive ? sql`AND is_active = true` : sql``}
    `;

    return {
      users: rows.map(r => this.formatUser(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async getById(schoolId, userId) {
    const rows = await sql`
      SELECT u.*, COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object('code', r.role_code, 'name', r.role_name)) FILTER (WHERE r.role_code IS NOT NULL),
        '[]'::jsonb
      ) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.user_id = ${userId} AND u.school_id = ${schoolId}
      GROUP BY u.user_id
    `;
    if (rows.length === 0) throw new Error('User not found');
    return this.formatUser(rows[0]);
  }

  async create(schoolId, data, file = null) {
    const { firstName, lastName, email, password, phone, roleCode, gender, dob, nationality, className, guardianName, guardianPhone, feeAmount, avatarUrl } = data;

    // Get school subdomain for email generation
    const school = await sql`SELECT subdomain, name FROM schools WHERE school_id = ${schoolId}`;
    if (school.length === 0) throw new Error('School not found');
    
    const schoolSubdomain = school[0].subdomain;
    const schoolName = school[0].name;

    // Generate login_email with role extension (admin keeps original email)
    const userEmail = email;
    const loginEmail = generateLoginEmail(userEmail, roleCode || 'ADMIN');

    // Check if login_email already exists for active users
    const existingLogin = await sql`SELECT user_id FROM users WHERE login_email = ${loginEmail} AND is_active = true`;
    if (existingLogin.length > 0) throw new Error('Login email already in use');

    const passwordHash = await bcrypt.hash(password, 10);

    let savedAvatarUrl = avatarUrl || null;
    let savedAvatarPublicId = null;

    if (file) {
      const avatarUpload = await mediaService.safeUploadAvatar(file, `akademee/schools/${schoolId}/avatars`);
      savedAvatarUrl = avatarUpload.avatarUrl || savedAvatarUrl;
      savedAvatarPublicId = avatarUpload.avatarPublicId || savedAvatarPublicId;
    }

    const rows = await sql`
      INSERT INTO users (school_id, first_name, last_name, email, login_email, password_hash, phone, gender, date_of_birth, nationality, avatar_url, avatar_public_id, is_active)
      VALUES (${schoolId}, ${firstName}, ${lastName}, ${userEmail}, ${loginEmail}, ${passwordHash}, ${phone || null}, ${gender || null}, ${dob || null}, ${nationality || null}, ${savedAvatarUrl}, ${savedAvatarPublicId}, true)
      RETURNING *
    `;
    const user = rows[0];

    if (roleCode) {
      const role = await sql`SELECT role_id, role_code FROM roles WHERE UPPER(role_code) = UPPER(${roleCode})`;
      if (role.length > 0) {
        await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${user.user_id}, ${role[0].role_id}) ON CONFLICT DO NOTHING`;
      }
    }

    // Send welcome email with all user details
    try {
      const protocol = domains.getProtocol();
      const domain = domains.getActiveTenantDomain();
      const port = domains.isProduction ? '' : `:${domains.frontendPort}`;
      const loginUrl = `${protocol}://${schoolSubdomain}.${domain}${port}/login`;

      await emailService.sendWelcomeEmail({
        email: userEmail,
        loginEmail,
        firstName,
        lastName,
        password,
        role: roleCode || 'User',
        schoolName,
        loginUrl,
        phone,
        gender,
        dob,
        nationality,
        className,
        guardianName,
        guardianPhone,
        feeAmount,
      });
    } catch (emailError) {
      console.error('[UserManagementService] Failed to send welcome email:', emailError.message);
      // Don't fail user creation if email fails
    }

    return this.formatUser({ ...user, roles: roleCode ? [{ code: roleCode }] : [] });
  }

  async update(schoolId, userId, data, file = null) {
    await this.getById(schoolId, userId);
    const { firstName, lastName, email, phone, isActive, avatarUrl } = data;

    let savedAvatarUrl = avatarUrl ?? null;
    let savedAvatarPublicId = null;

    if (file) {
      const avatarUpload = await mediaService.safeUploadAvatar(file, `akademee/schools/${schoolId}/avatars`);
      savedAvatarUrl = avatarUpload.avatarUrl || savedAvatarUrl;
      savedAvatarPublicId = avatarUpload.avatarPublicId || savedAvatarPublicId;
    }

    const rows = await sql`
      UPDATE users SET
        first_name = COALESCE(${firstName || null}, first_name),
        last_name = COALESCE(${lastName || null}, last_name),
        email = COALESCE(${email ?? null}, email),
        phone = COALESCE(${phone ?? null}, phone),
        avatar_url = COALESCE(${savedAvatarUrl ?? null}, avatar_url),
        avatar_public_id = COALESCE(${savedAvatarPublicId ?? null}, avatar_public_id),
        is_active = COALESCE(${isActive ?? null}, is_active),
        updated_at = NOW()
      WHERE user_id = ${userId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.getById(schoolId, rows[0].user_id);
  }

  async delete(schoolId, userId) {
    await this.getById(schoolId, userId);

    await sql.begin(async (tx) => {
      await tx`DELETE FROM notifications WHERE user_id = ${userId}`;
      await tx`DELETE FROM attachments WHERE uploaded_by = ${userId}`;
      await tx`DELETE FROM announcements WHERE created_by = ${userId}`;
      await tx`DELETE FROM invites WHERE created_by = ${userId}`;
      await tx`DELETE FROM attendance WHERE marked_by = ${userId}`;
      await tx`DELETE FROM enrollments WHERE enrolled_by = ${userId}`;
      await tx`DELETE FROM audit_logs WHERE user_id = ${userId}`;
      await tx`DELETE FROM user_roles WHERE user_id = ${userId}`;
      await tx`DELETE FROM users WHERE user_id = ${userId} AND school_id = ${schoolId}`;
    });

    return { deleted: true, userId };
  }
}

module.exports = new UserManagementService();
