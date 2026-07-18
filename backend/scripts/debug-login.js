require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

(async () => {
  // Check what school this user belongs to
  const user = await sql`
    SELECT u.user_id, u.email, u.login_email, u.is_active, u.school_id, s.name as school_name, s.subdomain
    FROM users u
    JOIN schools s ON u.school_id = s.school_id
    WHERE u.login_email = 'blaisekhan204.teacher@gmail.com'
  `;
  console.log('User with school:', user);

  // Check the exact login query
  const loginEmail = 'blaisekhan204.teacher@gmail.com';
  const subdomain = 'grace4fx';
  const schools = await sql`SELECT school_id, name, subdomain, is_active FROM schools WHERE subdomain = ${subdomain}`;
  console.log('School lookup for subdomain:', schools);

  if (schools.length > 0) {
    const matched = await sql`
      SELECT user_id, email, login_email, is_active
      FROM users
      WHERE (login_email = ${loginEmail} OR (login_email IS NULL AND email = ${loginEmail}))
        AND school_id = ${schools[0].school_id} AND is_active = true
    `;
    console.log('Login match:', matched);
  }

  await sql.end();
})();
