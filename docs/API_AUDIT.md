# Audit des Endpoints API — Akademee

> **Date :** 15 juillet 2026  
> **But :** Lister exhaustivement ce qui est disponible côté backend, ce qui manque, et où le frontend utilise encore du mock.

---

## Légende

| Symbole | Signification |
|---|---|
| ✅ | Endpoint disponible + service backend + frontend migré |
| ⚠️ | Endpoint disponible mais frontend encore sur mock |
| ❌ | Endpoint manquant — ni backend, ni service frontend |
| 🔶 | Endpoint disponible mais partiellement implémenté |

---

## 1. Modules COMPLETS (tout est prêt)

### 1.1 Auth (`/api/auth`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/auth/login` | ✅ | Connexion JWT |
| `POST /api/auth/verify-school` | ✅ | Vérification du sous-domaine |
| `POST /api/auth/forgot-password` | ✅ | Envoi email reset |
| `POST /api/auth/reset-password` | ✅ | Reset password |
| `POST /api/auth/logout` | ✅ | Déconnexion + blacklist token |
| `GET /api/auth/me` | ✅ | Profil utilisateur connecté |

### 1.2 Écoles (`/api/schools`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/schools/register` | ✅ | Inscription école |
| `POST /api/schools/check-subdomain` | ✅ | Vérification sous-domaine |
| `GET /api/schools/plans` | ✅ | Liste des plans tarifaires |
| `GET /api/schools/templates` | ✅ | Templates site vitrine |
| `GET /api/schools/verify-email` | ✅ | Vérification email |
| `GET /api/schools/resend-verification` | ✅ | Renvoi email vérification |
| `GET /api/schools/onboarding` | ✅ | Données onboarding |
| `PUT /api/schools/onboarding` | ✅ | Update onboarding |
| `POST /api/schools/onboarding/media` | ✅ | Upload media onboarding |
| `GET /api/schools` | ✅ | Liste écoles (admin) |
| `GET /api/schools/:id` | ✅ | Détail école |
| `PUT /api/schools/:id` | ✅ | Update école |

### 1.3 Dashboard (`/api/dashboard`)

| Endpoint | Statut | Détail |
|---|---|---|
| `GET /api/dashboard/stats` | ✅ | Statistiques (total étudiants, profs, classes, revenus) |
| `GET /api/dashboard/activities` | ✅ | Activités récentes |
| `GET /api/dashboard/revenue` | ✅ | Données revenus |

### 1.4 Étudiants (`/api/students`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/students` | ✅ | Création étudiant + user auto |
| `GET /api/students` | ✅ | Liste avec filtre (search, status, className) |
| `GET /api/students/:id` | ✅ | Détail étudiant |
| `PUT /api/students/:id` | ✅ | Update étudiant |
| `DELETE /api/students/:id` | ✅ | Soft delete (inactive) |

### 1.5 Classes (`/api/classes`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/classes` | ✅ | Création classe |
| `GET /api/classes` | ✅ | Liste avec filtre academicYearId |
| `GET /api/classes/:id` | ✅ | Détail avec prof principal + compteur élèves |
| `PUT /api/classes/:id` | ✅ | Update classe |
| `DELETE /api/classes/:id` | ✅ | Suppression classe |
| `POST /api/classes/:id/students` | ✅ | Inscription étudiant |
| `DELETE /api/classes/:id/students/:studentId` | ✅ | Retrait étudiant |

### 1.6 Matières (`/api/subjects`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/subjects` | ✅ | Création matière |
| `GET /api/subjects` | ✅ | Liste |
| `GET /api/subjects/:id` | ✅ | Détail |
| `PUT /api/subjects/:id` | ✅ | Update |
| `DELETE /api/subjects/:id` | ✅ | Suppression |
| `GET /api/subjects/class/:classId` | ✅ | Matières d'une classe |
| `POST /api/subjects/:id/classes` | ✅ | Assigner matière à une classe |
| `POST /api/subjects/:id/teachers` | ✅ | Assigner prof à une matière |

