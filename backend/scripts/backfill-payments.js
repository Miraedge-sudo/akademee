/**
 * Backfill Payments — Sync existing completed payments into student_fees and students.fee_status
 *
 * Before the fix (commit where payment.controller.js now calls studentFeeService.updatePayment
 * after creating a payment), payments were recorded *only* in the `payments` table.
 * The `student_fees.amount_paid` and `students.fee_status` were never updated.
 *
 * This script repairs existing data by:
 *   1. Aggregating all completed payments per (school, student, fee)
 *   2. Updating student_fees.amount_paid and student_fees.status accordingly
 *   3. Recalculating students.fee_status for every affected student
 *
 * NOTE: Before running this script, ensure the migration 033 has been run
 *   to add the fee_id column to the payments table:
 *     node scripts/migrate.js 033
 *
 * Old payments (recorded before fee_id was stored) will have fee_id = NULL
 * and will be SKIPPED because they can't be matched to a student_fees record.
 * You may need to manually reconcile those after running the migration.
 *
 * Usage:
 *   node scripts/backfill-payments.js           # LIVE run — modifies data
 *   node scripts/backfill-payments.js --dry-run # Preview only — no writes
 *
 * Recommended: always run with --dry-run first to review the impact.
 */

require('dotenv').config();
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL not found in .env file');
  process.exit(1);
}

