# Documentation Complete du Projet Akademee

---

## Table des matieres

1. Presentation generale
2. Architecture technique
3. Stack technique complete
4. Structure du projet
5. Backend API REST
6. Frontend Interface utilisateur
7. Base de donnees et migrations
8. Systeme multi-tenant
9. Authentification et securite
10. Gestion des roles RBAC
11. Modules fonctionnels
12. Systeme educatif camerounais
13. Generation de bulletins PDF
14. Emploi du temps Timetable
15. Module Universite
16. Site vitrine Website Builder
17. Notifications et messages
18. Systeme hors-ligne Offline PWA
19. Cache et performance
20. Internationalisation i18n
21. Tests et qualite
22. Docker et deploiement
23. Monitoring et observabilite
24. Configuration et variables denvironnement
25. API Endpoints Reference complete
26. Workflow et flux utilisateurs
27. Bonnes pratiques et conventions

---

## 1. Presentation generale

### Qu'est-ce qu'Akademee ?

**Akademee** est un **systeme de gestion scolaire complet** (School Management System / SMS) concu pour les etablissements d'enseignement au **Cameroun** et en Afrique francophone. C'est une plateforme **SaaS multi-tenant** qui permet a chaque ecole d'avoir son propre espace personnalise, accessible via un sous-domaine unique.

### Objectifs du projet

- **Numeriser la gestion scolaire** : notes, presences, finances, emplois du temps, bulletins
- **Supporter les systemes educatifs camerounais** : anglophone, francophone, technique, universitaire
- **Offrir un site vitrine** personnalisable pour chaque ecole (logo, couleurs, templates)
- **Fonctionner hors-ligne** grace a une architecture PWA avec cache IndexedDB
- **Etre multilingue** : francais et anglais

### Public cible

| Role | Description |
|------|-------------|
| **ADMIN** | Administrateur de l ecole - controle total |
| **TEACHER** | Enseignant - gestion des classes, notes, emploi du temps |
| **STUDENT** | Eleve/etudiant - consultation de ses donnees |
| **ACCOUNTANT** | Comptable - gestion financiere |
| **PARENT** | Parent/tuteur - suivi de l enfant, paiement de frais |
| **SECRETARY** | Secretaire - soutien administratif |

---

## 2. Architecture technique

### Architecture globale

Le systeme suit une architecture 3-tiers :

1. **Frontend** (Nginx :80) - SPA React servie en statique + reverse proxy /api
2. **Backend** (Express :5000) - API REST, logique metier, middleware chain
3. **Base de donnees** (PostgreSQL 16 :5432) - donnees persistantes
4. **Cache/Queue** (Redis) - cache HTTP tenant-scoped + BullMQ job queues
5. **Stockage fichiers** (Cloudinary) - images, logos, heroes

### Pattern architectural : MVC + Services

Le backend suit un pattern **Controller - Service - Database** :

```
Request -> Route -> Middleware (auth, role, tenant, validate)
       -> Controller (validation, orchestration)
       -> Service (logique metier)
       -> Database (SQL via postgres driver)
       -> Response (JSON standardise)
```

### Middleware chain (dans l'ordre d'execution)

```
1. Sentry (monitoring erreurs)
2. Helmet (headers securite HTTP)
3. Compression (gzip responses)
4. CORS (origines autorisees)
5. Body parsing (JSON + URL-encoded)
6. Cookie Parser
7. Request ID (tracabilite unique)
8. HTTP Logger (Morgan + Winston)
9. School Resolver (extraction sous-domaine)
10. Tenant Middleware (resolution ecole)
11. Cache Middleware (Redis / NodeCache)
12. Routes API
13. 404 Handler
14. Sentry Error Handler
15. Global Error Handler
```

---

## 3. Stack technique complete

### Frontend

