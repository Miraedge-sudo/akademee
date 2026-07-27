/**
 * Migration Script : Ancien système → Nouveau système de notation
 *
 * Ce script migre les notes existantes de l'ancien système
 * (table `grades` avec `subject_id`, sans `assessment_component_id`)
 * vers le nouveau système (grades liées à des `assessment_components`).
 *
 * Usage :
 *   cd backend
 *   node scripts/migrate-grades.js
 *
 * Ce qui est fait :
 * 1. Trouve toutes les notes avec subject_id mais sans assessment_component_id
 * 2. Pour chaque combinaison unique (subject_id, student_id, period_id) :
 *    a. Trouve la classe de l'élève (via enrollments)
 *    b. Crée (ou retrouve) une subject_offering
 *    c. Crée (ou retrouve) un assessment_component par défaut (type GENERIC)
 * 3. Met à jour chaque note avec le assessment_component_id correspondant
 * 4. Affiche un rapport des notes migrées
 */

require('dotenv').config();
const sql = require('../src/config/database');

async function migrateGrades() {
  console.log('🚀 Migration des notes : ancien système → nouveau système');
  console.log('='.repeat(70));

  // ── Étape 1 : Trouver toutes les notes à migrer ──
  const gradesToMigrate = await sql`
    SELECT g.grade_id, g.school_id, g.student_id, g.subject_id, g.period_id, g.score,
           s.name AS subject_name
    FROM grades g
    JOIN subjects s ON g.subject_id = s.subject_id
    WHERE g.assessment_component_id IS NULL
      AND g.subject_id IS NOT NULL
    ORDER BY g.school_id, g.subject_id, g.student_id, g.period_id
  `;

  if (gradesToMigrate.length === 0) {
    console.log('✅ Aucune note à migrer. Toutes les notes sont déjà dans le nouveau système.');
    process.exit(0);
  }

  console.log(`📊 ${gradesToMigrate.length} note(s) à traiter`);

  // ── Étape 2 : Grouper par (subject_id, student_id, period_id) ──
  const grouped = {};
  for (const g of gradesToMigrate) {
    const key = `${g.school_id}|${g.student_id}|${g.subject_id}|${g.period_id || 'null'}`;
    if (!grouped[key]) {
      grouped[key] = {
        schoolId: g.school_id,
        studentId: g.student_id,
        subjectId: g.subject_id,
        subjectName: g.subject_name,
        periodId: g.period_id,
        gradeIds: [],
      };
    }
    grouped[key].gradeIds.push(g.grade_id);
  }

  const groups = Object.values(grouped);
  console.log(`🔗 ${groups.length} groupe(s) unique(s) (subject + student + period)`);

  // ── Cache pour éviter les doublons ──
  const offeringCache = {};  // key → offering_id
  const componentCache = {}; // key → component_id

  let created = 0;
  let skipped = 0;
  let errors = [];

  for (const group of groups) {
    const { schoolId, studentId, subjectId, periodId, gradeIds } = group;
    const cacheKey = `${schoolId}|${subjectId}|${studentId}|${periodId || 'null'}`;

    try {
      // ── a. Trouver la classe de l'élève ──
      let classId = null;
      if (periodId) {
        const enrollRows = await sql`
          SELECT class_id FROM enrollments
          WHERE student_id = ${studentId} AND school_id = ${schoolId}
            AND status = 'active'
          LIMIT 1
        `;
        if (enrollRows.length > 0) classId = enrollRows[0].class_id;
      }

      if (!classId || !periodId) {
        console.warn(`  ⚠️  Élève ${studentId} : pas de classe active → création impossible (${gradeIds.length} note(s))`);
        skipped += gradeIds.length;
        continue;
      }

      // ── b. Trouver ou créer une subject_offering ──
      let offeringId = offeringCache[cacheKey];
      if (!offeringId) {
        const existing = await sql`
          SELECT subject_offering_id FROM subject_offerings
          WHERE subject_id = ${subjectId}
            AND class_level_id = ${classId}
            AND period_structure_id = ${periodId}
          LIMIT 1
        `;
        if (existing.length > 0) {
          offeringId = existing[0].subject_offering_id;
        } else {
          const createdOffering = await sql`
            INSERT INTO subject_offerings (subject_id, class_level_id, period_structure_id, coefficient, credits, is_elective)
            VALUES (${subjectId}, ${classId}, ${periodId}, 1, 0, false)
            RETURNING subject_offering_id
          `;
          offeringId = createdOffering[0].subject_offering_id;
        }
        offeringCache[cacheKey] = offeringId;
      }

      // ── c. Trouver ou créer un assessment_component GENERIC ──
      let componentId = componentCache[cacheKey];
      if (!componentId) {
        const existing = await sql`
          SELECT assessment_component_id FROM assessment_components
          WHERE subject_offering_id = ${offeringId} AND type = 'GENERIC'
          LIMIT 1
        `;
        if (existing.length > 0) {
          componentId = existing[0].assessment_component_id;
        } else {
          const newComp = await sql`
            INSERT INTO assessment_components (subject_offering_id, type, weight_percent, max_score)
            VALUES (${offeringId}, 'GENERIC', 100, 20)
            RETURNING assessment_component_id
          `;
          componentId = newComp[0].assessment_component_id;
        }
        componentCache[cacheKey] = componentId;
      }

      // ── d. Mettre à jour les notes ──
      await sql`
        UPDATE grades
        SET assessment_component_id = ${componentId},
            status = 'GRADED'
        WHERE grade_id = ANY(${gradeIds})
          AND assessment_component_id IS NULL
      `;

      created += gradeIds.length;
      console.log(`  ✅ ${gradeIds.length} note(s) : ${group.subjectName} (élève ${studentId.slice(0, 8)}…)`);

    } catch (err) {
      errors.push({ key: cacheKey, error: err.message });
      console.error(`  ❌ Erreur pour ${cacheKey}: ${err.message}`);
    }
  }

  // ── Rapport ──
  console.log('='.repeat(70));
  console.log('📋 RAPPORT DE MIGRATION');
  console.log(`   Total notes traitées : ${gradesToMigrate.length}`);
  console.log(`   ✅ Migrées avec succès : ${created}`);
  console.log(`   ⚠️  Ignorées (pas de classe) : ${skipped}`);
  console.log(`   ❌ Erreurs : ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n   Détail des erreurs :');
    errors.forEach(e => console.log(`   - ${e.key}: ${e.error}`));
  }

  console.log('\n✅ Migration terminée.');
  process.exit(0);
}

migrateGrades().catch(err => {
  console.error('💥 Erreur fatale :', err);
  process.exit(1);
});
