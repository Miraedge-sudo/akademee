/**
 * DEV/TEST HELPER — forge a valid access token without hitting the login
 * rate limiter. Reads the same JWT secret + payload shape as AuthService so
 * the token is accepted by authMiddleware.
 *
 * Usage: node scripts/_forge-token.js <subdomain> <email>
 * e.g.   node scripts/_forge-token.js savanes admin@savanes.cm
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const sql = require('../src/config/database');

(async () => {
  const subdomain = process.argv[2];
  const email = process.argv[3];
  if (!subdomain || !email) {
    console.error('Usage: node scripts/_forge-token.js <subdomain> <email>');
    process.exit(1);
  }

  const rows = await sql`
    SELECT u.user_id, u.school_id, u.email, u.first_name, u.last_name,
           s.subdomain, s.name AS school_name,
           COALESCE(ARRAY_AGG(r.role_code) FILTER (WHERE r.role_code IS NOT NULL), '{}') AS roles
    FROM users u
    JOIN schools s ON s.school_id = u.school_id
    LEFT JOIN user_roles ur ON ur.user_id = u.user_id
    LEFT JOIN roles r ON r.role_id = ur.role_id
    WHERE s.subdomain = ${subdomain} AND (u.login_email = ${email} OR u.email = ${email})
    GROUP BY u.user_id, u.school_id, u.email, u.first_name, u.last_name, s.subdomain, s.name
    LIMIT 1
  `;

  if (rows.length === 0) {
    console.error(`No user found: ${email} @ ${subdomain}`);
    process.exit(1);
  }

  const u = rows[0];
  const roleCodes = Array.isArray(u.roles) ? u.roles : [u.roles].filter(Boolean);

  const token = jwt.sign(
    {
      userId: u.user_id,
      schoolId: u.school_id,
      subdomain: u.subdomain,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      roles: roleCodes,
      role: roleCodes[0] || null,
      type: 'access',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  console.log(JSON.stringify({
    token,
    user: {
      id: u.user_id,
      email: u.email,
      roles: roleCodes,
      schoolId: u.school_id,
      subdomain: u.subdomain,
      schoolName: u.school_name,
    },
  }));
  await sql.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
