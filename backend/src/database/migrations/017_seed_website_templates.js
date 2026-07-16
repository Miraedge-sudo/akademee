/**
 * Migration 017: Seed website_templates with bold/playful/premium
 */
module.exports = async (sql) => {
  await sql`
    INSERT INTO website_templates (template_code, name, description)
    VALUES
      ('bold', 'Bold', 'Dark mode, large typography, glassmorphism, scroll animations'),
      ('playful', 'Playful', 'Bright colors, rounded shapes, floating elements, gradient accents'),
      ('premium', 'Premium', 'Serif typography, muted earth tones, elegant transitions')
    ON CONFLICT (template_code) DO NOTHING
  `;
};