### 1.7 Notes (`/api/grades`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/grades` | ✅ | Création note |
| `GET /api/grades` | ✅ | Liste avec filtres (studentId, subjectId, periodId, academicYearId) |
| `GET /api/grades/student/:studentId` | ✅ | Notes d'un étudiant |
| `GET /api/grades/class/:classId` | ✅ | Notes d'une classe |
| `GET /api/grades/period/:periodId/class/:classId` | ✅ | Notes période + classe |
| `GET /api/grades/report/:studentId` | ✅ | Bulletin étudiant |
| `PUT /api/grades/:id` | ✅ | Update note |
| `DELETE /api/grades/:id` | ✅ | Suppression note |
| `POST /api/grades/calculate` | ✅ | Calcul automatique |
| `POST /api/grades/bulk-upload` | ✅ | Import en masse |

### 1.8 Calculs Notes (`/api/grade-calculations`)

| Endpoint | Statut | Détail |
|---|---|---|
| `GET /api/grade-calculations/averages/:studentId` | ✅ | Moyennes par matière + générale |
| `GET /api/grade-calculations/rankings/:classId` | ✅ | Classement des élèves |

### 1.9 Présence (`/api/attendance`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/attendance` | ✅ | Création |
| `GET /api/attendance` | ✅ | Liste avec filtres |
| `GET /api/attendance/student/:studentId` | ✅ | Présence d'un étudiant |
| `GET /api/attendance/class/:classId/date/:date` | ✅ | Présence classe par date |
| `GET /api/attendance/class/:classId` | ✅ | Présence d'une classe |
| `GET /api/attendance/statistics` | ✅ | Statistiques globales |
| `PUT /api/attendance/:id` | ✅ | Update |
| `POST /api/attendance/bulk` | ✅ | Ajout en masse |

### 1.10 Statistiques Présence (`/api/attendance-stats`)

| Endpoint | Statut | Détail |
|---|---|---|
| `GET /api/attendance-stats/student/:studentId` | ✅ | Stats par étudiant |
| `GET /api/attendance-stats/class/:classId` | ✅ | Stats par classe |
| `GET /api/attendance-stats/trends/monthly` | ✅ | Tendances mensuelles |

### 1.11 Frais (`/api/finance`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/finance/fees` | ✅ | Création frais |
| `GET /api/finance/fees` | ✅ | Liste frais |
| `GET /api/finance/fees/:id` | ✅ | Détail frais |
| `PUT /api/finance/fees/:id` | ✅ | Update frais |
| `DELETE /api/finance/fees/:id` | ✅ | Suppression frais |
| `POST /api/finance/fees/assign` | ✅ | Assigner frais à étudiant/classe |
| `GET /api/finance/student/:studentId` | ✅ | Statut frais étudiant |
| `GET /api/finance/reports` | ✅ | Rapports financiers |

### 1.12 Paiements (`/api/payments`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/payments` | ✅ | Enregistrement paiement |
| `GET /api/payments` | ✅ | Liste avec filtres |
| `GET /api/payments/:id` | ✅ | Détail paiement |
| `GET /api/payments/student/:studentId` | ✅ | Paiements étudiant |
| `POST /api/payments/:id/verify` | ✅ | Vérification paiement |
| `GET /api/payments/report/generate` | ✅ | Rapport paiements |

### 1.13 Calculs Frais (`/api/fee-calculations`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/fee-calculations/recalculate` | ✅ | Recalcul massif |
| `GET /api/fee-calculations/student/:studentId` | ✅ | Statut individuel |
| `GET /api/fee-calculations/student/:studentId/summary` | ✅ | Résumé complet |

### 1.14 Examens (`/api/exams`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/exams` | ✅ | Création examen |
| `GET /api/exams` | ✅ | Liste |
| `GET /api/exams/:id` | ✅ | Détail |
| `PUT /api/exams/:id` | ✅ | Update |
| `DELETE /api/exams/:id` | ✅ | Suppression |
| `POST /api/exams/register` | ✅ | Inscription étudiant |
| `GET /api/exams/:examId/registrations` | ✅ | Liste inscriptions |
| `PUT /api/exams/registrations/:id/result` | ✅ | Saisie résultat |

### 1.15 Rapports / Bulletins (`/api/reports`)

