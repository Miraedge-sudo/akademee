/**
 * Seed 8 Schools with full onboarding, admins, teachers, accountants, and students.
 *
 * - All school emails and admin emails are pre-verified.
 * - onboarding_completed = true for every school.
 * - Each school gets: 1 admin, 4 teachers, 4 accountants, 4 students.
 * - Default password for ALL users: Akademee@2025
 *
 * Run: node scripts/seed-schools.js
 */

require('dotenv').config();
const sql = require('../src/config/database');
const bcrypt = require('bcrypt');
const { generateLoginEmail } = require('../src/utils/emailGenerator');

const DEFAULT_PASSWORD = 'Akademee@2025';
const BCRYPT_ROUNDS = 10;

// ── School definitions ───────────────────────────────────────────────────
const schoolData = [
  {
    name: 'Groupe Scolaire Les Palmiers',
    tagline: "L'excellence pour tous",
    subdomain: 'palmiers',
    phone: '+237 677 123 456',
    address: 'Bastos, BP 1234 Yaoundé',
    city: 'Yaoundé',
    region: 'Centre',
    primaryColor: '#1B4965',
    yearFounded: '1998',
    examType: 'BACC GCE A-Level',
    examPassRate: '92%',
    ranking: 'Top 10',
    rankingCity: 'Yaoundé',
    description: 'Groupe Scolaire Les Palmiers est un établissement d\'excellence offrant une éducation bilingue de la maternelle au secondaire. Notre mission est de former des citoyens responsables et compétents.',
    adminFirstName: 'Jean-Pierre',
    adminLastName: 'Mengue',
    educationalSystems: ['francophone_general', 'anglophone_general'],
  },
  {
    name: 'Collège Bilingue Le Baobab',
    tagline: 'Savoir et Discipline',
    subdomain: 'baobab',
    phone: '+237 699 234 567',
    address: 'Akwa, BP 5678 Douala',
    city: 'Douala',
    region: 'Littoral',
    primaryColor: '#2D6A4F',
    yearFounded: '2005',
    examType: 'BACC GCE O-Level',
    examPassRate: '88%',
    ranking: 'Top 15',
    rankingCity: 'Douala',
    description: 'Le Baobab College offre un enseignement bilingue de qualité, alliant rigueur académique et épanouissement personnel dans un cadre convivial.',
    adminFirstName: 'Esther',
    adminLastName: 'Nkoa',
    educationalSystems: ['francophone_general', 'anglophone_general'],
  },
  {
    name: 'Lycée Technique de Bonanjo',
    tagline: 'Technique et Professionnalisme',
    subdomain: 'bonanjo',
    phone: '+237 677 345 678',
    address: 'Bonanjo, BP 9012 Douala',
    city: 'Douala',
    region: 'Littoral',
    primaryColor: '#9D0208',
    yearFounded: '1990',
    examType: 'BACC Technique',
    examPassRate: '85%',
    ranking: 'Top 20',
    rankingCity: 'Douala',
    description: 'Le Lycée Technique de Bonanjo forme les techniciens et ingénieurs de demain dans les spécialités de l\'électronique, de la mécanique et de la construction.',
    adminFirstName: 'Paul',
    adminLastName: 'Biyong',
    educationalSystems: ['francophone_technical', 'anglophone_technical'],
  },
  {
    name: 'École Privée Les Étoiles',
    tagline: 'Briller par le savoir',
    subdomain: 'etoiles',
    phone: '+237 655 456 789',
    address: 'Bonapriso, BP 3456 Douala',
    city: 'Douala',
    region: 'Littoral',
    primaryColor: '#6A0406',
    yearFounded: '2010',
    examType: 'GCE O-Level',
    examPassRate: '90%',
    ranking: 'Top 5',
    rankingCity: 'Douala',
    description: 'L\'École Privée Les Étoiles brille par son approche pédagogique innovante et son encadrement personnalisé de chaque élève.',
    adminFirstName: 'Marie-Chantal',
    adminLastName: 'Essono',
    educationalSystems: ['francophone_general', 'anglophone_general'],
  },
  {
    name: 'Institut Scolaire Mont Cameroon',
    tagline: 'Education et Valeurs',
    subdomain: 'montcameroon',
    phone: '+237 677 567 890',
    address: 'Buea, BP 7890',
    city: 'Buea',
    region: 'Sud-Ouest',
    primaryColor: '#0353A4',
    yearFounded: '2002',
    examType: 'GCE A-Level',
    examPassRate: '87%',
    ranking: 'Top 10',
    rankingCity: 'Buea',
    description: 'L\'Institut Scolaire Mont Cameroon combine excellence académique et valeurs morales pour former des leaders responsables.',
    adminFirstName: 'Samuel',
    adminLastName: 'Ewolo',
    educationalSystems: ['anglophone_general', 'francophone_general'],
  },
  {
    name: 'Complexe Scolaire La Référence',
    tagline: 'Notre référence, votre avenir',
    subdomain: 'lareference',
    phone: '+237 699 678 901',
    address: 'Nkoulouloun, BP 2345 Yaoundé',
    city: 'Yaoundé',
    region: 'Centre',
    primaryColor: '#5F0F40',
    yearFounded: '2007',
    examType: 'BACC',
    examPassRate: '89%',
    ranking: 'Top 8',
    rankingCity: 'Yaoundé',
    description: 'La Référence est un complexe scolaire d\'excellence qui prépare les élèves aux plus grands défis académiques et professionnels.',
    adminFirstName: 'Albert',
    adminLastName: 'Mvondo',
    educationalSystems: ['francophone_general', 'francophone_technical'],
  },
  {
    name: 'École Internationale de Garoua',
    tagline: 'Excellence et Intégrité',
    subdomain: 'garoua-intl',
    phone: '+237 677 789 012',
    address: 'Quartier Plateau, BP 6789 Garoua',
    city: 'Garoua',
    region: 'Nord',
    primaryColor: '#124559',
    yearFounded: '2012',
    examType: 'BACC',
    examPassRate: '83%',
    ranking: 'Top 3',
    rankingCity: 'Garoua',
    description: 'L\'École Internationale de Garoua offre une éducation de qualité internationale dans la région du Nord, avec un focus sur les sciences et technologies.',
    adminFirstName: 'Brigitte',
    adminLastName: 'Kamga',
    educationalSystems: ['francophone_general', 'anglophone_general'],
  },
  {
    name: 'Collège Privé Les Savanes',
    tagline: 'Apprendre pour réussir',
    subdomain: 'savanes',
    phone: '+237 655 890 123',
    address: 'Dang, BP 0123 Ngaoundéré',
    city: 'Ngaoundéré',
    region: 'Adamaoua',
    primaryColor: '#3C1642',
    yearFounded: '2015',
    examType: 'BACC',
    examPassRate: '80%',
    ranking: 'Top 5',
    rankingCity: 'Ngaoundéré',
    description: 'Le Collège Privé Les Savanes s\'engage à offrir une éducation accessible et de qualité aux élèves de la région de l\'Adamaoua.',
    adminFirstName: 'Daniel',
    adminLastName: 'Tchoumi',
    educationalSystems: ['francophone_general'],
  },
];

