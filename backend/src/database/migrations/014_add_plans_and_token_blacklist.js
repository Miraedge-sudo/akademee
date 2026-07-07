module.exports = async (sql) => {
  console.log('Creating subscription_plans table and token_blacklist table...\n');

  await sql`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price NUMERIC DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'FCFA',
      max_students INT DEFAULT 50,
      features JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT true,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created subscription_plans table');

  // Seed default plans
  const existing = await sql`SELECT COUNT(*)::int AS count FROM subscription_plans`;
  if (existing[0].count === 0) {
    await sql`
      INSERT INTO subscription_plans (code, name, description, price, max_students, features, sort_order) VALUES
      ('free', 'Free', 'Up to 50 students · Grades, attendance, basic reports', 0, 50,
        '["Up to 50 students", "Grades & attendance", "Basic reports"]'::jsonb, 1),
      ('basic', 'Basic', 'Up to 300 students · Full grades, PDF bulletins, finance module', 15000, 300,
        '["Up to 300 students", "Full grades", "PDF bulletins", "Finance module"]'::jsonb, 2),
      ('premium', 'Premium', 'Unlimited students · All features + priority support + custom branding', 35000, -1,
        '["Unlimited students", "All features", "Priority support", "Custom branding"]'::jsonb, 3)
    `;
    console.log('✅ Seeded default subscription plans');
  } else {
    console.log('⏭️  Subscription plans already exist, skipping seed');
  }

  // Token blacklist for JWT logout invalidation
  await sql`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      blacklisted_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created token_blacklist table');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at)
  `;
  console.log('✅ Created indexes for token_blacklist\n');
};
