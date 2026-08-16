const { readFileSync } = require("fs");
const path = require("path");
const postgres = require(path.join(__dirname, "..", "backend", "node_modules", "postgres"));

const env = readFileSync(path.join(__dirname, "..", "backend", ".env"), "utf8");
const match = env.match(/^DATABASE_URL=(.+)$/m);
const sql = postgres(match[1].trim(), { prepare: false, ssl: { rejectUnauthorized: false } });

(async () => {
  // Supprimer les créneaux de test (tous ceux nommés Test* ou créés pendant les tests)
  const del = await sql`
    DELETE FROM timetable_periods
    WHERE school_id = 'e4fd54e7-9d78-4620-8e78-1c92e8238197'
      AND academic_year_id = '59942741-bd76-4afe-b288-69dd5710f830'
  `;
  console.log("créneaux de test nettoyés:", del.count);
  process.exit(0);
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
