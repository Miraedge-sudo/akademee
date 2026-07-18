require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

(async () => {
  // Find inactive duplicate users that have an active counterpart with same login_email
  const inactive = await sql`
    SELECT u.user_id, u.email, u.login_email
    FROM users u
    WHERE u.is_active = false
      AND EXISTS (
        SELECT 1 FROM users u2
        WHERE u2.login_email = u.login_email
          AND u2.is_active = true
          AND u2.school_id = u.school_id
      )
  `;

  console.log(`Found ${inactive.length} inactive duplicates to clean up`);

  for (const u of inactive) {
    // Delete their user_roles first
    await sql`DELETE FROM user_roles WHERE user_id = ${u.user_id}`;
    // Delete the user
    await sql`DELETE FROM users WHERE user_id = ${u.user_id}`;
    console.log(`Deleted duplicate: ${u.login_email} (${u.user_id})`);
  }

  console.log('Done');
  await sql.end();
})();