| Endpoint | Statut | Détail |
|---|---|---|
| `GET /api/reports/bulletin/:studentId/:periodId` | ✅ | Bulletin (JSON) |
| `GET /api/reports/bulletin/:id` | ✅ | Bulletin simplifié |
| `GET /api/reports/bulletin/:studentId/:periodId/download` | ✅ | PDF bulletin |
| `GET /api/reports/class/:classId/:periodId` | ✅ | Rapport classe |
| `GET /api/reports/performance/:studentId` | ✅ | Performance étudiant |
| `GET /api/reports/export/:reportId` | ⚠️ | Stub — retourne `{ url: null }` |

### 1.16 Rôles & Permissions (`/api/roles`)

| Endpoint | Statut | Détail |
|---|---|---|
| `GET /api/roles` | ✅ | Liste rôles |
| `GET /api/roles/permissions` | ✅ | Liste permissions |
| `GET /api/roles/:userId` | ✅ | Rôles d'un utilisateur |
| `POST /api/roles/:userId/assign` | ✅ | Assigner rôle |
| `DELETE /api/roles/:userId/role/:roleCode` | ✅ | Retirer rôle |
| `GET /api/roles/permissions/:roleCode` | ✅ | Permissions d'un rôle |
| `POST /api/roles/permissions/assign` | ✅ | Assigner permission |
| `DELETE /api/roles/permissions/:roleCode/:permCode` | ✅ | Retirer permission |

### 1.17 Années Académiques (`/api/academics/years`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/academics/years` | ✅ | Création |
| `GET /api/academics/years` | ✅ | Liste |
| `GET /api/academics/years/:id` | ✅ | Détail |
| `PUT /api/academics/years/:id` | ✅ | Update |
| `POST /api/academics/years/:id/activate` | ✅ | Activer (set isCurrent) |
| `DELETE /api/academics/years/:id` | ✅ | Suppression |

### 1.18 Périodes/Termes (`/api/periods`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/periods` | ✅ | Création |
| `GET /api/periods` | ✅ | Liste avec filtre academicYearId |
| `GET /api/periods/:id` | ✅ | Détail |
| `PUT /api/periods/:id` | ✅ | Update |
| `DELETE /api/periods/:id` | ✅ | Suppression |

### 1.19 Utilisateurs - Management (`/api/users/manage`)

| Endpoint | Statut | Détail |
|---|---|---|
| `GET /api/users/manage` | ✅ | Liste avec filtre (search, role) |
| `POST /api/users/manage` | ✅ | Création avec hash password + rôle |
| `GET /api/users/manage/:id` | ✅ | Détail |
| `PUT /api/users/manage/:id` | ✅ | Update |
| `DELETE /api/users/manage/:id` | ✅ | Soft delete (is_active = false) |

### 1.20 Utilisateurs - Profil (`/api/users`)

| Endpoint | Statut | Détail |
|---|---|---|
| `GET /api/users/profile` | ✅ | Profil utilisateur connecté |
| `PUT /api/users/profile` | ✅ | Update profil |
| `POST /api/users/change-password` | ✅ | Changement mot de passe |

### 1.21 Guardians / Parents (`/api/guardians`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/guardians` | ✅ | Création |
| `GET /api/guardians` | ✅ | Liste |
| `GET /api/guardians/:id` | ✅ | Détail |
| `GET /api/guardians/student/:studentId` | ✅ | Parents d'un étudiant |
| `PUT /api/guardians/:id` | ✅ | Update |
| `DELETE /api/guardians/:id` | ✅ | Suppression |

### 1.22 Inscriptions (`/api/enrollments`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/enrollments` | ✅ | Création avec vérification capacité |
| `GET /api/enrollments` | ✅ | Liste avec filtres (classId, status, academicYearId) |
| `GET /api/enrollments/student/:studentId` | ✅ | Inscriptions d'un étudiant |
| `GET /api/enrollments/:id` | ✅ | Détail |
| `PUT /api/enrollments/:id/status` | ✅ | Update statut |
| `POST /api/enrollments/:id/transfer` | ✅ | Transfert de classe |
| `DELETE /api/enrollments/:id` | ✅ | Suppression |

### 1.23 Demandes d'inscription (`/api/website/enrol`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/website/enrol` | ✅ | Soumission demande |
| `GET /api/website/inquiries` | ✅ | Liste demandes |
| `PUT /api/website/inquiries/:id/status` | ✅ | Update statut |

### 1.24 Annonces (`/api/announcements`)