// ── Name pools ───────────────────────────────────────────────────────────
const teacherFirstNames = ['Jean', 'Pierre', 'Joseph', 'Thomas', 'Jeanne', 'Sébastien', 'Michel', 'Christine', 'Paul', 'Jacques', 'Martine', 'Sylvie', 'Lucien', 'Hervé', 'Esther', 'Gaston', 'Marie', 'André', 'Claire', 'David', 'Rose', 'Emmanuel', 'Samuel', 'François', 'Alain', 'Louis', 'Charles', 'Henri', 'Roger', 'Marcel', 'Sylvain', 'Brigitte'];
const teacherLastNames = ['Biloa', 'Tchinda', 'Simo', 'Njike', 'Atangana', 'Nkili', 'Owona', 'Fouda', 'Ngono', 'Etoa', 'Zanga', 'Eboué', 'Mbarga', 'Momo', 'Ntsama', 'Bodo', 'Mengue', 'Nkoa', 'Biyong', 'Essono', 'Mvondo', 'Ewolo', 'Mbah', 'Nkengue', 'Nlend', 'Tadjou', 'Mefire', 'Ndjock', 'Yomi', 'Ekanga', 'Molo', 'Song'];
const accountantFirstNames = ['Paul', 'Marie', 'Albert', 'Brigitte', 'Daniel', 'Samuel', 'Rose', 'François', 'Alain', 'Louis', 'Charles', 'Henri', 'Roger', 'Lucien', 'Marcel', 'David', 'Emmanuel', 'Samuel', 'André', 'Claire', 'Jean', 'Pierre', 'Joseph', 'Thomas', 'Jeanne', 'Sébastien', 'Michel', 'Christine', 'Paul', 'Jacques', 'Martine', 'Sylvie'];
const accountantLastNames = ['Biyong', 'Essono', 'Mvondo', 'Kamga', 'Tchoumi', 'Ewolo', 'Nkoa', 'Mvondo', 'Ewolo', 'Mbah', 'Nkengue', 'Nlend', 'Tadjou', 'Mefire', 'Ndjock', 'Mengue', 'Biyong', 'Essono', 'Fouda', 'Eyenga', 'Biloa', 'Tchinda', 'Simo', 'Njike', 'Atangana', 'Nkili', 'Owona', 'Fouda', 'Ngono', 'Etoa', 'Zanga', 'Eboué'];
const studentFirstNames = ['Jean', 'Marie', 'Pierre', 'Rose', 'Paul', 'Anne', 'Jacques', 'Claire', 'Michel', 'Louise', 'Thomas', 'Françoise', 'Joseph', 'Pauline', 'David', 'Thérèse', 'Emmanuel', 'Bernadette', 'Samuel', 'Cécile', 'André', 'Denise', 'François', 'Élisabeth', 'Alain', 'Geneviève', 'Louis', 'Henriette', 'Charles', 'Irène', 'Henri', 'Jacqueline'];
const studentLastNames = ['Ngo', 'Biloa', 'Tchinda', 'Simo', 'Njike', 'Atangana', 'Nkili', 'Eyenga', 'Owona', 'Fouda', 'Ngono', 'Etoa', 'Zanga', 'Eboué', 'Mbarga', 'Momo', 'Ntsama', 'Bodo', 'Mengue', 'Nkoa', 'Biyong', 'Essono', 'Mvondo', 'Ewolo', 'Mbah', 'Nkengue', 'Nlend', 'Tadjou', 'Mefire', 'Ndjock', 'Yomi', 'Ekanga'];
const guardianFirstNames = ['Robert', 'Thérèse', 'Georges', 'Adèle', 'Léon', 'Marguerite', 'Félix', 'Bernadette', 'Norbert', 'Julienne', 'Augustin', 'Philomène', 'Lambert', 'Sylvie', 'Cyprien', 'Georgette'];
const guardianLastNames = ['Mballa', 'Ngo', 'Atangana', 'Biloa', 'Tchinda', 'Simo', 'Njike', 'Eyenga', 'Owona', 'Fouda', 'Ngono', 'Etoa', 'Zanga', 'Eboué', 'Mbarga', 'Momo'];
const classLabels = ['6ème A', '5ème B', '4ème A', '3ème C', '2nde A', '1ère D', 'Terminale C', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5'];
const genders = ['male', 'female'];
const relationships = ['father', 'mother', 'guardian', 'other'];

// ── Helpers ──────────────────────────────────────────────────────────────
function pickName(pool, offset) {
  return pool[offset % pool.length];
}

function emailFor(subdomain, rolePrefix, index) {
  if (!rolePrefix) return `admin@${subdomain}.cm`;
  return `${rolePrefix}${index}@${subdomain}.cm`;
}

function randomDob() {
  const year = 2005 + Math.floor(Math.random() * 8);
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ── Collect credentials for final output ─────────────────────────────────
const credentials = [];

// ── Main seed function ───────────────────────────────────────────────────
async function runSeed() {
  console.log('\n============================================================');
  console.log('SEEDING 8 SCHOOLS WITH USERS, STUDENTS, AND ONBOARDING');
  console.log('============================================================\n');

  // Ensure roles exist
  const roleCodes = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STUDENT', 'GUARDIAN', 'STAFF'];
  const roleMap = {};
  for (const code of roleCodes) {
    const existing = await sql`SELECT role_id FROM roles WHERE role_code = ${code}`;
    if (existing.length === 0) {
      await sql`INSERT INTO roles (role_name, role_code) VALUES (${code}, ${code})`;
      console.log(`  ✅ Created role: ${code}`);
    }
    const row = await sql`SELECT role_id FROM roles WHERE role_code = ${code}`;
    roleMap[code] = row[0].role_id;
  }
  console.log('✅ All roles ready\n');

  // Get a template
  const templates = await sql`SELECT template_id, template_code FROM website_templates LIMIT 1`;
  const templateId = templates.length > 0 ? templates[0].template_id : null;

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  let schoolCounter = 0;

  for (const sch of schoolData) {
    schoolCounter++;
    console.log(`\n[${schoolCounter}/${schoolData.length}] Seeding: ${sch.name}`);

    // Check if school already exists
    const existingSchool = await sql`SELECT school_id FROM schools WHERE subdomain = ${sch.subdomain}`;
    if (existingSchool.length > 0) {
      console.log(`  ⏭️  School already exists (subdomain: ${sch.subdomain}), skipping...`);
      continue;
    }

    const schoolEmail = `contact@${sch.subdomain}.cm`;
    const adminEmail = `admin@${sch.subdomain}.cm`;

    await sql.begin(async (tx) => {
      // ── Insert school ──────────────────────────────────────────────────
      const schoolRows = await tx`
        INSERT INTO schools (
          name, email, phone, address, city, region, subdomain, tagline,
          website_template_id, subscription_plan, subscription_status, is_active,
          email_verified, require_email_verification, onboarding_completed, website_published,
          primary_color, year_founded, website_description, website_stats, website_values,
          educational_systems, exam_type, exam_pass_rate, ranking, ranking_city,
          about_photos, classes_config, created_at
        )
        VALUES (
          ${sch.name}, ${schoolEmail}, ${sch.phone}, ${sch.address}, ${sch.city}, ${sch.region},
          ${sch.subdomain}, ${sch.tagline},
          ${templateId}, 'premium', 'active', true,
          true, false, true, true,
          ${sch.primaryColor}, ${sch.yearFounded}, ${sch.description},
          ${sql.json({ students: 450, teachers: 32, classes: 18 })},
          ${sql.json(['Excellence', 'Intégrité', 'Discipline', 'Innovation'])},
          ${sql.json(sch.educationalSystems || ['francophone_general'])},
          ${sch.examType}, ${sch.examPassRate}, ${sch.ranking}, ${sch.rankingCity},
          ${sql.json([])}, ${sql.json({})}, NOW()
        )
        RETURNING school_id, name, subdomain
      `;
      const school = schoolRows[0];
      console.log(`  ✅ Created school: ${school.name} (${school.subdomain})`);

      // ── Insert admin user ──────────────────────────────────────────────
      const adminRows = await tx`
        INSERT INTO users (
          school_id, first_name, last_name, email, login_email, password_hash,
          phone, is_active, email_verified, require_email_verification, created_at
        )
        VALUES (
          ${school.school_id}, ${sch.adminFirstName}, ${sch.adminLastName},
          ${adminEmail}, ${adminEmail}, ${passwordHash},
          ${sch.phone}, true, true, false, NOW()
        )
        RETURNING user_id, email, login_email
      `;
      const admin = adminRows[0];
      await tx`INSERT INTO user_roles (user_id, role_id) VALUES (${admin.user_id}, ${roleMap['ADMIN']})`;
      console.log(`  ✅ Admin: ${sch.adminFirstName} ${sch.adminLastName} (${admin.login_email})`);
      credentials.push({
        school: sch.name,
        subdomain: sch.subdomain,
        role: 'ADMIN',
        name: `${sch.adminFirstName} ${sch.adminLastName}`,
        loginEmail: admin.login_email,
        password: DEFAULT_PASSWORD,
      });

      // ── Insert 4 teachers ──────────────────────────────────────────────
      for (let i = 0; i < 4; i++) {
        const fn = pickName(teacherFirstNames, (schoolCounter - 1) * 4 + i);
        const ln = pickName(teacherLastNames, (schoolCounter - 1) * 4 + i);
        const email = emailFor(sch.subdomain, 'teacher', i + 1);
        const loginEmail = generateLoginEmail(email, 'TEACHER');

        const userRows = await tx`
          INSERT INTO users (
            school_id, first_name, last_name, email, login_email, password_hash,
            is_active, email_verified, require_email_verification, created_at
          )
          VALUES (
            ${school.school_id}, ${fn}, ${ln}, ${email}, ${loginEmail}, ${passwordHash},
            true, true, false, NOW()
          )
          RETURNING user_id, login_email
        `;
        const user = userRows[0];
        await tx`INSERT INTO user_roles (user_id, role_id) VALUES (${user.user_id}, ${roleMap['TEACHER']})`;
        console.log(`  ✅ Teacher: ${fn} ${ln} (${user.login_email})`);
        credentials.push({
          school: sch.name,
          subdomain: sch.subdomain,
          role: 'TEACHER',
          name: `${fn} ${ln}`,
          loginEmail: user.login_email,
          password: DEFAULT_PASSWORD,
        });
      }

      // ── Insert 4 accountants ───────────────────────────────────────────
      for (let i = 0; i < 4; i++) {
        const fn = pickName(accountantFirstNames, (schoolCounter - 1) * 4 + i);
        const ln = pickName(accountantLastNames, (schoolCounter - 1) * 4 + i);
        const email = emailFor(sch.subdomain, 'accountant', i + 1);
        const loginEmail = generateLoginEmail(email, 'ACCOUNTANT');

        const userRows = await tx`
          INSERT INTO users (
            school_id, first_name, last_name, email, login_email, password_hash,
            is_active, email_verified, require_email_verification, created_at
          )
          VALUES (
            ${school.school_id}, ${fn}, ${ln}, ${email}, ${loginEmail}, ${passwordHash},
            true, true, false, NOW()
          )
          RETURNING user_id, login_email
        `;
        const user = userRows[0];
        await tx`INSERT INTO user_roles (user_id, role_id) VALUES (${user.user_id}, ${roleMap['ACCOUNTANT']})`;
        console.log(`  ✅ Accountant: ${fn} ${ln} (${user.login_email})`);
        credentials.push({
          school: sch.name,
          subdomain: sch.subdomain,
          role: 'ACCOUNTANT',
          name: `${fn} ${ln}`,
          loginEmail: user.login_email,
          password: DEFAULT_PASSWORD,
        });
      }

      // ── Insert 4 students ──────────────────────────────────────────────
      for (let i = 0; i < 4; i++) {
        const fn = pickName(studentFirstNames, (schoolCounter - 1) * 4 + i);
        const ln = pickName(studentLastNames, (schoolCounter - 1) * 4 + i);
        const email = emailFor(sch.subdomain, 'student', i + 1);
        const loginEmail = generateLoginEmail(email, 'STUDENT');
        const gender = genders[(schoolCounter - 1) * 4 + i] % 2 === 0 ? 'male' : 'female';
        const dob = randomDob();
        const studentNum = `ST-${sch.subdomain.toUpperCase().replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`;
        const regNum = `REG-${sch.subdomain.toUpperCase().replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`;
        const classLabel = classLabels[(schoolCounter - 1) * 4 + i] % classLabels.length;

        const userRows = await tx`
          INSERT INTO users (
            school_id, first_name, last_name, email, login_email, password_hash,
            is_active, email_verified, require_email_verification, gender, date_of_birth, created_at
          )
          VALUES (
            ${school.school_id}, ${fn}, ${ln}, ${email}, ${loginEmail}, ${passwordHash},
            true, true, false, ${gender}, ${dob}, NOW()
          )
          RETURNING user_id, login_email
        `;
        const user = userRows[0];
        await tx`INSERT INTO user_roles (user_id, role_id) VALUES (${user.user_id}, ${roleMap['STUDENT']})`;

        // Insert student record
        await tx`
          INSERT INTO students (
            school_id, user_id, student_number, registration_number,
            date_of_birth, gender, status, class_label, fee_status, created_at
          )
          VALUES (
            ${school.school_id}, ${user.user_id}, ${studentNum}, ${regNum},
            ${dob}, ${gender}::gender_enum, 'active', ${classLabel}, 'pending', NOW()
          )
        `;

        // Insert a guardian for this student
        const gfn = pickName(guardianFirstNames, (schoolCounter - 1) * 4 + i);
        const gln = pickName(guardianLastNames, (schoolCounter - 1) * 4 + i);
        const guardianName = `${gfn} ${gln}`;
        const guardianPhone = `+237 6${String(50 + schoolCounter)} ${String(100 + i)} ${String(200 + i * 10)}`;
        const rel = relationships[i % relationships.length];

        // Get the student_id we just inserted
        const studentRows = await tx`
          SELECT student_id FROM students WHERE user_id = ${user.user_id}
        `;
        if (studentRows.length > 0) {
          await tx`
            INSERT INTO guardians (
              school_id, student_id, name, relationship, phone, email
            )
            VALUES (
              ${school.school_id}, ${studentRows[0].student_id}, ${guardianName},
              ${rel}::relationship_enum, ${guardianPhone}, ${email}
            )
          `;
        }

        console.log(`  ✅ Student: ${fn} ${ln} (${user.login_email}) — ${classLabel}`);
        credentials.push({
          school: sch.name,
          subdomain: sch.subdomain,
          role: 'STUDENT',
          name: `${fn} ${ln}`,
          loginEmail: user.login_email,
          password: DEFAULT_PASSWORD,
        });
      }

      console.log(`  📋 School complete: 1 admin, 4 teachers, 4 accountants, 4 students`);
    });
  }

  // ── Print credentials table ─────────────────────────────────────────────
  console.log('\n\n============================================================');
  console.log('LOGIN CREDENTIALS — ALL USERS');
  console.log('============================================================\n');

  // Group by school
  const bySchool = {};
  for (const c of credentials) {
    if (!bySchool[c.school]) bySchool[c.school] = [];
    bySchool[c.school].push(c);
  }

  for (const [schoolName, users] of Object.entries(bySchool)) {
    console.log(`\n--- ${schoolName} ---`);
    console.log('| Role       | Name                    | Login Email                              | Password         |');
    console.log('|------------|-------------------------|------------------------------------------|------------------|');
    for (const u of users) {
      console.log(`| ${u.role.padEnd(10)} | ${u.name.padEnd(23)} | ${u.loginEmail.padEnd(40)} | ${u.password.padEnd(16)} |`);
    }
  }

  console.log(`\n\nTotal users created: ${credentials.length}`);
  console.log(`  - 8 Admins`);
  console.log(`  - 32 Teachers (4 per school)`);
  console.log(`  - 32 Accountants (4 per school)`);
  console.log(`  - 32 Students (4 per school)`);
  console.log(`\nDefault password for ALL accounts: ${DEFAULT_PASSWORD}`);
  console.log('\n============================================================');
  console.log('✨ Seed completed successfully!');
  console.log('============================================================\n');

  process.exit(0);
}

runSeed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
