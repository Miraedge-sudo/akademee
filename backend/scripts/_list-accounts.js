require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

(async () => {
  const schools = await sql`SELECT school_id, subdomain, name, is_active FROM schools ORDER BY created_at DESC LIMIT 10`;
  console.log('=== SCHOOLS ===');
  for (const s of schools) {
    console.log(`${s.subdomain} | ${s.name} | active=${s.is_active}`);
  }
  const users = await sql`
    SELECT u.login_email, u.email, u.is_active, s.subdomain, r.role_code
    FROM users u
    JOIN schools s ON s.school_id = u.school_id
    LEFT JOIN user_roles ur ON ur.user_id = u.user_id
    LEFT JOIN roles r ON r.role_id = ur.role_id
    WHERE u.is_active = true
    ORDER BY s.subdomain, r.role_code
    LIMIT 60
  `;
  console.log('\n=== USERS ===');
  for (const u of users) {
    console.log(`${u.login_email} | subdomain=${u.subdomain} | role=${u.role_code || 'NONE'} | active=${u.is_active}`);
  }
  await sql.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
