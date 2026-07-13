/**
 * MIGRATION 020: Create Enrolment Inquiries Table
 * Run: node scripts/migrate.js 020
 */

module.exports = async (sql) => {
  console.log('Creating enrolment_inquiries table...\n');

  await sql`
    CREATE TABLE IF NOT EXISTS enrolment_inquiries (
      inquiry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,

      parent_name VARCHAR(100) NOT NULL,
      parent_email VARCHAR(150) NOT NULL,
      parent_phone VARCHAR(30),
      student_name VARCHAR(200) NOT NULL,
      student_age VARCHAR(20),
      grade VARCHAR(100),
      message TEXT,
      status VARCHAR(20) DEFAULT 'new',

      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created enrolment_inquiries table');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_enrolment_inquiries_school_id ON enrolment_inquiries(school_id);
  `;
  console.log('✅ Created indexes for enrolment_inquiries\n');
};
