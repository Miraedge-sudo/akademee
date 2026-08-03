module.exports = async (sql) => {
  console.log('Creating university tables (faculties, departments, programs, research_projects, publications)...\n');

  // Faculties
  await sql`
    CREATE TABLE IF NOT EXISTS faculties (
      faculty_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      name_fr VARCHAR(255),
      code VARCHAR(20) NOT NULL,
      dean_name VARCHAR(255),
      description TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      building VARCHAR(255),
      established_year INTEGER,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('Created faculties table');

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_faculties_code_school ON faculties(school_id, code)`;

  // Departments
  await sql`
    CREATE TABLE IF NOT EXISTS departments (
      department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      faculty_id UUID REFERENCES faculties(faculty_id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      name_fr VARCHAR(255),
      code VARCHAR(20) NOT NULL,
      head_name VARCHAR(255),
      description TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('Created departments table');

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_code_school ON departments(school_id, code)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON departments(faculty_id)`;

  // Programs (LMD)
  await sql`
    CREATE TABLE IF NOT EXISTS programs (
      program_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
      faculty_id UUID REFERENCES faculties(faculty_id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      name_fr VARCHAR(255),
      code VARCHAR(20) NOT NULL,
      cycle VARCHAR(20) NOT NULL CHECK (cycle IN ('LICENCE','MASTER','DOCTORATE')),
      duration_years INTEGER NOT NULL,
      credits_total INTEGER,
      description TEXT,
      admission_requirements TEXT,
      career_opportunities TEXT,
      language VARCHAR(20) DEFAULT 'FR' CHECK (language IN ('FR','EN','BILINGUAL')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('Created programs table');

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_programs_code_school ON programs(school_id, code)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_programs_department_id ON programs(department_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_programs_faculty_id ON programs(faculty_id)`;

  // Research Projects
  await sql`
    CREATE TABLE IF NOT EXISTS research_projects (
      project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
      faculty_id UUID REFERENCES faculties(faculty_id) ON DELETE SET NULL,
      title VARCHAR(500) NOT NULL,
      title_fr VARCHAR(500),
      slug VARCHAR(255) NOT NULL,
      status VARCHAR(20) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','IN_PROGRESS','COMPLETED','ON_HOLD','CANCELLED')),
      start_date DATE,
      end_date DATE,
      funding_source VARCHAR(500),
      budget DECIMAL(15,2),
      principal_investigator VARCHAR(255),
      investigators TEXT[] DEFAULT '{}',
      summary TEXT,
      keywords TEXT[] DEFAULT '{}',
      is_published BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('Created research_projects table');

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_research_projects_slug_school ON research_projects(school_id, slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_research_projects_department_id ON research_projects(department_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_research_projects_faculty_id ON research_projects(faculty_id)`;

  // Publications
  await sql`
    CREATE TABLE IF NOT EXISTS publications (
      publication_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      research_project_id UUID REFERENCES research_projects(project_id) ON DELETE SET NULL,
      department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
      faculty_id UUID REFERENCES faculties(faculty_id) ON DELETE SET NULL,
      title VARCHAR(500) NOT NULL,
      title_fr VARCHAR(500),
      type VARCHAR(30) NOT NULL CHECK (type IN ('JOURNAL_ARTICLE','CONFERENCE_PAPER','THESIS','BOOK','BOOK_CHAPTER','REPORT','OTHER')),
      authors TEXT[] NOT NULL DEFAULT '{}',
      journal_name VARCHAR(500),
      publisher VARCHAR(255),
      doi VARCHAR(255),
      issn VARCHAR(20),
      isbn VARCHAR(20),
      publication_date DATE,
      volume VARCHAR(50),
      issue VARCHAR(50),
      pages VARCHAR(50),
      abstract TEXT,
      keywords TEXT[] DEFAULT '{}',
      url VARCHAR(500),
      citation TEXT,
      is_published BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('Created publications table');

  await sql`CREATE INDEX IF NOT EXISTS idx_publications_school_id ON publications(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_publications_project_id ON publications(research_project_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_publications_department_id ON publications(department_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_publications_type ON publications(type)`;

  console.log('Created indexes\n');
};
