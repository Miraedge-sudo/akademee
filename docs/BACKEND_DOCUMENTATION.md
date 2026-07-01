# Akademee Backend - Documentation Complète

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Base de données](#base-de-données)
5. [API Endpoints](#api-endpoints)
6. [Authentification & Autorisation](#authentification--autorisation)
7. [Services](#services)
8. [Middleware](#middleware)
9. [Sécurité](#sécurité)
10. [Déploiement](#déploiement)

---

## Vue d'ensemble

Akademee Backend est un système de gestion scolaire complet construit avec **Node.js**, **Express.js**, et **PostgreSQL (Supabase)**. Le système supporte une architecture multi-tenant permettant à plusieurs écoles d'utiliser la même instance avec isolation complète des données.

### Stack Technique

- **Runtime**: Node.js v14+
- **Framework**: Express.js v4.18.2
- **Base de données**: PostgreSQL via Supabase
- **ORM**: Driver `postgres` (requêtes SQL directes)
- **Authentification**: JWT (JSON Web Tokens)
- **Upload de fichiers**: Cloudinary
- **Validation**: express-validator
- **Email**: Nodemailer

### Fonctionnalités Principales

- ✅ Gestion multi-tenant (sous-domaines)
- ✅ Authentification JWT avec RBAC
- ✅ Gestion des écoles et utilisateurs
- ✅ Gestion des étudiants et tuteurs
- ✅ Structure académique (années, classes, matières)
- ✅ Système de notes et bulletins
- ✅ Suivi des présences
- ✅ Module financier (frais, paiements)
- ✅ Notifications
- ✅ Processus d'onboarding
- ✅ Gestion des sites web écoles

---

## Architecture

### Structure du Projet

```
backend/
├── src/
│   ├── app.js                      # Configuration Express
│   ├── server.js                   # Point d'entrée serveur
│   │
│   ├── config/                     # Fichiers de configuration
│   │   ├── database.js            # Connexion PostgreSQL
│   │   ├── cloudinary.js          # Configuration Cloudinary
│   │   ├── multer.js              # Configuration upload fichiers
│   │   ├── jwt.js                 # Configuration JWT
│   │   ├── cors.js                # Configuration CORS
│   │   ├── domains.js             # Configuration domaines multi-tenant
│   │   └── email.js               # Configuration email
│   │
│   ├── database/                   # Base de données
│   │   ├── migrations/            # Scripts de migration
│   │   ├── functions/             # Procédures stockées PostgreSQL
│   │   └── seeds/                 # Données initiales
│   │
│   ├── middleware/                 # Middleware Express
│   │   ├── auth.middleware.js     # Vérification JWT
│   │   ├── role.middleware.js     # Vérification RBAC
│   │   ├── schoolResolver.middleware.js  # Résolution sous-domaine
│   │   ├── tenant.middleware.js   # Attachement school_id
│   │   ├── upload.middleware.js   # Gestion uploads
│   │   ├── validate.middleware.js # Validation requêtes
│   │   └── error.middleware.js    # Gestionnaire d'erreurs global
│   │
│   ├── controllers/                # Contrôleurs API
│   │   ├── auth.controller.js     # Authentification
│   │   ├── school.controller.js   # Gestion écoles
│   │   ├── student.controller.js  # Gestion étudiants
│   │   ├── user.controller.js     # Gestion utilisateurs
│   │   ├── grade.controller.js    # Système de notes
│   │   ├── class.controller.js    # Gestion classes
│   │   ├── subject.controller.js  # Gestion matières
│   │   ├── academicYear.controller.js  # Années académiques
│   │   ├── attendance.controller.js    # Présences
│   │   ├── guardian.controller.js      # Tuteurs
│   │   ├── payment.controller.js       # Paiements
│   │   ├── fee.controller.js           # Frais
│   │   ├── notification.controller.js  # Notifications
│   │   ├── report.controller.js        # Rapports
│   │   ├── onboarding.controller.js   # Intégration
│   │   └── website.controller.js      # Sites web écoles
│   │
│   ├── routes/                     # Définitions routes API
│   │   ├── auth.routes.js
│   │   ├── school.routes.js
│   │   ├── student.routes.js
│   │   ├── user.routes.js
│   │   ├── grade.routes.js
│   │   ├── class.routes.js
│   │   ├── subject.routes.js
│   │   ├── academic.routes.js
│   │   ├── attendance.routes.js
│   │   ├── guardian.routes.js
│   │   ├── payment.routes.js
│   │   ├── finance.routes.js
│   │   ├── notification.routes.js
│   │   ├── report.routes.js
│   │   ├── website.routes.js
│   │   └── config.routes.js
│   │
│   ├── validators/                 # Schémas de validation
│   │   ├── auth.validator.js
│   │   ├── school.validator.js
│   │   ├── student.validator.js
│   │   ├── grade.validator.js
│   │   ├── guardian.validator.js
│   │   ├── payment.validator.js
│   │   └── onboarding.validator.js
│   │
│   ├── services/                   # Logique métier
│   │   ├── auth.service.js        # Logique authentification
│   │   ├── school.service.js      # Logique écoles
│   │   ├── student.service.js     # Logique étudiants
│   │   ├── guardian.service.js    # Logique tuteurs
│   │   ├── onboarding.service.js  # Logique intégration
│   │   ├── email.service.js       # Service email
│   │   ├── media.service.js       # Service médias
│   │   └── website.service.js     # Service sites web
│   │
│   ├── utils/                      # Utilitaires
│   │   ├── response.js            # Format de réponse standardisé
│   │   ├── constants.js           # Constantes application
│   │   ├── domainHelper.js        # Utilitaires domaines
│   │   └── slugGenerator.js       # Génération slugs URL
│   │
│   └── uploads/                    # Stockage temporaire fichiers
│
├── scripts/                        # Scripts utilitaires
│   ├── migrate.js                 # Exécution migrations
│   ├── seed.js                    # Peuplement base de données
│   └── testConnection.js          # Test connexion base
│
├── package.json                    # Dépendances Node.js
├── .env.example                    # Template variables environnement
├── .gitignore
└── README.md
```

---

## Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine du dossier backend :

```env
# Base de données
DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_SSL=true

# Serveur
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRES_IN=7d

# URLs Frontend
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_PRODUCTION=https://akademee.cm
FRONTEND_PORT=3000
API_BASE_URL=http://localhost:5000

# Cloudinary (upload fichiers)
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Multi-tenant domaines
TENANT_DEV_DOMAIN=lvh.me
TENANT_PROD_DOMAIN=akademee.cm

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@akademee.cm
```

### Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Lance le serveur de production |
| `npm run dev` | Lance le serveur de développement (nodemon) |
| `npm run migrate` | Exécute les migrations de base de données |
| `npm run seed` | Peuple la base de données avec données initiales |
| `npm test` | Exécute la suite de tests |
| `npm run lint` | Vérifie le style de code avec ESLint |
| `npm run lint:fix` | Corrige les problèmes de style |

---

## Base de données

### Schéma de la Base de Données

Le système utilise PostgreSQL avec une structure relationnelle complète.

#### Types ENUM

```sql
academic_system_enum: TERM_SEQUENCE, SEMESTER_CA_EXAM
subscription_plan_enum: free, basic, premium, enterprise
subscription_status_enum: active, trial, suspended, expired
gender_enum: male, female, other
student_status_enum: active, inactive, graduated, transferred, suspended
enrollment_type_enum: new, transfer, repeating
academic_year_status_enum: planned, active, completed, archived
period_type_enum: term, semester, sequence, ca, exam
education_level_enum: nursery, primary, secondary, high_school, university, vocational
relationship_enum: father, mother, guardian, other
fee_payment_status_enum: pending, partial, paid, overdue
payment_method_enum: cash, bank_transfer, mobile_money, cheque, card
payment_status_enum: pending, completed, failed, refunded
attendance_status_enum: present, absent, late, excused
notification_type_enum: grade, attendance, payment, discipline, system, announcement
```

#### Tables Principales

**schools** - Écoles (table principale multi-tenant)
- `school_id` (UUID, PK)
- `name`, `tagline`, `subdomain`
- `email`, `phone`, `address`, `city`, `region`
- `logo_url`, `hero_image_url`, `primary_color`
- `website_description`, `year_founded`, `website_stats` (JSONB), `website_values` (JSONB)
- `educational_systems` (JSONB) - systèmes éducatifs sélectionnés
- `email_verified`, `verification_token`, `verification_token_expires_at`
- `onboarding_completed`, `website_published`
- `academic_system`, `subscription_plan`, `subscription_status`
- `is_active`, `created_at`, `updated_at`

**users** - Utilisateurs
- `user_id` (UUID, PK)
- `school_id` (FK vers schools)
- `first_name`, `last_name`, `email`, `password_hash`
- `phone`, `avatar_url`
- `is_active`, `last_login`

**roles** - Rôles système
- `role_id` (SERIAL, PK)
- `role_name`, `role_code`

**user_roles** - Association utilisateurs-rôles
- `user_role_id` (SERIAL, PK)
- `user_id` (FK vers users)
- `role_id` (FK vers roles)

**students** - Étudiants
- `student_id` (UUID, PK)
- `school_id` (FK vers schools)
- `user_id` (FK vers users)
- `student_number`, `registration_number`
- `date_of_birth`, `gender`
- `status`, `photo_url`

**guardians** - Tuteurs
- `guardian_id` (UUID, PK)
- `school_id` (FK vers schools)
- `student_id` (FK vers students)
- `name`, `relationship`, `phone`, `email`

**academic_years** - Années académiques
- `academic_year_id` (UUID, PK)
- `school_id` (FK vers schools)
- `name`, `start_date`, `end_date`
- `is_current`

**classes** - Classes
- `class_id` (UUID, PK)
- `school_id` (FK vers schools)
- `name`, `academic_year_id` (FK)
- `capacity`

**subjects** - Matières
- `subject_id` (UUID, PK)
- `school_id` (FK vers schools)
- `name`, `coefficient`

**enrollments** - Inscriptions
- `enrollment_id` (UUID, PK)
- `school_id` (FK vers schools)
- `student_id`, `class_id`, `academic_year_id`
- `status`

**grades** - Notes
- `grade_id` (UUID, PK)
- `school_id` (FK vers schools)
- `student_id`, `subject_id`, `class_id`
- `score`, `period`, `academic_year_id`

**attendance** - Présences
- `attendance_id` (UUID, PK)
- `school_id` (FK vers schools)
- `student_id`, `class_id`, `date`
- `status`

**fees** - Frais
- `fee_id` (UUID, PK)
- `school_id` (FK vers schools)
- `name`, `amount`

**payments** - Paiements
- `payment_id` (UUID, PK)
- `school_id` (FK vers schools)
- `student_id`, `amount`, `method`
- `status`, `receipt_number`

**notifications** - Notifications
- `notification_id` (UUID, PK)
- `school_id` (FK vers schools)
- `user_id`, `type`, `message`
- `is_read`, `created_at`

### Migrations

Les migrations sont exécutées séquentiellement :

```bash
# Exécuter toutes les migrations
npm run migrate

# Réinitialiser la base de données (attention!)
npm run migrate reset
```

#### Ordre des Migrations

1. `001_create_enums.js` - Création des types ENUM
2. `002_create_core_tables.js` - Tables principales (schools, school_media)
3. `003_create_user_system.js` - Système utilisateurs (users, roles, user_roles)
4. `004_create_students_module.js` - Module étudiants (students, guardians)
5. `005_create_academic_structure.js` - Structure académique (academic_years, classes, subjects, enrollments)
6. `006_create_finance_module.js` - Module financier (fees, payments)
7. `007_create_attachments_attendance_notifications.js` - Attachements, présences, notifications
8. `008_onboarding_verification_students.js` - Intégration et vérification
9. `009_unique_emails.js` - Contraintes d'unicité
10. `010_add_educational_systems.js` - Systèmes éducatifs

---

## API Endpoints

### Format de Réponse

**Succès**
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": { /* données */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Erreur**
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "Message d'erreur détaillé",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Authentification

#### POST `/api/auth/login`
Connexion utilisateur

**Headers**
```
Content-Type: application/json
```

**Body**
```json
{
  "subdomain": "ecole-example",
  "email": "user@example.com",
  "password": "password123"
}
```

**Rate Limiting**: 20 requêtes par fenêtre de 15 minutes

**Response** `200`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "...",
      "email": "...",
      "firstName": "...",
      "lastName": "...",
      "schoolId": "...",
      "subdomain": "ecole-example",
      "schoolName": "École Example",
      "roles": ["ADMIN"]
    },
    "urls": { ... }
  }
}
```

#### POST `/api/auth/verify-school`
Vérification existence école (publique)

**Body**
```json
{
  "subdomain": "ecole-example"
}
```

**Response** `200`
```json
{
  "success": true,
  "message": "École vérifiée",
  "data": {
    "exists": true,
    "school": { "name": "...", "subdomain": "..." }
  }
}
```

#### POST `/api/auth/logout`
Déconnexion (protégée)

**Headers**
```
Authorization: Bearer <token>
```

#### GET `/api/auth/me`
Récupérer utilisateur actuel (protégée)

**Headers**
```
Authorization: Bearer <token>
```

**Response** `200`
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "schoolId": "...",
    "roles": ["ADMIN"],
    "school": {
      "school_id": "...",
      "name": "...",
      "subdomain": "...",
      "email_verified": true,
      "onboarding_completed": false
    },
    "schoolName": "...",
    "subdomain": "...",
    "emailVerified": true,
    "onboardingCompleted": false
  }
}
```

**Note**: Les endpoints `/register`, `/refresh-token`, et `/verify-email` sont actuellement commentés dans le code. L'inscription se fait via `/api/schools/register`.

### Écoles

#### POST `/api/schools/register`
Inscription complète d'une école (publique)

**Body**
```json
{
  "schoolName": "École Example",
  "subdomain": "ecole-example",
  "city": "Douala",
  "region": "Littoral",
  "email": "contact@ecole-example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "adminEmail": "admin@ecole-example.com",
  "phone": "+237 123 456 789",
  "password": "password123",
  "confirmPassword": "password123",
  "planId": "basic",
  "templateCode": "modern"
}
```

**Validation**
- `schoolName`: requis, max 200 caractères
- `subdomain`: requis, 3-63 caractères, lettres minuscules, nombres, tirets
- `city`: requis
- `region`: optionnel
- `email`: requis, email valide
- `firstName`: requis
- `lastName`: requis
- `adminEmail`: requis, email valide
- `phone`: optionnel
- `password`: requis, min 8 caractères
- `confirmPassword`: requis, doit correspondre à password
- `planId`: requis, doit être 'free', 'basic', ou 'premium'
- `templateCode`: optionnel, doit être 'modern', 'classic', ou 'minimal'

**Response** `201`
```json
{
  "success": true,
  "message": "School registered successfully",
  "data": {
    "school": { "schoolId": "...", "schoolName": "...", "subdomain": "..." },
    "schoolId": "...",
    "schoolName": "...",
    "subdomain": "...",
    "templateCode": "modern",
    "campusUrl": "http://example.lvh.me:3000",
    "dashboardUrl": "http://example.lvh.me:3000/dashboard",
    "websiteUrl": "http://example.lvh.me:3000/site",
    "onboardingUrl": "http://example.lvh.me:3000/onboarding",
    "loginUrl": "http://example.lvh.me:3000/login",
    "domainSuffix": ".lvh.me:3000",
    "adminEmail": "admin@example.com",
    "adminName": "Jean Dupont",
    "planId": "basic",
    "emailVerified": true,
    "token": "jwt_token_here",
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "schoolId": "...",
      "subdomain": "example",
      "schoolName": "École Example",
      "roles": ["ADMIN"]
    },
    "urls": { ... }
  }
}
```

#### POST `/api/schools/check-subdomain`
Vérifier disponibilité sous-domaine (publique)

**Body**
```json
{
  "subdomain": "ecole-example"
}
```

**Response** `200`
```json
{
  "success": true,
  "message": "Disponibilité vérifiée",
  "data": {
    "available": true,
    "subdomain": "ecole-example"
  }
}
```

#### GET `/api/schools/plans`
Lister les plans d'abonnement (publique)

**Response** `200`
```json
{
  "success": true,
  "message": "Plans récupérés",
  "data": [
    {
      "id": "free",
      "name": "Free",
      "description": "Up to 50 students · Grades, attendance, basic reports",
      "price": 0,
      "currency": "FCFA",
      "features": ["Up to 50 students", "Grades & attendance", "Basic reports"]
    },
    {
      "id": "basic",
      "name": "Basic",
      "description": "Up to 300 students · Full grades, PDF bulletins, finance module",
      "price": 15000,
      "currency": "FCFA",
      "features": ["Up to 300 students", "Full grades", "PDF bulletins", "Finance module"]
    },
    {
      "id": "premium",
      "name": "Premium",
      "description": "Unlimited students · All features + priority support + custom branding",
      "price": 35000,
      "currency": "FCFA",
      "features": ["Unlimited students", "All features", "Priority support", "Custom branding"]
    }
  ]
}
```

#### GET `/api/schools/templates`
Lister les templates de sites web (publique)

#### GET `/api/schools/verify-email`
Vérification email via token (publique)

**Query Parameters**
- `token` (requis): token de vérification envoyé par email

#### GET `/api/schools/onboarding`
Récupérer données onboarding (protégée, admin uniquement)

**Headers**
```
Authorization: Bearer <token>
```

**Response** `200`
```json
{
  "success": true,
  "message": "Onboarding data retrieved",
  "data": {
    "schoolId": "...",
    "schoolName": "...",
    "tagline": "...",
    "subdomain": "...",
    "email": "...",
    "phone": "...",
    "address": "...",
    "city": "...",
    "region": "...",
    "logoUrl": "...",
    "heroImageUrl": "...",
    "primaryColor": "#085041",
    "websiteDescription": "...",
    "yearFounded": "...",
    "websiteStats": {},
    "websiteValues": [],
    "educationalSystems": ["anglophone_general"],
    "templateCode": "modern",
    "onboardingCompleted": false,
    "websitePublished": false,
    "emailVerified": true,
    "gallery": [],
    "urls": { ... }
  }
}
```

#### PUT `/api/schools/onboarding`
Sauvegarder données onboarding (protégée, admin uniquement)

**Headers**
```
Authorization: Bearer <token>
```

**Body** (partial update — seuls les champs fournis sont mis à jour)
```json
{
  "tagline": "Shaping the leaders of tomorrow",
  "websiteDescription": "Description de l'école",
  "primaryColor": "#085041",
  "templateCode": "modern",
  "educationalSystems": ["anglophone_general", "francophone_general"],
  "onboardingCompleted": true,
  "websitePublished": true
}
```

#### POST `/api/schools/onboarding/media`
Uploader média onboarding (logo, hero image) (protégée, admin uniquement)

**Headers**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### POST `/api/schools/resend-verification`
Renvoyer email de vérification (protégée, admin uniquement)

**Headers**
```
Authorization: Bearer <token>
```

#### POST `/api/schools`
Créer une nouvelle école (protégée)

**Headers**
```
Authorization: Bearer <token>
```

**Body**
```json
{
  "name": "École Example",
  "email": "contact@ecole-example.com",
  "phone": "+237 123 456 789",
  "location": "Douala, Cameroun",
  "city": "Douala",
  "country": "Cameroun"
}
```

#### GET `/api/schools`
Lister toutes les écoles (protégée)

**Headers**
```
Authorization: Bearer <token>
```

**Query Parameters**
- `limit` (default: 10)
- `offset` (default: 0)

#### GET `/api/schools/:id`
Détails d'une école (protégée)

**Headers**
```
Authorization: Bearer <token>
```

#### PUT `/api/schools/:id`
Mettre à jour une école (protégée, admin uniquement)

**Headers**
```
Authorization: Bearer <token>
```

### Étudiants

#### POST `/api/students`
Créer un étudiant

**Headers**
```
Authorization: Bearer <token>
```

**Body**
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "dateOfBirth": "2010-05-15",
  "gender": "male",
  "studentNumber": "STU001"
}
```

#### GET `/api/students`
Lister les étudiants

**Headers**
```
Authorization: Bearer <token>
```

**Query Parameters**
- `limit` (default: 10)
- `offset` (default: 0)
- `status` (filter)
- `classId` (filter)

#### GET `/api/students/:id`
Détails d'un étudiant

#### PUT `/api/students/:id`
Mettre à jour un étudiant

#### DELETE `/api/students/:id`
Supprimer un étudiant

### Tuteurs

#### POST `/api/guardians`
Créer un tuteur

**Headers**
```
Authorization: Bearer <token>
```

**Body**
```json
{
  "studentId": "student_uuid",
  "name": "Marie Dupont",
  "relationship": "mother",
  "phone": "+237 987 654 321",
  "email": "marie.dupont@example.com"
}
```

#### GET `/api/guardians`
Lister les tuteurs

#### GET `/api/guardians/:id`
Détails d'un tuteur

#### PUT `/api/guardians/:id`
Mettre à jour un tuteur

### Structure Académique

#### POST `/api/academics/years`
Créer une année académique

**Body**
```json
{
  "name": "2024-2025",
  "startDate": "2024-09-01",
  "endDate": "2025-07-31",
  "isCurrent": true
}
```

#### GET `/api/academics/years`
Lister les années académiques

#### POST `/api/classes`
Créer une classe

**Body**
```json
{
  "name": "6ème A",
  "academicYearId": "academic_year_uuid",
  "capacity": 40
}
```

#### GET `/api/classes`
Lister les classes

#### POST `/api/subjects`
Créer une matière

**Body**
```json
{
  "name": "Mathématiques",
  "coefficient": 4
}
```

#### GET `/api/subjects`
Lister les matières

### Notes

#### POST `/api/grades`
Enregistrer une note

**Body**
```json
{
  "studentId": "student_uuid",
  "subjectId": "subject_uuid",
  "classId": "class_uuid",
  "score": 15.5,
  "period": "term1",
  "academicYearId": "academic_year_uuid"
}
```

#### GET `/api/grades`
Lister les notes

#### GET `/api/grades/student/:studentId`
Notes d'un étudiant

#### PUT `/api/grades/:id`
Mettre à jour une note

### Présences

#### POST `/api/attendance`
Enregistrer une présence

**Body**
```json
{
  "studentId": "student_uuid",
  "classId": "class_uuid",
  "date": "2024-01-15",
  "status": "present"
}
```

#### GET `/api/attendance`
Lister les présences

#### GET `/api/attendance/student/:studentId`
Présences d'un étudiant

### Finance

#### GET `/api/finance/fees`
Lister les frais

#### POST `/api/fees`
Créer un frais

**Body**
```json
{
  "name": "Frais de scolarité",
  "amount": 150000
}
```

#### POST `/api/payments`
Créer un paiement

**Body**
```json
{
  "studentId": "student_uuid",
  "amount": 150000,
  "method": "bank_transfer"
}
```

#### GET `/api/payments`
Lister les paiements

#### GET `/api/payments/:id`
Détails d'un paiement

### Rapports

#### GET `/api/reports/bulletin/:studentId`
Générer bulletin d'un étudiant

#### GET `/api/reports/class/:classId`
Rapport de classe

### Notifications

#### GET `/api/notifications`
Lister les notifications

**Headers**
```
Authorization: Bearer <token>
```

#### PUT `/api/notifications/:id/read`
Marquer notification comme lue

### Configuration

#### GET `/api/config`
Configuration système publique

---

## Authentification & Autorisation

### Flow JWT

1. L'utilisateur appelle `POST /api/auth/login` avec ses identifiants
2. Le serveur valide et retourne un token JWT
3. Le client inclut le token dans l'en-tête Authorization : `Bearer <token>`
4. Le middleware vérifie le token avant de traiter la requête
5. Le token expire après la période `JWT_EXPIRES_IN`

### Rôles & Permissions

| Rôle | Permissions |
|------|-------------|
| SUPER_ADMIN | Accès complet au système |
| ADMIN | Administration de l'école |
| TEACHER | Gestion des classes et notes |
| ACCOUNTANT | Opérations financières |
| STUDENT | Voir ses propres données |
| GUARDIAN | Voir les données de ses enfants |
| STAFF | Fonctions générales |

### Middleware d'Authentification

**auth.middleware.js**
- Vérifie la présence du token JWT
- Décode et valide le token
- Attache les informations utilisateur à la requête
- Vérifie que l'utilisateur accède uniquement aux données de son école

### Middleware de Rôles

**role.middleware.js**
- Vérifie que l'utilisateur a le rôle requis
- Peut être utilisé pour protéger des routes spécifiques

**Usage**
```javascript
router.get('/admin-only', 
  authMiddleware, 
  roleMiddleware(['ADMIN', 'SUPER_ADMIN']), 
  controller.adminOnlyAction
);
```

---

## Services

### Auth Service (`auth.service.js`)

Gère toute la logique d'authentification :

- `login()` - Connexion utilisateur
- `verifySchool()` - Vérification école
- `getCurrentUser()` - Récupération utilisateur actuel

### School Service (`school.service.js`)

Gère les opérations sur les écoles :

- `createSchool()` - Création école
- `getSchool()` - Récupération école
- `updateSchool()` - Mise à jour école
- `getAllSchools()` - Liste écoles
- `registerSchool()` - Inscription complète école
- `checkSubdomain()` - Vérification sous-domaine
- `getTemplates()` - Récupération templates
- `resendVerificationEmail()` - Renvoi email vérification

### Student Service (`student.service.js`)

Gère les opérations sur les étudiants :

- `createStudent()` - Création étudiant
- `getStudent()` - Récupération étudiant
- `updateStudent()` - Mise à jour étudiant
- `deleteStudent()` - Suppression étudiant
- `getStudentsByClass()` - Étudiants par classe

### Guardian Service (`guardian.service.js`)

Gère les opérations sur les tuteurs :

- `createGuardian()` - Création tuteur
- `getGuardian()` - Récupération tuteur
- `updateGuardian()` - Mise à jour tuteur
- `getGuardiansByStudent()` - Tuteurs par étudiant

### Onboarding Service (`onboarding.service.js`)

Gère le processus d'intégration :

- `getOnboarding()` - Récupération données onboarding
- `saveOnboarding()` - Sauvegarde données onboarding
- `uploadMedia()` - Upload médias onboarding
- `verifyEmail()` - Vérification email

### Email Service (`email.service.js`)

Gère l'envoi d'emails :

- `sendVerificationEmail()` - Email vérification
- `sendWelcomeEmail()` - Email bienvenue
- `sendNotificationEmail()` - Email notification

### Media Service (`media.service.js`)

Gère les uploads et stockage de médias :

- `uploadImage()` - Upload image via Cloudinary
- `deleteImage()` - Suppression image
- `uploadDocument()` - Upload document

### Website Service (`website.service.js`)

Gère les sites web des écoles :

- `createWebsite()` - Création site web
- `updateWebsite()` - Mise à jour site web
- `getWebsite()` - Récupération site web

---

## Middleware

### Auth Middleware (`auth.middleware.js`)

Vérifie l'authentification JWT :

```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided. Authorization required.',
    });
  }
  
  const decoded = jwt.verify(token, jwtConfig.secret);
  req.user = decoded;
  
  // Vérification cross-school
  if (req.school?.school_id && decoded.schoolId && 
      req.school.school_id !== decoded.schoolId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You cannot access another school\'s data.',
    });
  }
  
  next();
};
```

### Role Middleware (`role.middleware.js`)

Vérifie les permissions basées sur les rôles :

```javascript
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }
    next();
  };
};
```

### School Resolver Middleware (`schoolResolver.middleware.js`)

Extrait l'école depuis le sous-domaine :

```javascript
const schoolResolverMiddleware = async (req, res, next) => {
  const host = req.headers.host;
  const subdomain = host.split('.')[0];
  
  const school = await sql`
    SELECT * FROM schools WHERE subdomain = ${subdomain}
  `;
  
  if (school.length > 0) {
    req.school = school[0];
  }
  
  next();
};
```

### Tenant Middleware (`tenant.middleware.js`)

Attache `school_id` à toutes les requêtes :

```javascript
const tenantMiddleware = (req, res, next) => {
  if (req.school) {
    req.schoolId = req.school.school_id;
    req.tenantId = req.school.school_id;
  }
  next();
};
```

### Validate Middleware (`validate.middleware.js`)

Valide les requêtes avec express-validator :

```javascript
const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  
  next();
};
```

### Error Middleware (`error.middleware.js`)

Gestionnaire d'erreurs global :

```javascript
const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });
};
```

---

## Sécurité

### Mesures de Sécurité Implémentées

✅ **Authentification JWT** - Tokens stateless et sécurisés  
✅ **Contrôle d'Accès Basé sur les Rôles (RBAC)** - Permissions granulaires  
✅ **Hashage des mots de passe** - bcrypt avec salt rounds  
✅ **Validation des entrées** - express-validator pour toutes les requêtes  
✅ **Prévention SQL Injection** - Requêtes paramétrées via driver postgres  
✅ **Configuration CORS** - Whitelist de domaines spécifiques  
✅ **Gestion des erreurs** - Pas de données sensibles dans les messages d'erreur  
✅ **Séparation environnement** - Configs dev/prod via `.env`  
✅ **Isolation multi-tenant** - Chaque école ne voit que ses données  
✅ **Vérification cross-school** - Empêche l'accès inter-écoles  

### Bonnes Pratiques

1. **Jamais exposer les secrets** dans le code
2. **Utiliser des variables d'environnement** pour les configurations sensibles
3. **Valider toutes les entrées** côté serveur
4. **Utiliser HTTPS** en production
5. **Implémenter rate limiting** pour les endpoints sensibles
6. **Logger les activités suspectes** pour audit
7. **Garder les dépendances** à jour
8. **Utiliser des tokens à courte durée** avec refresh tokens

---

## Déploiement

### Prérequis

- Node.js ≥ 14.0.0
- PostgreSQL (Supabase recommandé)
- Compte Cloudinary (optionnel)
- Domaine configuré pour multi-tenant

### Configuration Production

1. **Configurer les variables d'environnement production**
2. **Exécuter les migrations de base de données**
3. **Peupler les données initiales**
4. **Configurer le domaine pour le multi-tenant**
5. **Configurer HTTPS**

### Commandes Déploiement

```bash
# Installation dépendances
npm install --production

