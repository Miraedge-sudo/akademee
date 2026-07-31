/**
 * Migration 038: Grading performance indexes.
 *
 * The batch report-card computation queries grades by
 * (student_id, assessment_component_id) and (student_id, sequence_id),
 * plus subject_offerings by (class_level_id, period_structure_id).
 * These composite indexes turn N+1 queries into fast lookups.
 */
module.exports = {
  name: '038_add_grading_perf_indexes',
  up: async (sql) => {
    console.log('  ↳ Creating grading performance indexes…');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_grades_ac_student
      ON grades (assessment_component_id, student_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_grades_student_sequence
      ON grades (student_id, sequence_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_so_class_period
      ON subject_offerings (class_level_id, period_structure_id)
    `;

    console.log('  ✓ Grading performance indexes created');
  },
  down: async (sql) => {
    console.log('  ↳ Dropping grading performance indexes…');
    await sql`DROP INDEX IF EXISTS idx_grades_ac_student`;
    await sql`DROP INDEX IF EXISTS idx_grades_student_sequence`;
    await sql`DROP INDEX IF EXISTS idx_so_class_period`;
    console.log('  ✓ Rollback complete');
  },
};
