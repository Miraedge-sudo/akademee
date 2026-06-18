/**
 * MIGRATION 002: Create Core Tenant Tables
 * Run: node scripts/migrate.js 002
 */

module.exports = async (sql) => {
  console.log('Creating core tenant tables...\n');

  // Website Templates
  await sql`
    CREATE TABLE IF NOT EXISTS website_templates (
      template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100),
      description TEXT,
      preview_url TEXT,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created website_templates table');

  // Schools (Main Tenant Table)
  await sql`
    CREATE TABLE IF NOT EXISTS schools (
      school_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      tagline VARCHAR(255),
      subdomain VARCHAR(100) UNIQUE NOT NULL,

      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      region VARCHAR(100),

      logo_url TEXT,
      hero_image_url TEXT,
      primary_color VARCHAR(7) DEFAULT '#085041',

      website_template_id UUID REFERENCES website_templates(template_id) ON DELETE SET NULL,

      academic_system academic_system_enum DEFAULT 'TERM_SEQUENCE',

      subscription_plan subscription_plan_enum DEFAULT 'free',
      subscription_status subscription_status_enum DEFAULT 'trial',

      subscription_start_date DATE,
      subscription_end_date DATE,

      is_active BOOLEAN DEFAULT TRUE,

      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created schools table');

  // School Media (Cloudinary)
  await sql`
    CREATE TABLE IF NOT EXISTS school_media (
      media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      media_type TEXT CHECK (media_type IN ('logo','hero','gallery','other')),
      url TEXT NOT NULL,
      public_id TEXT,
      caption TEXT,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created school_media table');

  // Create indexes for better query performance
  await sql`CREATE INDEX IF NOT EXISTS idx_schools_subdomain ON schools(subdomain)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_schools_email ON schools(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_school_media_school_id ON school_media(school_id)`;
  console.log('✅ Created indexes for core tables\n');
};
