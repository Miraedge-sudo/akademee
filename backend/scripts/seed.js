/**
 * Seed Database - Roles and Website Templates
 * This script populates the database with essential system data
 */

require('dotenv').config();

const sql = require('../src/config/database');

async function seedRoles() {
  console.log('👥 Seeding roles...');

  const roles = [
    {
      role_name: 'SUPER_ADMIN',
      role_code: 'SUPER_ADMIN',
    },
    {
      role_name: 'ADMIN',
      role_code: 'ADMIN',
    },
    {
      role_name: 'TEACHER',
      role_code: 'TEACHER',
    },
    {
      role_name: 'ACCOUNTANT',
      role_code: 'ACCOUNTANT',
    },
    {
      role_name: 'STUDENT',
      role_code: 'STUDENT',
    },
    {
      role_name: 'GUARDIAN',
      role_code: 'GUARDIAN',
    },
    {
      role_name: 'STAFF',
      role_code: 'STAFF',
    },
  ];

  try {
    for (const role of roles) {
      const existing = await sql`
        SELECT role_id FROM roles WHERE role_code = ${role.role_code}
      `;

      if (existing.length === 0) {
        await sql`
          INSERT INTO roles (role_name, role_code)
          VALUES (${role.role_name}, ${role.role_code})
        `;
        console.log(`  ✅ Created role: ${role.role_name}`);
      } else {
        console.log(`  ⏭️  Role already exists: ${role.role_name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
}

async function seedTemplates() {
  console.log('🎨 Seeding website templates...');

  const templates = [
    {
      template_code: 'modern',
      name: 'Modern',
      description: 'Modern, clean design with vibrant colors and smooth animations',
      preview_url: '/templates/modern-preview.jpg',
    },
    {
      template_code: 'classic',
      name: 'Classic',
      description: 'Traditional, professional design emphasizing trust and stability',
      preview_url: '/templates/classic-preview.jpg',
    },
    {
      template_code: 'minimal',
      name: 'Minimal',
      description: 'Editorial typography with clean, premium layout',
      preview_url: '/templates/minimal-preview.jpg',
    },
  ];

  try {
    for (const template of templates) {
      const existing = await sql`
        SELECT template_id FROM website_templates WHERE template_code = ${template.template_code}
      `;

      if (existing.length === 0) {
        await sql`
          INSERT INTO website_templates (
            template_code, name, description, preview_url, created_at
          ) VALUES (
            ${template.template_code}, ${template.name}, ${template.description},
            ${template.preview_url}, NOW()
          )
        `;
        console.log(`  ✅ Created template: ${template.name}`);
      } else {
        console.log(`  ⏭️  Template already exists: ${template.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  }
}

async function runSeeds() {
  try {
    console.log('\n============================================================');
    console.log('SEEDING DATABASE — Roles & Templates');
    console.log('============================================================\n');

    await seedRoles();
    await seedTemplates();

    console.log('\n============================================================');
    console.log('✨ All seeds completed successfully!');
    console.log('============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runSeeds();
}

module.exports = { seedRoles, seedTemplates };
