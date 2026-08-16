/**
 * MIGRATION 043: Emploi du temps (Timetable) V1
 * Run: node scripts/migrate.js 043
 *
 * Tables créées :
 *  - rooms                     : salles de l'école (salle du cours, vue par salle, conflits salle)
 *  - timetable_periods         : créneaux hebdomadaires (jour + heure début/fin + pause)
 *  - timetable_entries         : un cours dans la grille (matière + classe + enseignant + salle + créneau)
 *  - timetable_unavailabilities: indisponibilités enseignant / classe / salle (jour × créneau)
 *
 * Modèle « grille par classe » (référence : Fedena, benchmark docs/TIMETABLE_BENCHMARK.md).
 * Les créneaux et les cours sont scopés par année académique (cohérent avec le reste d'Akademee).
 * Les contraintes UNIQUE servent de garde-fou DB en plus des vérifications métier du service :
 *  - une classe ne peut pas avoir 2 cours sur le même créneau ;
 *  - un enseignant non plus ;
 *  - une salle non plus (NULL = salle non assignée, autorisé plusieurs fois).
 */

module.exports = async (sql) => {
  console.log('Creating timetable tables...\n');

  // ── Salles ──
  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      capacity INT DEFAULT 0,
      room_type VARCHAR(50) DEFAULT 'classroom',
      created_at TIMESTAMP DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_rooms_school_id ON rooms(school_id)`;
  console.log('✅ Created rooms table');

  // ── Créneaux hebdomadaires (class timings) ──
  // day: 1 = lundi … 6 = samedi (7 = dimanche si besoin)
  await sql`
    CREATE TABLE IF NOT EXISTS timetable_periods (
      period_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
      academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      day SMALLINT NOT NULL CHECK (day BETWEEN 1 AND 7),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_break BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order SMALLINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT now(),
      UNIQUE (school_id, academic_year_id, day, sort_order)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_timetable_periods_school_year ON timetable_periods(school_id, academic_year_id)`;
  console.log('✅ Created timetable_periods table');

  // ── Cours dans la grille ──
  await sql`
    CREATE TABLE IF NOT EXISTS timetable_entries (
      entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
      academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
      class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
      subject_id UUID NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
      teacher_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      room_id UUID REFERENCES rooms(room_id) ON DELETE SET NULL,
      period_id UUID NOT NULL REFERENCES timetable_periods(period_id) ON DELETE CASCADE,
      created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      UNIQUE (academic_year_id, class_id, period_id),
      UNIQUE (academic_year_id, teacher_id, period_id),
      UNIQUE (academic_year_id, room_id, period_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_timetable_entries_school_year ON timetable_entries(school_id, academic_year_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_timetable_entries_class ON timetable_entries(class_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_timetable_entries_teacher ON timetable_entries(teacher_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_timetable_entries_room ON timetable_entries(room_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_timetable_entries_period ON timetable_entries(period_id)`;
  console.log('✅ Created timetable_entries table');

  // ── Indisponibilités (enseignant / classe / salle) ──
  // entity_id est polymorphique : on valide l'existence côté service selon entity_type.
  await sql`
    CREATE TABLE IF NOT EXISTS timetable_unavailabilities (
      unavailability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
      academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
      entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('teacher', 'class', 'room')),
      entity_id UUID NOT NULL,
      period_id UUID NOT NULL REFERENCES timetable_periods(period_id) ON DELETE CASCADE,
      reason VARCHAR(200),
      created_at TIMESTAMP DEFAULT now(),
      UNIQUE (entity_type, entity_id, period_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_timetable_unavail_school_year ON timetable_unavailabilities(school_id, academic_year_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_timetable_unavail_entity ON timetable_unavailabilities(entity_type, entity_id)`;
  console.log('✅ Created timetable_unavailabilities table');

  console.log('\n🎉 Migration 043 applied successfully!\n');
};
