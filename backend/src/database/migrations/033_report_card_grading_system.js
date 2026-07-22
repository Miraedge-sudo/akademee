/**
 * MIGRATION 033: Report Card Grading System
 * Run: node scripts/migrate.js 033
 *
 * Creates the normalized tables, enums and indexes required by the
 * Report Card Grading System technical specification (v1.2).
 *
 * This migration is additive: it creates new tables and adds nullable
 * columns to existing ones so current data is never lost.
 */

module.exports = async (sql) => {
  console.log('Creating report-card grading system tables and enums...\n');

  // ------------------------------------------------------------------
  // ENUMs
  // ------------------------------------------------------------------
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_system_code_enum') THEN
        CREATE TYPE education_system_code_enum AS ENUM ('ANG_GEN','FR_GEN','ANG_TECH','FR_TECH','UNIV');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rounding_rule_enum') THEN
        CREATE TYPE rounding_rule_enum AS ENUM ('round_half_up','round_half_even','truncate');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subject_category_enum') THEN
        CREATE TYPE subject_category_enum AS ENUM ('CORE','OPTIONAL','TECHNICAL_PRACTICAL','TECHNICAL_THEORY');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_component_type_enum') THEN
        CREATE TYPE assessment_component_type_enum AS ENUM ('CONTINUOUS_ASSESSMENT','EXAM','PRACTICAL','THEORY','CC','TP','RESIT');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grade_status_enum') THEN
        CREATE TYPE grade_status_enum AS ENUM ('GRADED','ABSENT_JUSTIFIED','ABSENT_UNJUSTIFIED','EXEMPTED','PENDING');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compensation_mode_enum') THEN
        CREATE TYPE compensation_mode_enum AS ENUM ('NONE','GROUP_AVERAGE','WEIGHTED_GROUP_AVERAGE');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_card_status_enum') THEN
        CREATE TYPE report_card_status_enum AS ENUM ('DRAFT','COMPLETE','PUBLISHED','LOCKED','REVISED','ARCHIVED');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_card_granularity_enum') THEN
        CREATE TYPE report_card_granularity_enum AS ENUM ('SEQUENCE','TERM','QUARTER','SEMESTER','ANNUAL');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_card_language_enum') THEN
        CREATE TYPE report_card_language_enum AS ENUM ('FR','EN','BILINGUAL');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action_enum') THEN
        CREATE TYPE audit_action_enum AS ENUM ('CREATE','UPDATE','DELETE','PUBLISH','UNLOCK','REVISE','LOCK','ARCHIVE');
      END IF;
    END$$;
  `;
  console.log('✅ Created grading system ENUM types');

  // ------------------------------------------------------------------
  // Existing table extensions
  // ------------------------------------------------------------------
  await sql`
    ALTER TABLE classes
      ADD COLUMN IF NOT EXISTS education_system_id UUID,
      ADD COLUMN IF NOT EXISTS credit_bearing BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS homeroom_teacher_id UUID;
  `;
  console.log('✅ Extended classes table');

  await sql`
    ALTER TABLE subjects
      ADD COLUMN IF NOT EXISTS code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100),
      ADD COLUMN IF NOT EXISTS name_en VARCHAR(100),
      ADD COLUMN IF NOT EXISTS category subject_category_enum DEFAULT 'CORE',
      ADD COLUMN IF NOT EXISTS applicable_systems TEXT[];
  `;
  console.log('✅ Extended subjects table');

  await sql`
    ALTER TABLE periods
      ADD COLUMN IF NOT EXISTS parent_period_id UUID REFERENCES periods(period_id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT 1,
      ADD COLUMN IF NOT EXISTS label_fr VARCHAR(100),
      ADD COLUMN IF NOT EXISTS label_en VARCHAR(100),
      ADD COLUMN IF NOT EXISTS education_system_id UUID,
      ADD COLUMN IF NOT EXISTS system_type VARCHAR(20);
  `;
  console.log('✅ Extended periods table');

  await sql`
    ALTER TABLE grades
      ALTER COLUMN score DROP NOT NULL,
      ADD COLUMN IF NOT EXISTS status grade_status_enum DEFAULT 'GRADED',
      ADD COLUMN IF NOT EXISTS assessment_component_id UUID,
      ADD COLUMN IF NOT EXISTS entered_by UUID,
      ADD COLUMN IF NOT EXISTS entered_at TIMESTAMP DEFAULT now(),
      ADD COLUMN IF NOT EXISTS is_resit BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS previous_score NUMERIC;
  `;
  console.log('✅ Extended grades table');

  await sql`
    ALTER TABLE enrollments
      ADD COLUMN IF NOT EXISTS enrolled_from DATE,
      ADD COLUMN IF NOT EXISTS enrolled_to DATE,
      ADD COLUMN IF NOT EXISTS origin_class_level_id UUID;
  `;
  console.log('✅ Extended enrollments table');

  // ------------------------------------------------------------------
  // New tables
  // ------------------------------------------------------------------

  // EducationSystem
  await sql`
    CREATE TABLE IF NOT EXISTS education_systems (
      education_system_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code education_system_code_enum NOT NULL UNIQUE,
      name_fr VARCHAR(100),
      name_en VARCHAR(100),
      period_hierarchy JSONB,
      grading_scale_id UUID,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created education_systems table');

  // GradingScale
  await sql`
    CREATE TABLE IF NOT EXISTS grading_scales (
      grading_scale_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      min_value NUMERIC NOT NULL DEFAULT 0,
      max_value NUMERIC NOT NULL DEFAULT 20,
      current_version_id UUID,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created grading_scales table');

  // GradingScaleVersion
  await sql`
    CREATE TABLE IF NOT EXISTS grading_scale_versions (
      grading_scale_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      grading_scale_id UUID REFERENCES grading_scales(grading_scale_id) ON DELETE CASCADE,
      pass_mark NUMERIC NOT NULL DEFAULT 10,
      rounding_rule rounding_rule_enum DEFAULT 'round_half_up',
      decimal_precision INT DEFAULT 2,
      effective_from TIMESTAMP DEFAULT now(),
      effective_to TIMESTAMP
    );
  `;
  console.log('✅ Created grading_scale_versions table');

  // MentionThresholdSet / MentionThreshold
  await sql`
    CREATE TABLE IF NOT EXISTS mention_threshold_sets (
      threshold_set_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      education_system_id UUID REFERENCES education_systems(education_system_id) ON DELETE CASCADE,
      grading_scale_id UUID REFERENCES grading_scales(grading_scale_id) ON DELETE CASCADE,
      effective_from TIMESTAMP DEFAULT now(),
      effective_to TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS mention_thresholds (
      mention_threshold_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      threshold_set_id UUID REFERENCES mention_threshold_sets(threshold_set_id) ON DELETE CASCADE,
      min_value NUMERIC NOT NULL,
      max_value NUMERIC,
      mention_label_fr VARCHAR(100),
      mention_label_en VARCHAR(100)
    );
  `;
  console.log('✅ Created mention threshold tables');

  // UEGroup
  await sql`
    CREATE TABLE IF NOT EXISTS ue_groups (
      ue_group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      program_id UUID REFERENCES classes(class_id) ON DELETE CASCADE,
      period_structure_id UUID REFERENCES periods(period_id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      compensation_mode compensation_mode_enum DEFAULT 'NONE',
      min_group_average NUMERIC DEFAULT 10,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created ue_groups table');

  // SubjectOffering
  await sql`
    CREATE TABLE IF NOT EXISTS subject_offerings (
      subject_offering_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject_id UUID REFERENCES subjects(subject_id) ON DELETE CASCADE,
      class_level_id UUID REFERENCES classes(class_id) ON DELETE CASCADE,
      period_structure_id UUID REFERENCES periods(period_id) ON DELETE CASCADE,
      ue_group_id UUID REFERENCES ue_groups(ue_group_id) ON DELETE SET NULL,
      coefficient NUMERIC NOT NULL DEFAULT 1 CHECK (coefficient > 0),
      credits NUMERIC DEFAULT 0,
      is_elective BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      UNIQUE(subject_id, class_level_id, period_structure_id)
    );
  `;
  console.log('✅ Created subject_offerings table');

  // AssessmentComponent
  await sql`
    CREATE TABLE IF NOT EXISTS assessment_components (
      assessment_component_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject_offering_id UUID REFERENCES subject_offerings(subject_offering_id) ON DELETE CASCADE,
      type assessment_component_type_enum NOT NULL,
      weight_percent NUMERIC NOT NULL DEFAULT 0,
      max_score NUMERIC NOT NULL DEFAULT 20,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created assessment_components table');

  // ReportCardConfig
  await sql`
    CREATE TABLE IF NOT EXISTS report_card_configs (
      report_card_config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      applies_to report_card_granularity_enum NOT NULL,
      language_mode report_card_language_enum DEFAULT 'BILINGUAL',
      field_toggles JSONB DEFAULT '{}',
      grading_scale_id UUID,
      signature_blocks JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      UNIQUE(school_id, applies_to)
    );
  `;
  console.log('✅ Created report_card_configs table');

  // ReportCard
  await sql`
    CREATE TABLE IF NOT EXISTS report_cards (
      report_card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
      period_structure_id UUID REFERENCES periods(period_id) ON DELETE CASCADE,
      status report_card_status_enum DEFAULT 'DRAFT',
      version INT DEFAULT 1,
      general_average NUMERIC,
      class_rank INT,
      partial_ranking BOOLEAN DEFAULT FALSE,
      class_size INT,
      class_average NUMERIC,
      mention VARCHAR(100),
      grading_scale_version_id UUID,
      threshold_set_id UUID,
      report_card_config_id UUID,
      payload JSONB,
      computed_at TIMESTAMP,
      published_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      UNIQUE(student_id, period_structure_id, version)
    );
  `;
  console.log('✅ Created report_cards table');

  // ReportCardLine
  await sql`
    CREATE TABLE IF NOT EXISTS report_card_lines (
      report_card_line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      report_card_id UUID REFERENCES report_cards(report_card_id) ON DELETE CASCADE,
      subject_offering_id UUID,
      subject_average NUMERIC,
      coefficient NUMERIC NOT NULL DEFAULT 1,
      weighted_points NUMERIC,
      subject_rank INT,
      teacher_remark TEXT,
      validation_reason VARCHAR(100),
      resit_average NUMERIC,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created report_card_lines table');

  // AuditLog
  await sql`
    CREATE TABLE IF NOT EXISTS grading_audit_logs (
      audit_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type VARCHAR(50) NOT NULL,
      entity_id UUID NOT NULL,
      action audit_action_enum NOT NULL,
      actor_id UUID,
      before_value JSONB,
      after_value JSONB,
      timestamp TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created grading_audit_logs table');

  // ------------------------------------------------------------------
  // Indexes
  // ------------------------------------------------------------------
  await sql`CREATE INDEX IF NOT EXISTS idx_classes_education_system_id ON classes(education_system_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subjects_school_id_category ON subjects(school_id, category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_periods_parent_id ON periods(parent_period_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_periods_education_system_id ON periods(education_system_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_grades_assessment_component_id ON grades(assessment_component_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_grades_entered_by ON grades(entered_by)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_grades_status ON grades(status)`;

  await sql`CREATE INDEX IF NOT EXISTS idx_subject_offerings_class_level_id ON subject_offerings(class_level_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subject_offerings_period_structure_id ON subject_offerings(period_structure_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_assessment_components_subject_offering_id ON assessment_components(subject_offering_id)`;

  await sql`CREATE INDEX IF NOT EXISTS idx_report_cards_student_id ON report_cards(student_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_report_cards_period_structure_id ON report_cards(period_structure_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_report_cards_status ON report_cards(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_report_card_lines_report_card_id ON report_card_lines(report_card_id)`;

  await sql`CREATE INDEX IF NOT EXISTS idx_grading_audit_logs_entity ON grading_audit_logs(entity_type, entity_id)`;
  console.log('✅ Created grading system indexes\n');

  // ------------------------------------------------------------------
  // Seed default education systems
  // ------------------------------------------------------------------
  await sql`
    INSERT INTO education_systems (code, name_fr, name_en, period_hierarchy)
    VALUES
      ('ANG_GEN', 'Anglophone General', 'Anglophone General', '["sequence","term"]'),
      ('FR_GEN', 'Francophone General', 'Francophone General', '["sequence","trimestre"]'),
      ('ANG_TECH', 'Anglophone Technical', 'Anglophone Technical', '["sequence","term"]'),
      ('FR_TECH', 'Francophone Technique', 'Francophone Technical', '["sequence","trimestre"]'),
      ('UNIV', 'Universitaire (LMD)', 'University (LMD)', '["semester","academic_year"]')
    ON CONFLICT (code) DO NOTHING;
  `;
  console.log('✅ Seeded default education systems');
};
