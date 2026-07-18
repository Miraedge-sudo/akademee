require('dotenv').config();
const sql = require('../src/config/database');

(async () => {
  // Add missing roles
  const missingRoles = [
    { code: 'PARENT', name: 'Parent' },
    { code: 'SECRETARY', name: 'Secretary' },
  ];

  for (const role of missingRoles) {
    const existing = await sql`SELECT role_id FROM roles WHERE UPPER(role_code) = UPPER(${role.code})`;
    if (existing.length === 0) {
      await sql`INSERT INTO roles (role_code, role_name) VALUES (${role.code}, ${role.name})`;
      console.log(`Added role: ${role.code}`);
    } else {
      console.log(`Role already exists: ${role.code}`);
    }
  }

  // Verify
  const roles = await sql`SELECT * FROM roles ORDER BY role_id`;
  console.log('\nAll roles:', JSON.stringify(roles, null, 2));

  // Now fix the parent user who has no role assigned
  const parentUser = await sql`SELECT user_id, first_name, last_name, email FROM users WHERE first_name = 'Parent' AND last_name = 'KHAN' AND is_active = true`;
  if (parentUser.length > 0) {
    const parentRole = await sql`SELECT role_id FROM roles WHERE UPPER(role_code) = 'PARENT'`;
    if (parentRole.length > 0) {
      await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${parentUser[0].user_id}, ${parentRole[0].role_id}) ON CONFLICT DO NOTHING`;
      console.log(`\nAssigned PARENT role to: ${parentUser[0].first_name} ${parentUser[0].last_name}`);
    }
  }

  // Also fix the secretary with no role
  const secUser = await sql`SELECT user_id, first_name, last_name, email FROM users WHERE user_id = '161ee3e0-9471-455f-af99-7075df14d977'`;
  if (secUser.length > 0) {
    const secRole = await sql`SELECT role_id FROM roles WHERE UPPER(role_code) = 'SECRETARY'`;
    if (secRole.length > 0) {
      await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${secUser[0].user_id}, ${secRole[0].role_id}) ON CONFLICT DO NOTHING`;
      console.log(`Assigned SECRETARY role to: ${secUser[0].first_name} ${secUser[0].last_name}`);
    }
  }

  await sql.end();
})();
