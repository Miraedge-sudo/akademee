module.exports = async (sql) => {
  console.log('Creating system_levels, system_series, and sequences tables...\n');

  await sql`
    CREATE TABLE IF NOT EXISTS system_levels (
      level_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('Created system_levels table');

  await sql`
    CREATE TABLE IF NOT EXISTS system_series (
      series_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('Created system_series table');

  await sql`
    CREATE TABLE IF NOT EXISTS educational_system_levels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      educational_system_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      level_id UUID REFERENCES system_levels(level_id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT now(),
      UNIQUE(educational_system_id, level_id)
    );
  `;
  console.log('Created educational_system_levels junction table');

  await sql`
    CREATE TABLE IF NOT EXISTS educational_system_series (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      educational_system_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      series_id UUID REFERENCES system_series(series_id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT now(),
      UNIQUE(educational_system_id, series_id)
    );
  `;
  console.log('Created educational_system_series junction table');

  await sql`
    CREATE TABLE IF NOT EXISTS sequences (
      sequence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      period_id UUID REFERENCES periods(period_id) ON DELETE CASCADE,
      label VARCHAR(200) NOT NULL,
      date_debut DATE,
      date_fin DATE,
      status TEXT DEFAULT 'EN_ATTENTE' CHECK (status IN ('EN_ATTENTE','OUVERTE','FERMEE','VERROUILLEE')),
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('Created sequences table');

  await sql`
    ALTER TABLE classes
      ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES system_levels(level_id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES system_series(series_id) ON DELETE SET NULL
  `;
  console.log('Added level_id and series_id columns to classes table');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_system_levels_school_id ON system_levels(school_id);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_system_series_school_id ON system_series(school_id);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sequences_school_id ON sequences(school_id);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sequences_period_id ON sequences(period_id);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_classes_level_id ON classes(level_id);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_classes_series_id ON classes(series_id);
  `;
  console.log('Created indexes\n');
};
