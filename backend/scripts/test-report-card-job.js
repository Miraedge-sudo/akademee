/**
 * Test script: verify the background report card job queue end-to-end.
 *
 * Steps:
 *  1. Find a class + period for the "mokom" school
 *  2. Generate a valid admin JWT (signed with the real JWT_SECRET)
 *  3. POST /api/v1/report-card-jobs
 *  4. Poll GET /api/v1/report-card-jobs/:id until terminal state
 *  5. Print results
 *
 * Usage: node scripts/test-report-card-job.js [apiBaseUrl] [subdomain]
 *   apiBaseUrl defaults to http://localhost:5000
 *   subdomain defaults to "mokom"; if that school has no class/period,
 *   the script falls back to any school that has both.
 *
 * NOTE: requires Node 18+ (uses global fetch).
 */

require('dotenv').config();
const sql = require('../src/config/database');
const jwt = require('jsonwebtoken');

const API_BASE = process.argv[2] || 'http://localhost:5000';
const SCHOOL_SUBDOMAIN = process.argv[3] || 'mokom';

async function main() {
  console.log('='.repeat(60));
  console.log('  REPORT CARD JOB END-TO-END TEST');
  console.log('='.repeat(60) + '\n');

  // ── 1. Find school + class + period (with fallback) ──
  let [school] = await sql`
    SELECT school_id, name FROM schools WHERE subdomain = ${SCHOOL_SUBDOMAIN} LIMIT 1
  `;

  if (!school) {
    console.log(`⚠ School "${SCHOOL_SUBDOMAIN}" not found — using first school with data.`);
  }

  let cls = null;
  let per = null;

  if (school) {
    [cls] = await sql`
      SELECT c.class_id, c.name FROM classes c
      WHERE c.school_id = ${school.school_id} ORDER BY c.name LIMIT 1
    `;
    [per] = await sql`
      SELECT p.period_id, p.name FROM periods p
      WHERE p.school_id = ${school.school_id} ORDER BY p.created_at LIMIT 1
    `;
  }

  // Fallback: any class + any period in the DB (prefer ones with enrollments)
  if (!cls || !per) {
    console.log('⚠ Requested school lacks class/period data — falling back to any school with both.');
    const [fallback] = await sql`
      SELECT s.school_id, s.name, s.subdomain
      FROM schools s
      WHERE EXISTS (SELECT 1 FROM classes c WHERE c.school_id = s.school_id)
        AND EXISTS (SELECT 1 FROM periods p WHERE p.school_id = s.school_id)
      LIMIT 1
    `;
    if (!fallback) throw new Error('No school with both classes and periods found');
    school = fallback;
    [cls] = await sql`SELECT class_id, name FROM classes WHERE school_id = ${school.school_id} ORDER BY name LIMIT 1`;
    [per] = await sql`SELECT period_id, name FROM periods WHERE school_id = ${school.school_id} ORDER BY created_at LIMIT 1`;
  }

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM enrollments e
    WHERE e.class_id = ${cls.class_id} AND (e.enrolled_to IS NULL OR e.enrolled_to >= CURRENT_DATE)
  `;

  // ── Find an admin for token ──
  const [admin] = await sql`
    SELECT u.user_id, u.email FROM users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    WHERE u.school_id = ${school.school_id} AND r.role_code = 'ADMIN' AND u.is_active = true
    LIMIT 1
  `;
  if (!admin) throw new Error('No active admin found for school');

  console.log('School :', school.name);
  console.log('Class  :', cls.name, cls.class_id);
  console.log('Period :', per.name, per.period_id);
  console.log('Students enrolled:', count);
  console.log('Admin  :', admin.email, '\n');

  const subdomain = school.subdomain; // actual school subdomain (may differ from SCHOOL_SUBDOMAIN after fallback)

  // ── 2. Generate admin token ──
  const token = jwt.sign(
    {
      userId: admin.user_id,
      schoolId: school.school_id,
      subdomain,
      email: admin.email,
      roles: ['ADMIN'],
      role: 'ADMIN',
      type: 'access',
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // ── 3. POST /api/v1/report-card-jobs ──
  console.log(`POST ${API_BASE}/api/v1/report-card-jobs`);
  const createRes = await fetch(`${API_BASE}/api/v1/report-card-jobs`, {
    method: 'POST',    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-school-subdomain': subdomain,
    },
    body: JSON.stringify({
      classLevelId: cls.class_id,
      periodStructureId: per.period_id,
    }),
  });
  // ── (classLevelId/periodStructureId resolved above) ──

  const createBody = await createRes.json();
  console.log('Status:', createRes.status);
  console.log('Response:', JSON.stringify(createBody, null, 2), '\n');

  if (!createRes.ok) {
    throw new Error(`Create failed: ${createBody.message || createRes.statusText}`);
  }

  const jobId = createBody.data?.jobId;
  if (!jobId) throw new Error('No jobId returned');
  console.log('✅ Job queued with jobId:', jobId, '\n');

  // ── 4. Poll job status ──
  console.log('Polling job status...');
  const maxAttempts = 40; // 40 * 3s = 2 minutes max
  let jobStatus = null;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000));

    const statusRes = await fetch(`${API_BASE}/api/v1/report-card-jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-school-subdomain': subdomain,
      },
    });
    const statusBody = await statusRes.json();
    jobStatus = statusBody.data;

    if (!jobStatus) {
      console.log(`  [${i + 1}] no status yet`);
      continue;
    }

    const pct = jobStatus.total_students > 0
      ? Math.round((jobStatus.completed_students / jobStatus.total_students) * 100)
      : 0;
    console.log(
      `  [${i + 1}] status=${jobStatus.status} progress=${jobStatus.completed_students}/${jobStatus.total_students} (${pct}%) failed=${jobStatus.failed_students}`
    );

    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(jobStatus.status)) break;
  }

  // ── 5. Final report ──
  console.log('\n' + '='.repeat(60));

  // jsonb columns come back as JSON strings from the postgres driver — parse them
  const parseArray = (v) => {
    if (v == null) return [];
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v); } catch { return []; }
  };

  if (jobStatus?.status === 'COMPLETED') {
    console.log(`🎉 JOB COMPLETED — ${jobStatus.completed_students} cards generated, ${jobStatus.failed_students} failed`);
    const results = parseArray(jobStatus.results);
    const success = results.filter(r => r.success).length;
    console.log(`   Success results: ${success}`);
    if (jobStatus.failed_students > 0) {
      console.log('   Errors:', JSON.stringify(parseArray(jobStatus.errors), null, 2));
    }
  } else if (jobStatus?.status === 'FAILED') {
    console.log(`❌ JOB FAILED — ${jobStatus.error_message || 'unknown error'}`);
  } else if (jobStatus?.status === 'CANCELLED') {
    console.log('⏹ JOB CANCELLED');
  } else {
    console.log(`⏳ JOB STILL RUNNING (${jobStatus?.status || 'unknown'})`);
  }
  console.log('='.repeat(60) + '\n');

  await sql.end();
}

main().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});