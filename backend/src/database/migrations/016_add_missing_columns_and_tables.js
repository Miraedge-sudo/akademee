/**
 * Migration 016: Add missing columns and tables
 *
 * Adds:
 * - fees: academic_year_id, due_date, is_active
 * - subjects: credits
 * - attendance: marked_by, remarks, class_id
 * - users: employee_number, date_of_hired, qualification
 * - student_fees table
 *
 * NOTE: All foreign keys use UUID to match existing table schemas.
 */
module.exports = async (sql) => {
  // fees columns
  await sql`ALTER TABLE fees ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(academic_year_id)`;
  await sql`ALTER TABLE fees ADD COLUMN IF NOT EXISTS due_date DATE`;
  await sql`ALTER TABLE fees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`;

  // subjects credits
  await sql`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 1`;

  // attendance columns
  await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES users(user_id)`;
  await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS remarks TEXT`;
  await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(class_id)`;

  // users employee fields
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_number VARCHAR(50)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_hired DATE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS qualification TEXT`;

  // student_fees table
  await sql`
    CREATE TABLE IF NOT EXISTS student_fees (
      student_fee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
      fee_id UUID NOT NULL REFERENCES fees(fee_id) ON DELETE CASCADE,
      amount_due DECIMAL(10,2) NOT NULL,
      amount_paid DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      academic_year_id UUID REFERENCES academic_years(academic_year_id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // unique constraint to prevent duplicate fee assignments
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_fees_unique
    ON student_fees(student_id, fee_id, academic_year_id)
  `;
};
