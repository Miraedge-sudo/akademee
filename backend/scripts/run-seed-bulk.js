/**
 * Bulk Data Seed Runner — exécute scripts/seed-bulk.sql
 *
 * Usage:
 *   node scripts/run-seed-bulk.js
 *
 * Variables d'environnement optionnelles (surchargent la config du .sql) :
 *   SEED_SCHOOLS=2 SEED_CLASSES=6 SEED_STUDENTS_PER_CLASS=40 \
 *   SEED_TEACHERS=10 SEED_SUBJECTS=14 SEED_ATTENDANCE_DAYS=15 \
 *   SEED_PAYMENTS_PER_STUDENT=3 SEED_SEQUENCES_GRADES=4 SEED_PREFIX=perf \
 *   node scripts/run-seed-bulk.js
 *
 * Sécurité : l'ensemble s'exécute dans UNE transaction — une erreur = rollback
 * complet (aucune donnée partielle). Les écoles existantes sont ignorées.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sql = require('../src/config/database');

const SCRIPT_PATH = path.join(__dirname, 'seed-bulk.sql');

// ── Surcharge de la config via variables d'environnement ──────────────────
const overrides = {
  v_nb_schools: 'SEED_SCHOOLS',
  v_nb_classes: 'SEED_CLASSES',
  v_nb_students_per_class: 'SEED_STUDENTS_PER_CLASS',
  v_nb_teachers: 'SEED_TEACHERS',
  v_nb_accountants: 'SEED_ACCOUNTANTS',
  v_nb_subjects: 'SEED_SUBJECTS',
  v_subjects_per_class: 'SEED_SUBJECTS_PER_CLASS',
  v_attendance_days: 'SEED_ATTENDANCE_DAYS',
  v_payments_per_student: 'SEED_PAYMENTS_PER_STUDENT',
  v_sequences_for_grades: 'SEED_SEQUENCES_GRADES',
  v_prefix: 'SEED_PREFIX',
};

function applyOverrides(script) {
  let result = script;
  for (const [variable, envVar] of Object.entries(overrides)) {
    const value = process.env[envVar];
    if (value === undefined) continue;

    if (variable === 'v_prefix') {
      result = result.replace(
        new RegExp(`(${variable}\\s+TEXT := )'[^']*'`),
        `$1'${value}'`,
      );
    } else {
      result = result.replace(
        new RegExp(`(${variable}\\s+INT\\s*:= )\\d+`),
        `$1${value}`,
      );
    }
    console.log(`ℹ️  ${variable} → ${value} (via ${envVar})`);
  }
  return result;
}

async function main() {
  console.log('\n============================================================');
  console.log('SEED BULK DATA — injection de données en volume');
  console.log('============================================================\n');

  let script = fs.readFileSync(SCRIPT_PATH, 'utf8');
  script = applyOverrides(script);

  const t0 = Date.now();
  console.log('⏳ Exécution du script SQL (transaction unique)...\n');

  await sql.unsafe(script);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\n✅ Script exécuté avec succès en ${elapsed}s (transaction committée).`);

  // ── Récapitulatif des volumes injectés ──────────────────────────────────
  const tables = [
    'schools',
    'users',
    'students',
    'guardians',
    'academic_years',
    'classes',
    'subjects',
    'enrollments',
    'periods',
    'sequences',
    'fees',
    'student_fees',
    'payments',
    'grades',
    'attendance',
    'notifications',
    'announcements',
    'exams',
    'exam_registrations',
    'school_media',
  ];

  console.log('\n📊 Volumes actuels en base :');
  const counts = {};
  for (const table of tables) {
    const rows = await sql`SELECT COUNT(*)::int AS total FROM ${sql(table)}`;
    counts[table] = rows[0].total;
    console.log(`  ${table.padEnd(22)} ${String(rows[0].total).padStart(8)}`);
  }

  // Seuil de détection : les écoles créées commencent par le préfixe utilisé
  const prefix = process.env.SEED_PREFIX || 'perf';
  const newSchools = await sql`
    SELECT subdomain, name FROM schools
    WHERE subdomain LIKE ${prefix + '%'}
    ORDER BY subdomain
  `;
  if (newSchools.length > 0) {
    console.log(`\n🏫 Écoles créées (préfixe "${prefix}") :`);
    for (const s of newSchools) console.log(`  - ${s.subdomain}  (${s.name})`);
  }

  console.log('\n🔑 Tous les comptes utilisateurs ont le mot de passe : Akademee@2025');
  console.log('   (login_email = email, ou email + .teacher/.student/.accountant)');
  console.log('\n============================================================');
  console.log('✨ Seed bulk terminé !');
  console.log('============================================================\n');

  await sql.end();
}

main().catch((err) => {
  console.error('\n❌ Seed bulk échoué :', err.message);
  console.error('⚠️  Transaction annulée — aucune donnée partielle insérée.');
  console.error(err.stack);
  process.exit(1);
});
