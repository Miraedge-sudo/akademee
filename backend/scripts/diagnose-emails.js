/**
 * Diagnostic Script: Check for duplicate emails in users table
 * Usage: node scripts/diagnose-emails.js
 */

require('dotenv').config();
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function diagnoseEmails() {
  try {
    console.log('🔍 Checking for duplicate emails...\n');

    // Check for case-insensitive duplicates
    const duplicates = await sql`
      SELECT LOWER(email) as email_lower, COUNT(*) as count, array_agg(user_id) as user_ids
      FROM users
      WHERE email IS NOT NULL AND email <> ''
      GROUP BY LOWER(email)
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicates.length === 0) {
      console.log('✅ No duplicate emails found.\n');
    } else {
      console.log(`⚠️  Found ${duplicates.length} duplicate email(s):\n`);
      duplicates.forEach(dup => {
        console.log(`  📧 ${dup.email_lower} (${dup.count} occurrences)`);
        console.log(`     User IDs: ${dup.user_ids.join(', ')}\n`);
      });
    }

    // Check if index already exists
    const indexExists = await sql`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'users' 
      AND indexname = 'idx_users_email_unique'
    `;

    if (indexExists.length > 0) {
      console.log('ℹ️  Index idx_users_email_unique already exists.');
    } else {
      console.log('ℹ️  Index idx_users_email_unique does NOT exist.');
    }

    // Show all users with emails
    const allUsers = await sql`
      SELECT user_id, email, first_name, last_name 
      FROM users 
      WHERE email IS NOT NULL AND email <> ''
      ORDER BY LOWER(email)
    `;

    console.log(`\n📋 All users with emails (${allUsers.length} total):`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.first_name} ${user.last_name}) [${user.user_id}]`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

diagnoseEmails();
