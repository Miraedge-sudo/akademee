/**
 * MIGRATION 047: Add trial plan to subscription_plan_enum and seed trial plan
 * Run: node scripts/migrate.js 047
 */

module.exports = async (sql) => {
  console.log('Adding trial plan to subscription_plan_enum...\n');

  // Add 'trial' to the subscription_plan_enum if not already present
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'subscription_plan_enum' AND e.enumlabel = 'trial'
      ) THEN
        ALTER TYPE subscription_plan_enum ADD VALUE 'trial';
        RAISE NOTICE 'Added trial to subscription_plan_enum';
      ELSE
        RAISE NOTICE 'trial already exists in subscription_plan_enum';
      END IF;
    END$$;
  `;
  console.log('✅ subscription_plan_enum updated\n');

  // Seed the trial plan if not already present
  const existingTrial = await sql`
    SELECT plan_id FROM subscription_plans WHERE code = 'trial'
  `;

  if (existingTrial.length === 0) {
    await sql`
      INSERT INTO subscription_plans (code, name, description, price, currency, max_students, features, is_active, sort_order)
      VALUES (
        'trial',
        'Trial',
        'Try Akademee free for 10 days — full access to core features',
        0,
        'FCFA',
        50,
        '[
          "Free for 10 days",
          "Up to 50 students",
          "Core academics & grading",
          "1 website template",
          "Email support",
          "Public website"
        ]'::jsonb,
        true,
        0
      )
    `;
    console.log('✅ Seeded trial plan (10 days, free, 50 students)');
  } else {
    console.log('⏭️  Trial plan already exists, skipping seed');
  }

  console.log('\n✅ Migration 047 complete\n');
};
