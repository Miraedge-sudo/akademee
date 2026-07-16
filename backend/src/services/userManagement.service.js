const bcrypt = require('bcrypt');
const sql = require('../config/database');

class UserManagementService {
  formatUser(row) {
    return {
      id: row.user_id,
      schoolId: row.school_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
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

  async create(schoolId, data) {
    const { firstName, lastName, email, password, phone, roleCode } = data;

    const existing = await sql`SELECT user_id FROM users WHERE email = ${email}`;
    if (existing.length > 0) throw new Error('Email already in use');

    const passwordHash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (school_id, first_name, last_name, email, password_hash, phone, is_active)
      VALUES (${schoolId}, ${firstName}, ${lastName}, ${email}, ${passwordHash}, ${phone || null}, true)
      RETURNING *
    `;
    const user = rows[0];

    if (roleCode) {
      const role = await sql`SELECT role_id FROM roles WHERE role_code = ${roleCode}`;
      if (role.length > 0) {
        await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${user.user_id}, ${role[0].role_id})`;
      }
    }

    return this.formatUser({ ...user, roles: roleCode ? [{ code: roleCode }] : [] });
  }

  async update(schoolId, userId, data) {
    await this.getById(schoolId, userId);
    const { firstName, lastName, email, phone, isActive } = data;

    const rows = await sql`
      UPDATE users SET
        first_name = COALESCE(${firstName || null}, first_name),
        last_name = COALESCE(${lastName || null}, last_name),
        email = COALESCE(${email ?? null}, email),
        phone = COALESCE(${phone ?? null}, phone),
        is_active = COALESCE(${isActive ?? null}, is_active),
        updated_at = NOW()
      WHERE user_id = ${userId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.getById(schoolId, rows[0].user_id);
  }

  async delete(schoolId, userId) {
    await this.getById(schoolId, userId);
    await sql`UPDATE users SET is_active = false, updated_at = NOW() WHERE user_id = ${userId} AND school_id = ${schoolId}`;
    return { deleted: true, userId };
  }
}

module.exports = new UserManagementService();
