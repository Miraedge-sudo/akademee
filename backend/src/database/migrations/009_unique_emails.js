/**
 * MIGRATION 009: Enforce globally unique admin emails on users table.
 * School email uniqueness is already enforced on schools.email.
 * Run: node scripts/migrate.js 009
 * 
 * This migration handles duplicate emails by:
 * 1. Identifying case-insensitive duplicates
 * 2. Keeping the first occurrence and clearing email on duplicates
 * 3. Creating a UNIQUE index to prevent future duplicates
 */

module.exports = async (sql) => {
  console.log('Adding unique email constraints...\n');

  try {
    // Step 1: Find and handle duplicate emails (case-insensitive)
    console.log('🔍 Checking for duplicate emails...');
    
    const duplicates = await sql`
      SELECT LOWER(email) as email_lower, array_agg(user_id) as user_ids, COUNT(*) as count
      FROM users
      WHERE email IS NOT NULL AND email <> ''
      GROUP BY LOWER(email)
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate email(s). Resolving by keeping first occurrence...\n`);
      
      for (const dup of duplicates) {
        const userIds = dup.user_ids;
        // Keep first user's email, clear email on others
        const idsToUpdate = userIds.slice(1);
        
        if (idsToUpdate.length > 0) {
          await sql`
            UPDATE users
            SET email = NULL, updated_at = now()
            WHERE user_id = ANY(${idsToUpdate})
          `;
          console.log(`  ✅ Cleared duplicate email "${dup.email_lower}" for ${idsToUpdate.length} user(s)`);
        }
      }
    } else {
      console.log('✅ No duplicate emails found\n');
    }

    // Step 2: Drop the old non-unique index if it exists
    await sql`DROP INDEX IF EXISTS idx_users_email`;
    console.log('🗑️  Removed old non-unique email index');

    // Step 3: Create the new UNIQUE index
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
      ON users (LOWER(email))
      WHERE email IS NOT NULL AND email <> ''
    `;
    console.log('✅ Created unique index on users.email\n');

    // Step 4: Create case-insensitive unique index on schools email
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_email_lower
      ON schools (LOWER(email))
    `;
    console.log('✅ Created case-insensitive unique index on schools.email\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
};
