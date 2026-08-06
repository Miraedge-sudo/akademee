/**
 * MIGRATION 040: Parent Accounts & Campus Messages
 * - Adds user_id to guardians so guardians link to login accounts
 * - Seeds the PARENT role
 * - Creates campus_messages + campus_message_replies for parent ↔ campus contact
 * Run: node scripts/migrate.js 040
 */

module.exports = async (sql) => {
  console.log('Creating parent & campus messages support...\n');

  // 1. Link guardians to a login account
  await sql`
    ALTER TABLE guardians
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE SET NULL
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_guardians_user_id ON guardians(user_id)`;
  console.log('✅ Added guardians.user_id');

  // 2. Seed the PARENT role (frontend routes parents under ROLES.PARENT)
  await sql`
    INSERT INTO roles (role_name, role_code)
    VALUES ('PARENT', 'PARENT')
    ON CONFLICT (role_code) DO NOTHING
  `;
  console.log('✅ Seeded PARENT role');

  // 3. Campus messages (parent/student -> campus)
  await sql`
    CREATE TABLE IF NOT EXISTS campus_messages (
      message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      student_id UUID REFERENCES students(student_id) ON DELETE SET NULL,
      subject VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      created_by VARCHAR(20) NOT NULL DEFAULT 'parent',
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_campus_messages_school ON campus_messages(school_id, status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_campus_messages_user ON campus_messages(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_campus_messages_student ON campus_messages(student_id)`;
  console.log('✅ Created campus_messages table');

  // 4. Replies to campus messages
  await sql`
    CREATE TABLE IF NOT EXISTS campus_message_replies (
      reply_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id UUID NOT NULL REFERENCES campus_messages(message_id) ON DELETE CASCADE,
      school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_campus_message_replies_message ON campus_message_replies(message_id)`;
  console.log('✅ Created campus_message_replies table');

  console.log('\n🎉 Migration 040 applied successfully!\n');
};
