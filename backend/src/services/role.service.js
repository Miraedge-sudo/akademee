const sql = require('../config/database');

class RoleService {
  async listRoles() {
    const rows = await sql`SELECT role_id, role_code, role_name FROM roles ORDER BY role_name ASC`;
    return rows.map(r => ({ id: r.role_id, code: r.role_code, name: r.role_name }));
  }

  async getUserRoles(userId) {
    const rows = await sql`
      SELECT r.role_id, r.role_code, r.role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = ${userId}
    `;
    return rows.map(r => ({ id: r.role_id, code: r.role_code, name: r.role_name }));
  }

  async assignRole(userId, roleCode) {
    const role = await sql`SELECT role_id FROM roles WHERE role_code = ${roleCode}`;
    if (role.length === 0) throw new Error('Role not found');

    const existing = await sql`
      SELECT user_role_id FROM user_roles WHERE user_id = ${userId} AND role_id = ${role[0].role_id}
    `;
    if (existing.length > 0) throw new Error('User already has this role');

    await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${userId}, ${role[0].role_id})`;
    return { userId, roleCode, assigned: true };
  }

  async removeRole(userId, roleCode) {
    const role = await sql`SELECT role_id FROM roles WHERE role_code = ${roleCode}`;
    if (role.length === 0) throw new Error('Role not found');

    const rows = await sql`
      DELETE FROM user_roles WHERE user_id = ${userId} AND role_id = ${role[0].role_id}
      RETURNING user_role_id
    `;
    if (rows.length === 0) throw new Error('User does not have this role');
    return { userId, roleCode, removed: true };
  }

  async listPermissions() {
    const rows = await sql`
      SELECT permission_id, code, name, module FROM permissions ORDER BY module ASC, name ASC
    `;
    return rows.map(r => ({ id: r.permission_id, code: r.code, name: r.name, module: r.module }));
  }

  async getRolePermissions(roleCode) {
    const role = await sql`SELECT role_id FROM roles WHERE role_code = ${roleCode}`;
    if (role.length === 0) throw new Error('Role not found');

    const rows = await sql`
      SELECT p.permission_id, p.code, p.name, p.module
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE rp.role_id = ${role[0].role_id}
    `;
    return rows.map(r => ({ id: r.permission_id, code: r.code, name: r.name, module: r.module }));
  }

  async assignPermission(roleCode, permissionCode) {
    const role = await sql`SELECT role_id FROM roles WHERE role_code = ${roleCode}`;
    if (role.length === 0) throw new Error('Role not found');

    const perm = await sql`SELECT permission_id FROM permissions WHERE code = ${permissionCode}`;
    if (perm.length === 0) throw new Error('Permission not found');

    await sql`
      INSERT INTO role_permissions (role_id, permission_id) VALUES (${role[0].role_id}, ${perm[0].permission_id})
      ON CONFLICT DO NOTHING
    `;
    return { roleCode, permissionCode, assigned: true };
  }

  async removePermission(roleCode, permissionCode) {
    const role = await sql`SELECT role_id FROM roles WHERE role_code = ${roleCode}`;
    if (role.length === 0) throw new Error('Role not found');

    const perm = await sql`SELECT permission_id FROM permissions WHERE code = ${permissionCode}`;
    if (perm.length === 0) throw new Error('Permission not found');

    await sql`
      DELETE FROM role_permissions WHERE role_id = ${role[0].role_id} AND permission_id = ${perm[0].permission_id}
    `;
    return { roleCode, permissionCode, removed: true };
  }
}

module.exports = new RoleService();