| Endpoint | Statut | Détail |
|---|---|---|
| `POST /api/announcements` | ✅ | Création |
| `GET /api/announcements` | ✅ | Liste |
| `GET /api/announcements/:id` | ✅ | Détail |
| `PUT /api/announcements/:id` | ✅ | Update |
| `DELETE /api/announcements/:id` | ✅ | Suppression |
| `POST /api/announcements/:id/publish` | ✅ | Publier |
| `POST /api/announcements/:id/unpublish` | ✅ | Dépublier |

### 1.25 Notifications (`/api/notifications`)

| Endpoint | Statut | Détail |
|---|---|---|
| `GET /api/notifications` | ✅ | Liste |
| `PUT /api/notifications/:id/read` | ✅ | Marquer comme lu |
| `DELETE /api/notifications/:id` | ✅ | Suppression |
| `GET /api/notifications/unread/count` | ✅ | Compte non-lus |
| `POST /api/notifications/send` | ✅ | Envoi |

---

## 2. Endpoints ⚠️ disponibles mais frontend encore sur mock

| Modules | Endpoints mock encore utilisés | Pages concernées | Solution |
|---|---|---|---|
| **Assignations prof-matière-classe** | `/teacherAssignments` (mock) → API réelle `/api/subject-teachers` | **UsersListPage** | ✅ DÉJÀ MIGRÉ (cette session) |
| **Liste utilisateurs** | `buildMockUsers()` (données mockées) | **UsersListPage** | ❌ Pas encore migré — utilise toujours des fausses données |

**Détail UsersListPage :** La page affiche 20 utilisateurs factices générés par `buildMockUsers()` au lieu d'appeler `getUsers()` de l'API réelle. Il faut migrer.

---

## 3. Endpoints ❌ MANQUANTS (backend à créer)

### 3.1 Niveaux (Levels) — `/api/levels`

**Pourquoi c'est nécessaire :** Les niveaux (System Levels) sont la base de la structure éducative camerounaise :
- Système Anglophone : Form 1 → Form 5, Lower Sixth, Upper Sixth
- Système Francophone : 6è → 3è, Seconde → Terminale
- Technique : équivalents techniques des niveaux ci-dessus
- Université : Licence 1 → 3, Master 1 → 2, Doctorat

Ils sont utilisés par : **LevelsListPage**, **CreateClassPage**, **ClassDetailPage**

**Ce qu'il manque :**
| Élément | Détail |
|---|---|
| Table DB | Aucune — rien dans les migrations |
| Service | `level.service.js` à créer |
| Controller | `level.controller.js` à créer |
| Routes | 5 routes (CRUD + listBySystem) |
| Frontend service | `levelService.js` à créer |

### 3.2 Séries (Series) — `/api/series`

**Pourquoi c'est nécessaire :** Les séries définissent les spécialités par système :
- Anglophone : Arts (A1-A8), Sciences (S1-S4)
- Francophone : A (Lettres), C (Math-Phys), D (Math-SVT), E (Math-Tech), TI, B (SES)
- Technique : Filières industrielles, tertiaires

Utilisées par : **SeriesManagementPage**, **CreateClassPage**, **ClassDetailPage**

**Ce qu'il manque :**
| Élément | Détail |
|---|---|
| Table DB | Aucune |
| Service | `series.service.js` à créer |
| Controller | `series.controller.js` à créer |
| Routes | 5 routes (CRUD + listBySystem) |
| Frontend service | `seriesService.js` à créer |

### 3.3 Séquences (Sequences) — `/api/sequences`

**Pourquoi c'est nécessaire :** Les séquences sont les sous-périodes de notation :
- Système francophone : 3 séquences par trimestre (ou 6 par an)
- Système anglophone : 2-3 terms par an

Les séquences existent déjà conceptuellement dans les périodes (`type: 'sequence'`) mais il n'y a pas de service/routes dédiées.

Utilisées par : **SequencesPage**

**Ce qu'il manque :**
| Élément | Détail |
|---|---|
| Routes | À créer sous `/api/sequences` OU à ajouter sous `/api/academics` |
| Service | `sequence.service.js` à créer |
| Controller | `sequence.controller.js` à créer |
| Frontend service | `sequenceService.js` à créer |

