/**
 * MIGRATION 003: Create User System (RBAC)
 * Run: node scripts/migrate.js 003
 */

module.exports = async (sql) => {
  console.log('Creating user system tables...\n');

  // Users
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,

      first_name VARCHAR(100),
      last_name VARCHAR(100),
      email VARCHAR(255),
      password_hash TEXT,

      phone VARCHAR(50),
      avatar_url TEXT,

      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP,

      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created users table');

  // Roles
  await sql`
    CREATE TABLE IF NOT EXISTS roles (
      role_id SERIAL PRIMARY KEY,
      role_name VARCHAR(50) UNIQUE,
      role_code VARCHAR(20) UNIQUE
    );
  `;
  console.log('✅ Created roles table');

  // User Roles
  await sql`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_role_id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
      role_id INT REFERENCES roles(role_id) ON DELETE CASCADE
    );
  `;
  console.log('✅ Created user_roles table');

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_role_unique ON user_roles(user_id, role_id)`;
  console.log('✅ Created indexes for user system tables\n');
};
