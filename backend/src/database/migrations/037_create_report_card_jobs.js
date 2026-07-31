/**
 * Migration 037: Create report_card_jobs table for background job tracking.
 *
 * This table stores the state of each background report-card generation job,
 * enabling the dashboard to show real-time progress, history, and error details.
 */
module.exports = {
  name: '037_create_report_card_jobs',
  up: async (sql) => {
    console.log('  ↳ Creating report_card_jobs table…');

    // ── Job status enum ──
    await sql`
      DO $$ BEGIN
        CREATE TYPE report_card_job_status AS ENUM (
          'QUEUED', 'ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `;
    console.log('  ✓ Created report_card_job_status enum');

    // ── Main job tracking table ──
    await sql`
      CREATE TABLE IF NOT EXISTS report_card_jobs (
        job_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id         UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
        class_level_id    UUID NOT NULL,
        period_structure_id UUID NOT NULL,
        sequence_id       UUID,
        education_system_code VARCHAR(20),
        actor_id          UUID,
        status            report_card_job_status NOT NULL DEFAULT 'QUEUED',
        total_students    INTEGER NOT NULL DEFAULT 0,
        completed_students INTEGER NOT NULL DEFAULT 0,
        failed_students   INTEGER NOT NULL DEFAULT 0,
        results           JSONB DEFAULT '[]'::jsonb,
        errors            JSONB DEFAULT '[]'::jsonb,
        error_message     TEXT,
        bull_job_id       VARCHAR(255),
        started_at        TIMESTAMPTZ,
        completed_at      TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    console.log('  ✓ Created report_card_jobs table');

    // ── Indexes for fast listing & filtering ──
    await sql`
      CREATE INDEX IF NOT EXISTS idx_report_card_jobs_school
      ON report_card_jobs(school_id, created_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_report_card_jobs_status
      ON report_card_jobs(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_report_card_jobs_bull
      ON report_card_jobs(bull_job_id)
    `;

    console.log('  ✓ Created indexes');
    console.log('  ✓ Migration 037 complete');
  },
  down: async (sql) => {
    console.log('  ↳ Rolling back 037…');
    await sql`DROP TABLE IF EXISTS report_card_jobs CASCADE`;
    await sql`DROP TYPE IF EXISTS report_card_job_status`;
    console.log('  ✓ Rollback complete');
  },
};