/**
 * Migration 016: Add missing columns and tables
 *
 * Adds:
 * - fees: academic_year_id, due_date, is_active
 * - subjects: credits
 * - attendance: marked_by, remarks, class_id
 * - users: employee_number, date_of_hired, qualification
 * - student_fees table
 */
exports.up = async (sql) => {
  // fees columns
  await sql`ALTER TABLE fees ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(academic_year_id)`;
  await sql`ALTER TABLE fees ADD COLUMN IF NOT EXISTS due_date DATE`;
  await sql`ALTER TABLE fees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`;

  // subjects credits
  await sql`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 1`;

  // attendance columns
  await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS marked_by INTEGER REFERENCES users(user_id)`;
  await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS remarks TEXT`;
  await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES classes(class_id)`;

  // users employee fields
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_number VARCHAR(50)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_hired DATE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS qualification TEXT`;

  // student_fees table
  await sql`
    CREATE TABLE IF NOT EXISTS student_fees (
      student_fee_id SERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
      fee_id INTEGER NOT NULL REFERENCES fees(fee_id) ON DELETE CASCADE,
      amount_due DECIMAL(10,2) NOT NULL,
      amount_paid DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      academic_year_id INTEGER REFERENCES academic_years(academic_year_id),
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

exports.down = async (sql) => {
  await sql`DROP TABLE IF EXISTS student_fees`;
  await sql`ALTER TABLE fees DROP COLUMN IF EXISTS academic_year_id`;
  await sql`ALTER TABLE fees DROP COLUMN IF EXISTS due_date`;
  await sql`ALTER TABLE fees DROP COLUMN IF EXISTS is_active`;
  await sql`ALTER TABLE subjects DROP COLUMN IF EXISTS credits`;
  await sql`ALTER TABLE attendance DROP COLUMN IF EXISTS marked_by`;
  await sql`ALTER TABLE attendance DROP COLUMN IF EXISTS remarks`;
  await sql`ALTER TABLE attendance DROP COLUMN IF EXISTS class_id`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS employee_number`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS date_of_hired`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS qualification`;
};