const sql = postgres(connectionString);

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('='.repeat(60));
  console.log('  BACKFILL — Sync payments to student_fees & students.fee_status');
  console.log('  Mode: ' + (DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (data WILL be modified)'));
  console.log('='.repeat(60));

  try {
    // Step 0: Connection test
    await sql`SELECT 1`;
    console.log('\nDatabase connected\n');

    // Step 1: Gather statistics
    console.log('Gathering statistics...');

    const [paymentStats] = await sql`
      SELECT
        COUNT(*)::int              AS total_payments,
        COUNT(DISTINCT student_id) AS unique_students,
        COUNT(DISTINCT fee_id)     AS unique_fees,
        COALESCE(SUM(amount), 0)::numeric AS total_amount
      FROM payments
      WHERE status = 'completed'
    `;
    console.log('  Completed payments : ' + paymentStats.total_payments);
    console.log('  Unique students    : ' + paymentStats.unique_students);    const [missingFeeId] = await sql`
      SELECT COUNT(*)::int AS count
      FROM payments
      WHERE status = 'completed' AND fee_id IS NULL
    `;
    if (missingFeeId.count > 0) {
      console.log('\n  NOTE: ' + missingFeeId.count + ' payment(s) have fee_id = NULL (recorded before fix).');
      console.log('  These payments will be SKIPPED because they cannot be matched to a specific fee.');
      console.log('  You may need to manually reconcile them after the run.');
    }

    console.log('  Unique fees        : ' + paymentStats.unique_fees);
    console.log('  Total amount       : ' + Number(paymentStats.total_amount).toLocaleString() + ' FCFA');

    const [orphanedCount] = await sql`
      SELECT COUNT(*)::int AS count
      FROM payments p
      WHERE p.status = 'completed'
        AND p.fee_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM student_fees sf
          WHERE sf.student_id = p.student_id AND sf.fee_id = p.fee_id
            AND sf.school_id = p.school_id
            AND (sf.academic_year_id = p.academic_year_id OR (sf.academic_year_id IS NULL AND p.academic_year_id IS NULL))
        )
    `;
    if (orphanedCount.count > 0) {
      console.log('\n  WARNING: ' + orphanedCount.count + ' payment(s) with fee_id have NO matching student_fees record.');
      console.log('  These payments will be SKIPPED (no fee assignment found).');
      console.log('  You may need to assign fees to the affected students first.');
    }

    const [currentFeeStats] = await sql`
      SELECT
        COUNT(*)::int AS total_fee_records,
        COUNT(*) FILTER (WHERE amount_paid > 0)::int AS has_paid
      FROM student_fees
    `;
    console.log('\n  Existing student_fees records : ' + currentFeeStats.total_fee_records);
    console.log('  Already have amount_paid > 0  : ' + currentFeeStats.has_paid);

    if (DRY_RUN) {
      // DRY RUN: Show what would be affected
      console.log('\nDRY RUN — Preview of changes:');

      const affectedFees = await sql`
        SELECT
          p.school_id,
          p.student_id,
          p.fee_id,
          COALESCE(p.academic_year_id, '00000000-0000-0000-0000-000000000000') AS academic_year_id,
          SUM(p.amount) AS old_amount,
          COALESCE(sf.amount_paid, 0) AS current_amount_paid
        FROM payments p
        LEFT JOIN student_fees sf
          ON sf.student_id = p.student_id
          AND sf.fee_id = p.fee_id
          AND sf.school_id = p.school_id
          AND (sf.academic_year_id = p.academic_year_id OR (sf.academic_year_id IS NULL AND p.academic_year_id IS NULL))
        WHERE p.status = 'completed'
          AND p.fee_id IS NOT NULL
          AND sf.student_fee_id IS NOT NULL
        GROUP BY p.school_id, p.student_id, p.fee_id, p.academic_year_id, sf.amount_paid, sf.student_fee_id
        ORDER BY p.school_id, p.student_id
      `;

      const feesNeedingUpdate = affectedFees.filter(
        f => Number(f.old_amount) !== Number(f.current_amount_paid)
      );

      console.log('  student_fees rows to update : ' + feesNeedingUpdate.length);
      if (feesNeedingUpdate.length > 0) {
        console.log('\n  Sample (up to 10):');
        feesNeedingUpdate.slice(0, 10).forEach(f => {
          const diff = Number(f.old_amount) - Number(f.current_amount_paid);
          const feeLabel = f.fee_id || 'NULL';
          console.log('    student=' + f.student_id + ' fee=' + feeLabel + ': ' + Number(f.current_amount_paid) + ' to ' + Number(f.old_amount) + ' FCFA (delta +' + diff + ')');
        });
      }

      const unchangedCount = affectedFees.length - feesNeedingUpdate.length;
      if (unchangedCount > 0) {
        console.log('\n  Already synced (no change needed): ' + unchangedCount);
      }

      // Students whose fee_status would change
      const statusQuery = buildStudentStatusQuery();
      const affectedStudents = await sql.unsafe(statusQuery);
      console.log('\n  Students with mismatched fee_status : ' + affectedStudents.length);
      if (affectedStudents.length > 0) {
        const reasonCounts = affectedStudents.reduce((acc, s) => {
          acc[s.calculated_status] = (acc[s.calculated_status] || 0) + 1;
          return acc;
        }, {});
        Object.entries(reasonCounts).forEach(([status, count]) => {
          console.log('    ' + count + ' student(s) would become "' + status + '"');
        });
      }
    } else {
      // LIVE: Execute the backfill
      console.log('\nStep 1/2: Updating student_fees.amount_paid...');

      const result1 = await sql`
        UPDATE student_fees sf
        SET
          amount_paid = COALESCE(p.total_paid, 0),
          status = CASE
            WHEN COALESCE(p.total_paid, 0) >= sf.amount_due THEN 'paid'
            WHEN COALESCE(p.total_paid, 0) > 0 THEN 'partial'
            ELSE 'pending'
          END,
          updated_at = NOW()
        FROM (
          SELECT school_id, student_id, fee_id, academic_year_id, SUM(amount)::numeric AS total_paid
          FROM payments
          WHERE status = 'completed' AND fee_id IS NOT NULL
          GROUP BY school_id, student_id, fee_id, academic_year_id
        ) p
        WHERE sf.school_id = p.school_id
          AND sf.student_id = p.student_id
          AND sf.fee_id = p.fee_id
          AND (sf.academic_year_id = p.academic_year_id OR (sf.academic_year_id IS NULL AND p.academic_year_id IS NULL))
      `;
      console.log('  Updated ' + result1.count + ' student_fees row(s)');

      console.log('\nStep 2/2: Recalculating students.fee_status...');

      const result2 = await sql`
        WITH student_fees_agg AS (
          SELECT
            student_id,
            school_id,
            COALESCE(SUM(amount_due), 0)::numeric AS total_fees,
            COALESCE(SUM(amount_paid), 0)::numeric AS total_paid
          FROM student_fees
          GROUP BY student_id, school_id
        ),
        updated AS (
          UPDATE students s SET fee_status =
            CASE
              WHEN COALESCE(sf.total_fees, 0) = 0 THEN 'pending'
              WHEN COALESCE(sf.total_paid, 0) >= COALESCE(sf.total_fees, 0) THEN 'paid'
              WHEN COALESCE(sf.total_paid, 0) > 0 THEN 'partial'
              ELSE 'pending'
            END
          FROM student_fees_agg sf
          WHERE s.student_id = sf.student_id AND s.school_id = sf.school_id
          RETURNING s.student_id, s.fee_status
        )
        SELECT student_id, fee_status FROM updated
      `;
      console.log('  Updated ' + result2.length + ' student(s) fee_status');

      // Summary
      const statusCounts = result2.reduce((acc, r) => {
        acc[r.fee_status] = (acc[r.fee_status] || 0) + 1;
        return acc;
      }, {});
      console.log('\nFinal fee_status distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log('  ' + status + ': ' + count + ' student(s)');
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log(DRY_RUN
      ? 'DRY RUN complete — no data was modified.\n   Run without --dry-run to apply changes.'
      : 'Backfill complete! All existing payments are now synced.'
    );
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

/**
 * Returns a SQL string to find students whose fee_status doesn't match the calculated status.
 * Used only in dry-run mode to preview changes. Must be called via sql.unsafe().
 */
function buildStudentStatusQuery() {
  return `
    WITH student_fees_agg AS (
      SELECT
        student_id,
        school_id,
        COALESCE(SUM(amount_due), 0)::numeric AS total_fees,
        COALESCE(SUM(amount_paid), 0)::numeric AS total_paid
      FROM student_fees
      GROUP BY student_id, school_id
    )
    SELECT
      s.student_id,
      s.fee_status AS current_status,
      CASE
        WHEN COALESCE(sf.total_fees, 0) = 0 THEN 'pending'
        WHEN COALESCE(sf.total_paid, 0) >= COALESCE(sf.total_fees, 0) THEN 'paid'
        WHEN COALESCE(sf.total_paid, 0) > 0 THEN 'partial'
        ELSE 'pending'
      END AS calculated_status
    FROM students s
    LEFT JOIN student_fees_agg sf ON s.student_id = sf.student_id AND s.school_id = sf.school_id
    WHERE s.fee_status IS DISTINCT FROM (
      CASE
        WHEN COALESCE(sf.total_fees, 0) = 0 THEN 'pending'
        WHEN COALESCE(sf.total_paid, 0) >= COALESCE(sf.total_fees, 0) THEN 'paid'
        WHEN COALESCE(sf.total_paid, 0) > 0 THEN 'partial'
        ELSE 'pending'
      END
    )
  `;
}

main();
