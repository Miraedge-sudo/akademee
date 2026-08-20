/**
 * MIGRATION 049: Update subscription_plans to match landing page annual pricing.
 *
 * Old plans (monthly):  basic=15000, premium=35000
 * New plans (annual):   basic=180000, premium=360000, professional=720000
 *
 * Run: node scripts/migrate.js 049
 */

module.exports = async (sql) => {
  console.log('Updating subscription_plans to annual pricing...\n');

  // 1. Add 'professional' to the subscription_plan_enum if missing
  //    (enum was created in migration 001 with values: free,basic,premium,enterprise)
  //    migration 047 added 'trial'
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'subscription_plan_enum' AND e.enumlabel = 'professional'
      ) THEN
        ALTER TYPE subscription_plan_enum ADD VALUE 'professional';
        RAISE NOTICE 'Added professional to subscription_plan_enum';
      ELSE
        RAISE NOTICE 'professional already exists in subscription_plan_enum';
      END IF;
    END$$;
  `;
  console.log('✅ subscription_plan_enum updated with professional');

  // Update basic plan to annual price
  const basicResult = await sql`
    UPDATE subscription_plans
    SET price = 180000,
        name = 'Basic',
        description = 'Up to 300 students · Core academics & grading · 1 website template',
        currency = 'FCFA',
        max_students = 300,
        features = '[
          "Up to 300 students",
          "Core academics & grading",
          "1 website template",
          "Email support",
          "Public website"
        ]'::jsonb,
        sort_order = 1
    WHERE code = 'basic'
    RETURNING plan_id, code, name, price
  `;
  if (basicResult.length > 0) {
    console.log(`✅ Updated basic plan → ${basicResult[0].price} FCFA/year`);
  } else {
    // Insert if not exists
    await sql`
      INSERT INTO subscription_plans (code, name, description, price, currency, max_students, features, is_active, sort_order)
      VALUES (
        'basic', 'Basic',
        'Up to 300 students · Core academics & grading · 1 website template',
        180000, 'FCFA', 300,
        '["Up to 300 students", "Core academics & grading", "1 website template", "Email support", "Public website"]'::jsonb,
        true, 1
      )
    `;
    console.log('✅ Inserted basic plan at 180,000 FCFA/year');
  }

  // Update premium plan to annual price
  const premiumResult = await sql`
    UPDATE subscription_plans
    SET price = 360000,
        name = 'Premium',
        description = 'Up to 1,500 students · Finance & payroll suite · All 3 website templates',
        currency = 'FCFA',
        max_students = 1500,
        features = '[
          "Up to 1,500 students",
          "Finance & payroll suite",
          "All 3 website templates",
          "Live chat support",
          "Bulk import (Excel/CSV)",
          "Custom branding"
        ]'::jsonb,
        sort_order = 2
    WHERE code = 'premium'
    RETURNING plan_id, code, name, price
  `;
  if (premiumResult.length > 0) {
    console.log(`✅ Updated premium plan → ${premiumResult[0].price} FCFA/year`);
  } else {
    await sql`
      INSERT INTO subscription_plans (code, name, description, price, currency, max_students, features, is_active, sort_order)
      VALUES (
        'premium', 'Premium',
        'Up to 1,500 students · Finance & payroll suite · All 3 website templates',
        360000, 'FCFA', 1500,
        '["Up to 1,500 students", "Finance & payroll suite", "All 3 website templates", "Live chat support", "Bulk import (Excel/CSV)", "Custom branding"]'::jsonb,
        true, 2
      )
    `;
    console.log('✅ Inserted premium plan at 360,000 FCFA/year');
  }

  // Insert professional plan if not exists
  const profResult = await sql`
    SELECT plan_id FROM subscription_plans WHERE code = 'professional'
  `;
  if (profResult.length === 0) {
    await sql`
      INSERT INTO subscription_plans (code, name, description, price, currency, max_students, features, is_active, sort_order)
      VALUES (
        'professional', 'Professional',
        'Unlimited students · Library, transport & hostel · Advanced analytics',
        720000, 'FCFA', NULL,
        '["Unlimited students", "Library, transport & hostel", "Advanced analytics", "Priority support", "API access", "Multi-campus"]'::jsonb,
        true, 3
      )
    `;
    console.log('✅ Inserted professional plan at 720,000 FCFA/year');
  } else {
    // Update if exists
    await sql`
      UPDATE subscription_plans
      SET price = 720000,
          name = 'Professional',
          description = 'Unlimited students · Library, transport & hostel · Advanced analytics',
          currency = 'FCFA',
          max_students = NULL,
          features = '[
            "Unlimited students",
            "Library, transport & hostel",
            "Advanced analytics",
            "Priority support",
            "API access",
            "Multi-campus"
          ]'::jsonb,
          sort_order = 3
      WHERE code = 'professional'
    `;
    console.log('✅ Updated professional plan → 720,000 FCFA/year');
  }

  // Update trial plan if exists (price stays 0)
  await sql`
    UPDATE subscription_plans
    SET name = 'Trial',
        description = 'Try Akademee free for 10 days',
        price = 0,
        currency = 'FCFA',
        max_students = 50,
        features = '[
          "Up to 50 students",
          "Core academics & grading",
          "1 website template",
          "Email support",
          "Public website"
        ]'::jsonb,
        sort_order = 0
    WHERE code = 'trial'
  `;
  console.log('✅ Updated trial plan (free, 10 days)');

  // Verify final state
  const allPlans = await sql`
    SELECT code, name, price, currency FROM subscription_plans WHERE is_active = true ORDER BY sort_order
  `;
  console.log('\n📋 Final plans in database:');
  allPlans.forEach(p => {
    console.log(`   ${p.code}: ${p.name} — ${Number(p.price).toLocaleString()} ${p.currency}`);
  });

  // Verify enum has all needed values
  const enumValues = await sql`
    SELECT e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'subscription_plan_enum'
    ORDER BY e.enumsortorder
  `;
  console.log('\n📋 subscription_plan_enum values:');
  console.log('   ' + enumValues.map(e => e.enumlabel).join(', '));

  console.log('\n✅ Migration 049 complete\n');
};