| Technologie | Version | Role |
|-------------|---------|------|
| **React** | 19.2+ | Framework UI |
| **Vite** | 8.0+ | Bundler et dev server (Rolldown) |
| **JavaScript / JSX** | ES2022+ | Langage |
| **Tailwind CSS** | 4.3+ | Styling utility-first |
| **React Router DOM** | 7.17+ | Routage client SPA |
| **Axios** | 1.18+ | Client HTTP |
| **TanStack React Query** | 5.101+ | Gestion d etat serveur / cache |
| **i18next** | 26.3+ | Internationalisation (EN/FR) |
| **Recharts** | 3.10+ | Graphiques / visualisation |
| **React Icons** | 5.7+ | Bibliotheque d icones |
| **React Hot Toast** | 2.6+ | Notifications toast |
| **Lottie React** | 2.4+ | Animations Lottie |
| **Dexie.js** | 4.4+ | Wrapper IndexedDB (offline) |
| **html2canvas + jsPDF** | 1.4+ / 4.2+ | Generation PDF cote client |
| **@dnd-kit** | 6.3+ | Drag and Drop (emploi du temps) |
| **Vite PWA** | 1.3+ | Service Worker / PWA |
| **ESLint** | 10.3+ | Linting |

### Backend

| Technologie | Version | Role |
|-------------|---------|------|
| **Node.js** | 20+ (Alpine) | Runtime |
| **Express.js** | 4.18+ | Framework HTTP / API REST |
| **PostgreSQL** (postgres driver) | 3.4+ | Base de donnees |
| **Redis** (ioredis) | 5.11+ | Cache + job queues |
| **BullMQ** | 6.0+ | Files d attente background |
| **JWT** (jsonwebtoken) | 9.0+ | Authentification token |
| **bcrypt** | 5.1+ | Hachage mots de passe |
| **PDFKit** | 0.13+ | Generation PDF serveur |
| **Puppeteer-core** | 25.4+ | PDF bulletin (Chrome headless) |
| **Nodemailer** | 6.9+ | Envoi emails (SMTP) |
| **Cloudinary** | 1.32+ | Upload / CDN images |
| **Multer** | 1.4+ | Gestion upload fichiers |
| **express-validator** | 7.0+ | Validation des entrees |
| **express-rate-limit** | 8.5+ | Limitation de debit |
| **Helmet** | 8.2+ | Headers de securite |
| **Morgan** | 1.11+ | Logging HTTP |
| **Winston** | 3.19+ | Logging structure |
| **Sentry** (@sentry/node) | 10.65+ | Monitoring erreurs |
| **Swagger** | 6.3+ / 5.0+ | Documentation API |
| **node-cron** | 4.6+ | Taches planifiees |
| **Archiver** | 7.0+ | Archives ZIP |
| **NodeCache** | 5.1+ | Cache in-memory (fallback Redis) |

### Infrastructure

| Technologie | Role |
|-------------|------|
| **Docker** + **Docker Compose** | Conteneurisation et orchestration |
| **Nginx** 1.27 (Alpine) | Reverse proxy, SPA static, gzip |
| **PostgreSQL 16** (Alpine) | Base de donnees |
| **Supabase** (optionnel) | PostgreSQL managed + Auth |
| **Cloudflare** (optionnel) | CDN, DNS, SSL |
| **GitHub Actions** | CI/CD |

---

## 4. Structure du projet

### Backend (API REST Node.js)

