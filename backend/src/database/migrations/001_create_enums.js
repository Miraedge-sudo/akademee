/**
 * MIGRATION 001: Create ENUM Types
 * Run: node scripts/migrate.js 001
 */

module.exports = async (sql) => {
  console.log('Creating ENUM types...\n');

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'academic_system_enum') THEN
        CREATE TYPE academic_system_enum AS ENUM ('TERM_SEQUENCE','SEMESTER_CA_EXAM');
        RAISE NOTICE 'Created academic_system_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_enum') THEN
        CREATE TYPE subscription_plan_enum AS ENUM ('free','basic','premium','enterprise');
        RAISE NOTICE 'Created subscription_plan_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
        CREATE TYPE subscription_status_enum AS ENUM ('active','trial','suspended','expired');
        RAISE NOTICE 'Created subscription_status_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
        CREATE TYPE gender_enum AS ENUM ('male','female','other');
        RAISE NOTICE 'Created gender_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status_enum') THEN
        CREATE TYPE student_status_enum AS ENUM ('active','inactive','graduated','transferred','suspended');
        RAISE NOTICE 'Created student_status_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_type_enum') THEN
        CREATE TYPE enrollment_type_enum AS ENUM ('new','transfer','repeating');
        RAISE NOTICE 'Created enrollment_type_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'academic_year_status_enum') THEN
        CREATE TYPE academic_year_status_enum AS ENUM ('planned','active','completed','archived');
        RAISE NOTICE 'Created academic_year_status_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'period_type_enum') THEN
        CREATE TYPE period_type_enum AS ENUM ('term','semester','sequence','ca','exam');
        RAISE NOTICE 'Created period_type_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_level_enum') THEN
        CREATE TYPE education_level_enum AS ENUM ('nursery','primary','secondary','high_school','university','vocational');
        RAISE NOTICE 'Created education_level_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'relationship_enum') THEN
        CREATE TYPE relationship_enum AS ENUM ('father','mother','guardian','other');
        RAISE NOTICE 'Created relationship_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fee_payment_status_enum') THEN
        CREATE TYPE fee_payment_status_enum AS ENUM ('pending','partial','paid','overdue');
        RAISE NOTICE 'Created fee_payment_status_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
        CREATE TYPE payment_method_enum AS ENUM ('cash','bank_transfer','mobile_money','cheque','card');
        RAISE NOTICE 'Created payment_method_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM ('pending','completed','failed','refunded');
        RAISE NOTICE 'Created payment_status_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status_enum') THEN
        CREATE TYPE attendance_status_enum AS ENUM ('present','absent','late','excused');
        RAISE NOTICE 'Created attendance_status_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
        CREATE TYPE notification_type_enum AS ENUM ('grade','attendance','payment','discipline','system','announcement');
        RAISE NOTICE 'Created notification_type_enum';
      END IF;
    END$$;
  `;

  console.log('✅ All ENUM types created successfully\n');
};