# Migrations base de données
npm run migrate

# Données initiales
npm run seed

# Démarrage production
npm start
```

### Process Manager (PM2)

Pour une gestion de processus robuste en production :

```bash
# Installation PM2
npm install -g pm2

# Démarrage avec PM2
pm2 start src/server.js --name akademee-backend

# Configuration cluster
pm2 start src/server.js -i max --name akademee-backend

# Sauvegarde configuration
pm2 save

# Démarrage automatique au boot
pm2 startup
```

### Docker (Optionnel)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

```bash
# Build image
docker build -t akademee-backend .

# Run container
docker run -p 5000:5000 --env-file .env akademee-backend
```

### Monitoring

- **Logs**: Vérifier les logs application pour erreurs
- **Performance**: Monitorer CPU, mémoire, temps de réponse
- **Base de données**: Surveiller les connexions et performances
- **API**: Monitorer les endpoints et taux d'erreur

---

## Support & Maintenance

### Dépannage

#### Erreur "Missing DATABASE_URL"
**Solution**: Assurez-vous que `.env` existe dans la racine du projet et que `require('dotenv').config()` est appelé avant d'importer la config database.

#### Erreurs CORS
**Solution**: Mettez à jour `src/config/cors.js` avec votre domaine frontend.

#### Échec validation JWT Token
**Solution**: Vérifiez que le token n'a pas expiré ou n'a pas été modifié. Demandez un nouveau token via l'endpoint refresh.

#### Timeout connexion base de données
**Solution**: Vérifiez que DATABASE_URL est correct et que l'instance Supabase est en cours d'exécution.

#### Échec upload fichier
**Solution**: Vérifiez les identifiants Cloudinary dans `.env` et que la taille du fichier < 10MB.

### Maintenance

- **Mises à jour dépendances**: `npm update`
- **Nettoyage logs**: Rotation régulière des logs
- **Backups**: Backups réguliers de la base de données
- **Monitoring**: Surveillance continue des performances

---

**Akademee Backend v1.0.0** | **Node.js v14+** | **Express.js** | **PostgreSQL/Supabase**

*Dernière mise à jour: Janvier 2024*