- **src/app.js** - Configuration Express (middleware, routes)
- **src/server.js** - Demarrage du serveur
- **src/config/** - Configurations centralisees (database, jwt, cors, domains, redis, sentry, email, cloudinary, multer, swagger, env)
- **src/middleware/** - 13 middlewares (auth, role, tenant, schoolResolver, validate, upload, cache, rateLimiter, audit, httpLogger, requestId, error, announcementUpload)
- **src/controllers/** - ~40 controleurs
- **src/routes/** - ~40 fichiers routes + v1/ (period, sequence, gradingSystem, university)
- **src/services/** - ~50 services metier
- **src/validators/** - ~20 validateurs
- **src/database/migrations/** - 46 migrations SQL (001-046)
- **src/utils/** - 9 utilitaires (AppError, response, logger, cache, constants, domainHelper, slugGenerator, emailGenerator, imageUrl)

### Frontend (SPA React)

- **src/main.jsx / App.jsx** - Entree + routeur (70+ routes)
- **src/app/core/** - Fondamentaux : api/ (~30 services), context/ (Auth, Theme, Year, EducationalSystem), hooks/ (7), guards/ (3), utils/ (5), offline/ (5), i18n/ (config + 10 fichiers locales), constants/
- **src/app/features/** - 28 modules fonctionnels (landing, auth, onboarding, dashboard, students, teachers, classes, subjects, grades, attendance, exams, finance, timetable, announcements, messages, parent, levels, series, academic, settings, users, website, programs, faculties, research, admissions, accountant)
- **src/app/layout/** - AdminLayout, Sidebar, Navbar, MobileBottomNav, NotificationBell, ThemeLangToggles
- **src/app/components/ui/** - 27 composants UI (Button, Input, Select, Modal, Drawer, Table, Card, Badge, Tabs, etc.)

---

## 5. Backend - API REST

### Format de reponse standardise

```json
{
  "success": true,
  "message": "Operation reussie",
  "data": {},
  "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

---

## 6. Frontend - Interface utilisateur

### Feature-Sliced Design

Chaque module (features/) contient : pages/, components/, hooks/, utils/

### Routing (70+ routes)

- **Code-splitting** : React.lazy() + Suspense sur chaque page
- **Gardes** : ProtectedRoute (auth), RoleRoute (role), AcademicYearGuard
- **Layout** : AdminLayout (Sidebar + Navbar + contenu)
- **Dashboard adaptatif** : le dashboard change selon le role

### Composants UI (27 dans components/ui/)

Button, Input, Select, Modal, Drawer, Table, Card, Badge, Tabs, ConfirmDialog, Skeleton, Spinner, LoadingFallback, PageHeader, StatCard, EmptyState, BulletinTemplate, YearSelector, ReportCardGenerationAnimation, etc.

---

## 7. Base de donnees et migrations

### 46 migrations SQL (sans ORM)

Le systeme utilise un gestionnaire de migrations custom execute via npm run migrate.

### Tables principales

| Table | Description |
|-------|-------------|
| schools | Ecoles (school_id, name, subdomain, email, primary_color, logo_url) |
| users | Utilisateurs (user_id, school_id, email, password_hash, roles[]) |
| students | Eleves (student_id, school_id, user_id, class_id, enrollment_no) |
| classes | Classes (class_id, school_id, name, level_id) |
| levels | Niveaux scolaires |
| series | Filieres |
| subjects | Matieres |
| class_subjects | Affectation matieres-classes |
| subject_teachers | Affectation matieres-enseignants |
| class_teachers | Affectation classes-enseignants |
| grades | Notes (student_id, subject_id, period_id, score) |
| report_cards | Bulletins |
| report_card_lines | Lignes de bulletins |
| attendance | Presences (PRESENT/ABSENT/LATE/EXCUSED) |
| academic_years | Annees academiques |
| periods | Periodes (trimestres, semestres) |
| sequences | Sequences (compositions, examens) |
| fees | Frais scolaires |
| student_fees | Affectation fees-eleves |
| payments | Paiements |
| timetable_periods | Creneaux horaires |
| timetable_rooms | Salles |
| timetable_entries | Entrees emploi du temps |
| timetable_unavailabilities | Indisponibilites |
| announcements | Annonces |
| notifications | Notifications |
| messages | Messages |
| website_templates | Templates site vitrine |
| enrollment_inquiries | Demandes d inscription |
| report_card_jobs | Jobs background generation PDF |
| token_blacklist | Blacklist JWT |
| audit_logs | Journal d audit |

### Types enumeres

- **Roles** : ADMIN, TEACHER, STUDENT, ACCOUNTANT, PARENT, SECRETARY
- **Presence** : PRESENT, ABSENT, LATE, EXCUSED
- **Systemes educatifs** : ANGLOPHONE_GENERAL, FRANCOPHONE_GENERAL, TECHNICAL, UNIVERSITY
- **Statuts frais** : PENDING, PARTIAL, PAID, OVERDUE
- **Statuts bulletins** : DRAFT, PUBLISHED, LOCKED

---

## 8. Systeme multi-tenant

### Principe

Chaque ecole est un **tenant isole** identifie par son sous-domaine :

| Environnement | Format |
|---------------|--------|
| Developpement | moncollege.lvh.me:3000 |
| Production | moncollege.akademee.cm |

### Resolution du tenant

1. **School Resolver** extrait le sous-domaine du Host header
2. **Tenant Middleware** resout : JWT (schoolId) ou requete DB
3. **Isolation** : toutes les requetes API filtrees par school_id
4. **Cache scoped** : akm:http:school:{id}:... (un tenant ne lit jamais le cache d un autre)
5. **JWT verify** : .verify() (pas .decode()) pour eviter les payload forges

---

## 9. Authentification et securite

### Flux JWT complet

```
1. POST /api/auth/login { subdomain, email, password }
   -> Verification ecole + utilisateur + bcrypt
   -> Generation JWT access (7j) + refresh (30j)
   -> Retourne token + user + school

2. Requetes API -> Header: Authorization: Bearer <token>
   -> authMiddleware: jwt.verify() + blacklist check
   -> Attach req.user (userId, schoolId, roles, subdomain)

3. POST /api/auth/logout
   -> Ajout token a la blacklist Redis
   -> Nettoyage cookies
```

### Mesures de securite

| Mesure | Implementation |
|--------|----------------|
| Mots de passe | bcrypt (hash + salt) |
| Tokens | JWT HS256 signes, expiration configurable |
| Blacklist | Redis (tokens deconnectes refuses) |
| Rate Limiting | express-rate-limit sur routes sensibles |
| Headers HTTP | Helmet (X-Content-Type, X-Frame-Options, etc.) |
| CORS | Whitelist dynamique (sous-domaines + localhost) |
| Validation | express-validator sur toutes les routes |
| Isolation tenant | school_id dans JWT + verification croisee |
| Audit trail | middleware audit logging des actions critiques |

---

## 10. Gestion des roles (RBAC)

### 6 roles

| Role | Acces typique |
|------|---------------|
| **ADMIN** | Tout le dashboard, parametres, utilisateurs, gestion complete |
| **TEACHER** | Classes assignees, saisie notes, emploi du temps, presences |
| **STUDENT** | Ses notes, presences, frais, bulletin, emploi du temps |
| **ACCOUNTANT** | Dashboard financier, paiements |
| **PARENT** | Suivi enfant, paiement frais, contact campus |
| **SECRETARY** | Emploi du temps, operations courantes |

### Dashboard adaptatif

RoleDashboardRouter affiche un dashboard different selon la priorite : ADMIN > STUDENT > TEACHER > ACCOUNTANT > PARENT > SECRETARY.

---

## 11. Modules fonctionnels

### 11.1 Inscription et Onboarding

**Inscription (3 etapes)** : verification sous-domaine, formulaire ecole+admin, verification email
**Onboarding (5 etapes)** : logo, couleur primaire, slogan+description, image hero, template site
**Systeme educatif** : selection Anglophone / Francophone / Technique / Universitaire

### 11.2 Gestion des eleves

CRUD complet, profils, inscriptions par annee academique, association tuteur/guardian

### 11.3 Structure academique

Niveaux -> Series -> Classes -> Matieres -> Affectations (Subject-Teachers, Class-Teachers) -> Periodes -> Sequences

### 11.4 Notes et Evaluations

Saisie par matiere/classe/sequence, calcul automatique des moyennes, classements, systemes configurables (Anglophone /100+GPA, Francophone /20+mentions, Technique composantes)

### 11.5 Presences

Saisie quotidienne PRESENT/ABSENT/LATE/EXCUSED, par classe et date, bulk update, statistiques

### 11.6 Finance

Frais -> Affectation -> Paiements -> Recus -> Rapports PDF -> Archivage par annee

### 11.7 Bulletins

Individuel ou batch (BullMQ), PDF serveur (Puppeteer+Chromium), preview client (html2canvas+jsPDF), export ZIP

### 11.8 Emploi du temps

Creneaux, salles, entrees, grille visuelle (lundi-vendredi x heures), Drag and Drop (@dnd-kit), validation conflits, vue par role

### 11.9 Examens

GCE O-Level, GCE A-Level, BEPC, Probatoire, Baccalaureat, TVEE, CAP, Bac Technique, examens universitaires

### 11.10-11.12

Annonces (CRUD+publication), Messagerie (interne+parent-campuss), Utilisateurs (creation unifiee, roles, invitations)

---

## 12. Systeme educatif camerounais

### 4 systemes supportes

| Systeme | Niveaux | Examens |
|---------|---------|---------|
| **Anglophone General** | Form 1-5, Lower/Upper Sixth | GCE O-Level, GCE A-Level |
| **Francophone General** | Sixieme-Terminale | BEPC, Probatoire, Baccalaureat |
| **Technique** | College/Lycee technique | TVEE, CAP, Bac Technique |
| **Universite (LMD)** | Licence/Master/Doctorat | Examens de programme |

---

## 13. Generation de bulletins PDF

### Technologies

| Technologie | Usage |
|-------------|-------|
| **Puppeteer-core + Chromium** | Rendu HTML->PDF haute qualite (bulletins) |
| **PDFKit** | PDF simple (recus, etats financiers) |
| **html2canvas + jsPDF** | Preview rapide cote client |
| **BullMQ + Redis** | Generation batch en arriere-plan |

---

## 14. Emploi du temps (Timetable)

- Creneaux horaires, salles, entrees (classe + matiere + enseignant + salle + jour)
- Grille visuelle semaine, Drag and Drop (@dnd-kit), validation conflits
- Vue par role : admin (complet), enseignant (personnel), eleve (classe)

---

## 15. Module Universite

Facultes, Departements, Programmes (Licence/Master/Doctorat), Recherche, Publications
API : /api/v1/university/faculties, /departments, /programs, /research, /publications

---

## 16. Site vitrine (Website Builder)

### 3 templates : Premium (elegant), Bold (audacieux), Playful (ludique)

Personnalisations : logo, couleur, slogan, description, image hero
URL : {subdomain}.akademee.cm/site (publique, sans login)

---

## 17. Notifications et messages

Notifications in-app (cloche, compteur), Messagerie interne, Portail parent, Emails SMTP (verification, reset MDP)

---

## 18. Systeme hors-ligne (Offline / PWA)

### Composants

| Composant | Role |
|-----------|------|
| **Service Worker** (Workbox/Vite PWA) | CacheFirst (fonts), NetworkFirst (API), StaleWhileRevalidate (assets) |
| **Dexie.js** (IndexedDB) | Cache local : students, classes, subjects, periods, sequences |
| **Sync Queue** | File d attente ecritures offline -> synchro auto en ligne |
| **OfflineContext** | Provider React : isOnline, refreshCache, getCachedData, syncQueue |
| **useNetworkStatus** | Hook detection reseau |

### UI offline

ConnectionStatusBanner (banniere hors-ligne), InstallPWAButton (installation PWA), OfflineFallback (page fallback), SyncQueueIndicator (indicateur synchro)

---

## 19. Cache et performance

### Backend

- **Redis** (principal) + **NodeCache** (fallback in-memory)
- Cache HTTP **tenant-scoped** : akm:http:school:{id}:...
- TTLs configures par route (300s-600s)
- **Invalidation automatique** apres ecriture, scope par tenant
- Redis SCAN + DEL (jamais FLUSHDB - partage avec BullMQ)

### Frontend

- Service Worker : NetworkFirst pour API (fallback offline)
- TanStack React Query : cache UI
- Vite chunks manuels : vendor-react, vendor-icons, vendor-charts, vendor-pdf, vendor-i18n, vendor-utils, vendor-anim
- Assets Vite : Cache-Control: public, max-age=31536000, immutable

---

## 20. Internationalisation (i18n)

- **i18next** avec LanguageDetector (navigator, localStorage, cookie)
- **2 langues** : Francais (fr) et Anglais (en)
- **5 namespaces** : common, auth, onboarding, dashboard, landing
- Fallback : en

---

## 21. Tests et qualite

### Backend

- **Jest** : tests unitaires et integration (couverture)
- **Supertest** : tests HTTP
- **ESLint** : linting

### Frontend

- **ESLint** (config flat) : linting JS/JSX
- **Vite build** : verification erreurs

---

## 22. Docker et deploiement

### Docker Compose

- **db** : PostgreSQL 16 Alpine, port 5432, healthcheck
- **backend** : Node.js 20 Alpine + Chromium, port 5000
- **frontend** : Nginx 1.27 Alpine, port 80

### Dockerfiles (multi-stage)

- Backend : deps install -> Node 20 Alpine + Chromium (Puppeteer) -> CMD node src/server.js
- Frontend : npm ci + build -> Nginx Alpine -> COPY dist + nginx.conf

### Nginx

- SPA : try_files $uri $uri/ /index.html
- Proxy : /api/* -> backend:5000
- Gzip : JS, CSS, JSON, SVG
- Cache immutable 1 an pour assets Vite
- No-cache pour index.html et API

---

## 23. Monitoring et observabilite

### Sentry

- Capture d erreurs (exceptions + erreurs HTTP)
- User context : userId, email, schoolId, role
- Traces : 10% (configurable)
- Release tracking : akademee-backend@{version}

### Winston Logger

- 5 niveaux : error (0), warn (1), info (2), http (3), debug (4)
- Transports : Console (dev), error.log (5 Mo x 5), combined.log (5 Mo x 10)
- Request ID dans chaque log

### Health Check

GET /health -> { "status": "OK", "timestamp": "..." }

---

## 24. Configuration et variables d environnement

| Variable | Description | Defaut |
|----------|-------------|--------|
| DATABASE_URL | Connexion PostgreSQL Supabase | Requis |
| DATABASE_SSL | SSL PostgreSQL | false |
| JWT_SECRET | Secret JWT (doit etre change) | Requis |
| JWT_EXPIRES_IN | Expiration access token | 7d |
| JWT_REFRESH_EXPIRES_IN | Expiration refresh token | 30d |
| REDIS_URL | Connexion Redis | Optionnel |
| SENTRY_DSN | DSN Sentry | Optionnel |
| SMTP_HOST | Serveur SMTP | Requis (email) |
| SMTP_PORT | Port SMTP | 587 |
| SMTP_USER | Utilisateur SMTP | Requis |
| SMTP_PASSWORD | Mot de passe SMTP | Requis |
| EMAIL_FROM | Adresse expediteur | noreply@akademee.app |
| CLOUDINARY_CLOUD_NAME | Compte Cloudinary | Requis (upload) |
| CLOUDINARY_API_KEY | Cle API Cloudinary | Requis |
| CLOUDINARY_API_SECRET | Secret Cloudinary | Requis |
| FRONTEND_URL | URL frontend dev | http://localhost:3000 |
| FRONTEND_URL_PRODUCTION | URL frontend prod | https://akademee.cm |
| TENANT_DEV_DOMAIN | Domaine dev | lvh.me |
| TENANT_PROD_DOMAIN | Domaine prod | akademee.cm |
| REDIS_HOST | Host Redis | localhost |
| REDIS_PORT | Port Redis | 6379 |
| REDIS_TLS | TLS Redis | false |
| LOG_LEVEL | Niveau log | debug (dev) / info (prod) |

---

## 25. API Endpoints - Reference complete

### Authentification

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | /api/auth/login | Connexion | Public (rate-limited) |
| POST | /api/auth/verify-school | Verifier ecole existe | Public |
| POST | /api/auth/logout | Deconnexion | Protege |
| GET | /api/auth/me | Utilisateur courant | Protege |
| POST | /api/auth/forgot-password | Demande reset MDP | Public |
| POST | /api/auth/reset-password | Reset MDP | Public |
| POST | /api/auth/exchange | Echange token URL -> JWT | Public |
| POST | /api/auth/refresh | Rafraichir token | Protege |
| GET | /api/auth/verify-email | Verification email | Public |

### Ecole

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/schools/register | Inscription ecole + admin |
| POST | /api/schools/check-subdomain | Disponibilite sous-domaine |
| GET | /api/schools/plans | Plans d abonnement |
| GET | /api/schools/templates | Templates disponibles |
| GET/PUT | /api/schools/onboarding | Onboarding (5 etapes) |
| POST | /api/schools/onboarding/media | Upload logo/hero |
| POST | /api/schools/resend-verification | Renvoyer email verification |

### Eleves

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | /api/students | Liste / Creation |
| GET/PUT/DELETE | /api/students/:id | Detail / Modification / Suppression |

### Notes

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | /api/grades | Liste / Creation |
| GET | /api/grades/class/:classId | Notes par classe |
| GET | /api/grades/student/:id | Notes d un eleve |
| POST | /api/grades/calculate | Calculer moyennes |
| POST | /api/grades/bulk-upload | Import en masse |

### Presences

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | /api/attendance | Liste / Enregistrement |
| POST | /api/attendance/bulk | Presences en masse |
| GET | /api/attendance/class/:classId/date/:date | Par classe/jour |
| GET | /api/attendance-stats/student/:id | Stats eleve |

### Finance

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | /api/finance/fees | Frais scolaires |
| POST | /api/finance/fees/assign | Affecter frais |
| GET/POST | /api/payments | Paiements |
| GET | /api/finance/student/:id | Statut financier |

### Emploi du temps

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | /api/timetable/periods | Creneaux horaires |
| GET/POST | /api/timetable/rooms | Salles |
| GET/POST | /api/timetable/entries | Entrees |
| GET | /api/timetable/grid | Grille complete |
| GET | /api/timetable/today | Emploi du jour |

### Bulletins

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | /api/v1/report-cards | Bulletins |
| POST | /api/v1/report-cards/batch | Generation batch |
| GET | /api/v1/report-cards/:id/payload | Donnees bulletin |
| POST | /api/v1/report-cards/:id/publish | Publier |
| GET | /api/v1/report-card-jobs | Statut jobs |

### Universite

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | /api/v1/university/faculties | Facultes |
| GET/POST | /api/v1/university/departments | Departements |
| GET/POST | /api/v1/university/programs | Programmes LMD |
| GET/POST | /api/v1/university/research | Recherche |
| GET/POST | /api/v1/university/publications | Publications |

### Dashboard

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/dashboard/stats | Statistiques |
| GET | /api/dashboard/activities | Activites recentes |
| GET | /api/dashboard/revenue | Revenus |
| GET | /api/dashboard/finance-stats | Stats financieres |

### Autres

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | /api/announcements | Annonces |
| GET/POST | /api/messages | Messagerie |
| GET/POST | /api/notifications | Notifications |
| GET/POST | /api/classes | Classes |
| GET/POST | /api/subjects | Matieres |
| GET/POST | /api/levels | Niveaux |
| GET/POST | /api/series | Series |
| GET/POST | /api/roles | Roles |
| GET | /api/config | Configuration |
| GET | /api-docs | Swagger UI |
| GET | /health | Health check |

---

## 26. Workflow et flux utilisateurs

### Inscription -> Onboarding -> Dashboard

1. Verification sous-domaine (/api/schools/check-subdomain)
2. Formulaire inscription (ecole + admin) -> /api/schools/register -> JWT
3. Verification email (lien dans email)
4. Onboarding 5 etapes (logo, couleur, slogan, hero, template)
5. Selection systeme educatif
6. Configuration annee academique (periodes + sequences)
7. Acces dashboard admin

### Enseignant

Connexion -> Dashboard -> Mes classes, Saisie notes, Mon emploi du temps, Presences

### Eleve

Connexion -> Dashboard -> Mes notes, Mes presences, Mes frais, Mon bulletin, Mon emploi du temps

### Parent

Connexion -> Dashboard -> Suivi enfant, Paiement frais, Contact campus

---

## 27. Bonnes pratiques et conventions

### Backend

- Un controller par route (pas de logique metier dans les controleurs)
- Services pour la logique metier (reutilisabilite, testabilite)
- Validation systematique (express-validator)
- Reponses standardisees (utils/response.js)
- Errors custom (AppError)
- Logging structure (Winston + request ID)
- Migrations versionnees

### Frontend

- Feature-Sliced Design (modules fonctionnels autonomes)
- Lazy loading (code-splitting sur toutes les pages)
- TanStack Query (pas de state management lourd)
- Composants reutilisables (components/ui/)
- i18n systematique (toutes les chaines dans les JSON de traduction)
- Hooks personnalises (logique reutilisable extraite)
- Contexts minimaux (Auth, Theme, Year, EducationalSystem uniquement)

### Git

- Branches feature : feat/timetable, feat/classes, etc.
- Commits descriptifs : feat(module): description
- Merge via pull requests

### Deploiement

- Docker multi-stage images optimisees
- Nginx : SPA + proxy reverse
- Health checks pour orchestrateurs
- Variables denvironnement separees par environnement

---

## Annexe - Documentation existante

| Fichier | Contenu |
|---------|---------|
| docs/API.md | Documentation API |
| docs/BACKEND_DOCUMENTATION.md | Documentation backend complete |
| docs/FRONTEND_DOCUMENTATION.md | Documentation frontend |
| docs/DEPLOYMENT.md | Guide de deploiement |
| docs/USER_FLOWS.md | Flux utilisateurs |
| docs/TESTING_FLOWS_*.md | Scenarios de test par systeme educatif |
| docs/TIMETABLE_BENCHMARK.md | Benchmark emploi du temps |
| docs/UNIVERSITY_MODULES_API.md | API module universite |
| docs/REPORT_CARD_TEMPLATES_RESEARCH.md | Recherche templates bulletins |
| API_DOCUMENTATION.md | Collection Postman importable |
| akademee-postman-collection.json | Collection Postman |

---

> Document genere le 18 aout 2026 - Couvre l integralite de la codebase Akademee (branche feat/timetable).
