/**
 * MIGRATION 046: Ajoute une colonne message_en à la table notifications.
 *
 * Les notifications sont envoyées en français uniquement (message), ce qui fait
 * qu'un utilisateur qui bascule l'interface en anglais continue de voir les
 * anciennes notifications en français. Cette colonne stocke la version anglaise
 * du message afin que l'interface puisse afficher la langue de l'utilisateur.
 * Run: node scripts/migrate.js 046
 */

module.exports = async (sql) => {
  await sql`
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message_en TEXT;
  `;
  console.log('✅ Added message_en column to notifications table');
};

exports.down = async (sql) => {
  await sql`ALTER TABLE notifications DROP COLUMN IF EXISTS message_en`;
  console.log('✅ Dropped message_en column from notifications table');
};