**Alternative :** On pourrait étendre `/api/periods` avec un `type=sequence` au lieu de créer un module séparé.

### 3.4 Relations Niveaux ↔ Systèmes Éducatifs

**Pourquoi c'est nécessaire :** Chaque système éducatif (Anglophone General, Francophone General, Anglophone Technical, Francophone Technical, University) a ses propres niveaux, séries et examens. Actuellement, ces mappings sont codés en dur dans le frontend (dans `Sidebar.jsx`, `SYSTEM_SPECIFIC_ITEMS`).

**Ce qu'il manque :**
| Élément | Détail |
|---|---|
| Table `educational_system_levels` | Lier les niveaux à leur système |
| Table `educational_system_series` | Lier les séries à leur système |
| API endpoint | `GET /api/systems/:id/levels`, `GET /api/systems/:id/series` |

---

## 4. Pages frontend qui utilisent encore le mock server

| Page | Endpoints mock | Migration possible ? |
|---|---|---|
| **UsersListPage** | `buildMockUsers()` + `/classes` + `/teacherAssignments` | ⚠️ Migrer `getUsers()` de l'API — `/classes` ✅ migré, `/teacherAssignments` ✅ migré cette session |
| **SequencesPage** | `/sequences` | ❌ Bloqué — pas d'API séquence |
| **CreateClassPage** | `/classes` + `/systemLevels` + `/systemSeries` | ⚠️ `/classes` ✅ → migrer, `/systemLevels` ❌, `/systemSeries` ❌ |
| **ClassDetailPage** | `/classes` + `/systemLevels` + `/systemSeries` + `/teachers` + `/students` + `/teacherAssignments` | ⚠️ `/classes` ✅, `/students` ✅, `/teachers` → `getUsers({role:'teacher'})` ✅, mais `/systemLevels` ❌, `/systemSeries` ❌ |
| **SeriesManagementPage** | `/systemSeries` | ❌ Bloqué |
| **LevelsListPage** | `/systemLevels` | ❌ Bloqué |

---

## 5. Résumé exécutif

### Ce qui est VRAIMENT prêt ✅

**22 modules backend** avec code de production (services + controllers + routes + validateurs + migrations) :
Auth, Écoles, Dashboard, Étudiants, Classes, Matières, Notes + Calculs, Présence + Stats, Frais + Calculs, Paiements, Examens, Rapports/Bulletins (PDF), Rôles/Permissions, Années académiques, Périodes, Utilisateurs (management + profil), Guardians, Inscriptions, Demandes d'inscription, Annonces, Notifications.

### Ce qui a été migré cette session du mock vers l'API réelle ⚡

| Page | Avant | Après |
|---|---|---|
| **AcademicYearsPage** | `fetch(MOCK_API/academicYears)` | `getAcademicYears()`, `createAcademicYear()`, `activateAcademicYear()` |
| **PeriodsPage** | `fetch(MOCK_API/periods)` | `getTerms()`, `createTerm()`, `updateTerm()`, `deleteTerm()` |
| **ClassesChildrenSection** | `fetch(MOCK_API/classes)` | `getClasses()` |
| **UsersListPage** | `fetch(MOCK_API/classes + teacherAssignments)` | `getClasses()`, `getSubjectTeacherAssignments()`, `assignTeacherToSubject()`, `removeTeacherAssignment()` |

### Ce qu'il reste à faire ❌

**Priorité haute :**
1. **Créer l'API Niveaux** (Levels) — table DB + service + controller + routes + frontend service
2. **Créer l'API Séries** (Series) — table DB + service + controller + routes + frontend service
3. **Créer l'API Séquences** — soit module dédié, soit extension des périodes

**Priorité moyenne :**
4. **Migrer UsersListPage** de `buildMockUsers()` vers `getUsers()` de l'API réelle
5. **Migrer CreateClassPage** — `/classes` vers API + fallback mock pour levels/series
6. **Migrer ClassDetailPage** — `/classes`, `/students`, `/teachers` vers API + fallback pour levels/series
7. **Finaliser `exportReport`** dans `report.service.js` (actuellement stub)

**Priorité basse :**
8. **Tests** — 0 tests actuellement
9. **Seeds** — dossier vide
10. **Notifications push** en temps réel (actuellement polling/CRUD basique)
