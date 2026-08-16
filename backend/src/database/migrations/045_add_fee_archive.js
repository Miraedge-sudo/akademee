/**
 * MIGRATION 045: Ajoute une colonne is_archived à la table fees.
 *
 * Un frais payé par des élèves ne peut pas être supprimé (on ne détruit
 * jamais l'historique des paiements) — l'admin l'archive à la place pour
 * qu'il ne réapparaisse plus dans les listes. L'historique (student_fees,
 * payments) reste intact et visible côté élève.
 * Run: node scripts/migrate.js 045
 */

module.exports = async (sql) => {
  await sql`
    ALTER TABLE fees ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
  `;
  console.log('✅ Added is_archived column to fees table');

  await sql`CREATE INDEX IF NOT EXISTS idx_fees_is_archived ON fees(is_archived)`;
  console.log('✅ Created index on fees(is_archived)');
};

exports.down = async (sql) => {
  await sql`ALTER TABLE fees DROP COLUMN IF EXISTS is_archived`;
  console.log('✅ Dropped is_archived column from fees table');
};
