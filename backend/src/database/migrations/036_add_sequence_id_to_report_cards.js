/**
 * Migration 036 — Add sequence_id to report_cards table.
 *
 * This allows the report card to store the original sequence ID when
 * generated for a specific sequence, so the sequence name can be
 * displayed on the bulletin.
 */
module.exports = async (sql) => {
  console.log('[036] Adding sequence_id to report_cards...');

  await sql`
    ALTER TABLE report_cards
      ADD COLUMN IF NOT EXISTS sequence_id UUID REFERENCES sequences(sequence_id) ON DELETE SET NULL
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_report_cards_sequence_id ON report_cards(sequence_id)
  `;

  console.log('[036] Done — sequence_id column added to report_cards table.');
};
