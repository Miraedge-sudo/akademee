/**
 * MIGRATION 044: Rattache les classes existantes sans année (academic_year_id
 * NULL) à l'année scolaire active de leur école (is_current, sinon la plus
 * récente). Ces classes ont été créées avant la sélection automatique
 * d'année et disparaissaient des filtres par année (ex: page Emploi du temps
 * → « No classes » alors que des classes existent).
 * Run: node scripts/migrate.js 044
 */

module.exports = async (sql) => {
  // Pour chaque classe sans année, rattache à l'année active de son école
  // (is_current en priorité, sinon la plus récente par date de début).
  const updated = await sql`
    UPDATE classes c
    SET academic_year_id = sub.year_id
    FROM (
      SELECT
        cls.class_id,
        ay.academic_year_id AS year_id
      FROM classes cls
      JOIN LATERAL (
        SELECT academic_year_id
        FROM academic_years
        WHERE school_id = cls.school_id
        ORDER BY is_current DESC, start_date DESC NULLS LAST
        LIMIT 1
      ) ay ON TRUE
      WHERE cls.academic_year_id IS NULL
    ) sub
    WHERE c.class_id = sub.class_id
    RETURNING c.class_id, c.name, c.academic_year_id
  `;

  console.log(`✅ ${updated.length} classe(s) rattachée(s) à leur année scolaire`);
  return { classesUpdated: updated.length };
};
