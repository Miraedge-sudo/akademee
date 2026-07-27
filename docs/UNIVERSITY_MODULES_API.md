# University Modules — API Specification

> **Version :** 1.0  
> **Statut :** À implémenter (backend à créer)  
> **Préfixe des routes :** `/api/v1/university`  
> **Authentification :** `Authorization: Bearer <jwt>` + `X-School-Subdomain: <subdomain>`

Ce document spécifie les API REST nécessaires aux modules **Programmes LMD**, **Facultés**, **Départements**, **Projets de Recherche** et **Publications** pour le système d'enseignement supérieur (University).

---

## Conventions générales

- Toutes les routes sont **tenant-scoped** : les données sont filtrées par `school_id` extrait du token JWT ou du header `X-School-Subdomain`.
- Seul le rôle **ADMIN** peut créer, modifier ou supprimer des entrées. Les rôles **TEACHER** et **STUDENT** ont un accès en lecture uniquement.
- **Format de réponse uniforme** :

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* ... */ }
}
```

- **Erreurs :**

```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "name", "message": "Name is required" }]
}
```

---

## 1. Facultés (Faculties)

### Description

Gère les facultés d'une université (ex: Faculté des Sciences, Faculté des Arts, Faculté de Médecine).

### Table proposée : `faculties`

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, généré automatiquement | Identifiant unique |
| `school_id` | UUID | FK → `schools.id`, NOT NULL | Établissement tenant |
| `name` | VARCHAR(255) | NOT NULL | Nom de la faculté (ex: "Faculty of Science") |
| `name_fr` | VARCHAR(255) | NULL | Nom en français (ex: "Faculté des Sciences") |
| `code` | VARCHAR(20) | UNIQUE, NOT NULL | Code court (ex: "FS", "FA", "FM") |
| `dean_name` | VARCHAR(255) | NULL | Nom du doyen/doyenne |
| `description` | TEXT | NULL | Brève description |
| `phone` | VARCHAR(50) | NULL | Téléphone du secrétariat |
| `email` | VARCHAR(255) | NULL | Email de la faculté |
| `building` | VARCHAR(255) | NULL | Bâtiment / localisation |
| `established_year` | INTEGER | NULL | Année de création |
| `is_active` | BOOLEAN | DEFAULT true | Actif ou désactivé |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | |

### Endpoints

| Méthode | Endpoint | Rôles | Description |
|---------|----------|-------|-------------|
| `GET` | `/api/v1/university/faculties` | admin, teacher, student, parent | Lister les facultés |
| `GET` | `/api/v1/university/faculties/:id` | admin, teacher, student, parent | Détail d'une faculté |
| `POST` | `/api/v1/university/faculties` | admin | Créer une faculté |
| `PUT` | `/api/v1/university/faculties/:id` | admin | Modifier une faculté |
| `DELETE` | `/api/v1/university/faculties/:id` | admin | Supprimer une faculté (soft delete ou vérifier dépendances) |

### Exemples

#### POST — Créer une faculté

```http
POST /api/v1/university/faculties
Authorization: Bearer <token>
X-School-Subdomain: univ-dschang
Content-Type: application/json

{
  "name": "Faculty of Science",
  "name_fr": "Faculté des Sciences",
  "code": "FS",
  "dean_name": "Prof. Jean Mbarga",
  "description": "Faculty of pure and applied sciences",
  "phone": "+237 6XX XXX XXX",
  "email": "fs@univ-dschang.cm",
  "building": "Building A, Campus 1",
  "established_year": 1993
}
```

#### GET — Liste des facultés

```http
GET /api/v1/university/faculties?search=science&is_active=true
```

**Réponse :**

```json
{
  "success": true,
  "message": "Faculties retrieved",
  "data": [
    {
      "id": "uuid-1",
      "name": "Faculty of Science",
      "name_fr": "Faculté des Sciences",
      "code": "FS",
      "dean_name": "Prof. Jean Mbarga",
      "description": "Faculty of pure and applied sciences",
      "phone": "+237 6XX XXX XXX",
      "email": "fs@univ-dschang.cm",
      "building": "Building A, Campus 1",
      "established_year": 1993,
      "is_active": true,
      "departments_count": 5,
      "programs_count": 8,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

## 2. Départements (Departments)

### Description

Départements appartenant à une faculté (ex: Département de Mathématiques, Département d'Informatique).

### Table proposée : `departments`

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `school_id` | UUID | FK → `schools.id`, NOT NULL | Établissement tenant |
| `faculty_id` | UUID | FK → `faculties.id`, NOT NULL | Faculté de rattachement |
| `name` | VARCHAR(255) | NOT NULL | Nom du département |
| `name_fr` | VARCHAR(255) | NULL | Nom en français |
| `code` | VARCHAR(20) | UNIQUE, NOT NULL | Code court (ex: "MATH", "INFO") |
| `head_name` | VARCHAR(255) | NULL | Nom du chef de département |
| `description` | TEXT | NULL | Description |
| `phone` | VARCHAR(50) | NULL | Téléphone |
| `email` | VARCHAR(255) | NULL | Email |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | |

### Endpoints

| Méthode | Endpoint | Rôles | Description |
|---------|----------|-------|-------------|
| `GET` | `/api/v1/university/departments` | admin, teacher, student | Lister (`?faculty_id=`) |
| `GET` | `/api/v1/university/departments/:id` | admin, teacher, student | Détail |
| `POST` | `/api/v1/university/departments` | admin | Créer |
| `PUT` | `/api/v1/university/departments/:id` | admin | Modifier |
| `DELETE` | `/api/v1/university/departments/:id` | admin | Supprimer |

### Règles métier

- `faculty_id` est obligatoire (un département doit appartenir à une faculté).
- `school_id` peut être déduit du `faculty_id` (via jointure) — le backend doit le valider.

### Exemple POST

```http
POST /api/v1/university/departments

{
  "faculty_id": "uuid-fs",
  "name": "Department of Mathematics",
  "name_fr": "Département de Mathématiques",
  "code": "MATH",
  "head_name": "Dr. Alice Ngo",
  "description": "Pure and applied mathematics",
  "phone": "+237 6XX XXX XXX",
  "email": "math@univ-dschang.cm"
}
```

---

## 3. Programmes LMD (Programs — Licence / Master / Doctorat)

### Description

Cycles et programmes de l'enseignement supérieur (LMD : Licence, Master, Doctorat). Chaque programme est rattaché à un département.

### Table proposée : `programs`

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `school_id` | UUID | FK → `schools.id`, NOT NULL | Établissement tenant |
| `department_id` | UUID | FK → `departments.id`, NULL | Département responsable (optionnel si transversal) |
| `faculty_id` | UUID | FK → `faculties.id`, NULL | Faculté (redondance utile pour les requêtes) |
| `name` | VARCHAR(255) | NOT NULL | Nom du programme |
| `name_fr` | VARCHAR(255) | NULL | Nom en français |
| `code` | VARCHAR(20) | NOT NULL | Code (ex: "L-MATH", "M-INFO", "D-PHYS") |
| `cycle` | ENUM('LICENCE', 'MASTER', 'DOCTORATE') | NOT NULL | Cycle LMD |
| `duration_years` | INTEGER | NOT NULL | Durée en années (3, 2, 3) |
| `credits_total` | INTEGER | NULL | Total crédits ECTS |
| `description` | TEXT | NULL | Description du programme |
| `admission_requirements` | TEXT | NULL | Conditions d'admission |
| `career_opportunities` | TEXT | NULL | Débouchés professionnels |
| `language` | ENUM('FR', 'EN', 'BILINGUAL') | DEFAULT 'FR' | Langue d'enseignement |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | |

### Endpoints

| Méthode | Endpoint | Rôles | Description |
|---------|----------|-------|-------------|
| `GET` | `/api/v1/university/programs` | admin, teacher, student | Lister (`?cycle=LICENCE&department_id=&faculty_id=&search=`) |
| `GET` | `/api/v1/university/programs/:id` | admin, teacher, student | Détail |
| `POST` | `/api/v1/university/programs` | admin | Créer |
| `PUT` | `/api/v1/university/programs/:id` | admin | Modifier |
| `DELETE` | `/api/v1/university/programs/:id` | admin | Supprimer |

### Exemple POST — Licence

```http
POST /api/v1/university/programs

{
  "department_id": "uuid-math",
  "faculty_id": "uuid-fs",
  "name": "Bachelor in Mathematics",
  "name_fr": "Licence en Mathématiques",
  "code": "L-MATH",
  "cycle": "LICENCE",
  "duration_years": 3,
  "credits_total": 180,
  "description": "Undergraduate program in pure and applied mathematics",
  "admission_requirements": "Baccalaureat C or D with strong math background",
  "career_opportunities": "Data analyst, teacher, research assistant",
  "language": "FR"
}
```

### Exemple POST — Master

```json
{
  "department_id": "uuid-math",
  "faculty_id": "uuid-fs",
  "name": "Master in Applied Mathematics",
  "name_fr": "Master en Mathématiques Appliquées",
  "code": "M-MATH-APP",
  "cycle": "MASTER",
  "duration_years": 2,
  "credits_total": 120,
  "language": "EN"
}
```

### Exemple POST — Doctorat

```json
{
  "department_id": "uuid-math",
  "faculty_id": "uuid-fs",
  "name": "PhD in Mathematics",
  "name_fr": "Doctorat en Mathématiques",
  "code": "D-MATH",
  "cycle": "DOCTORATE",
  "duration_years": 3,
  "credits_total": 180,
  "language": "BILINGUAL"
}
```

---

## 4. Projets de Recherche (Research Projects)

### Description

Projets de recherche menés par les enseignants-chercheurs. Liés à un département (ou une faculté) et optionnellement à un programme.

### Table proposée : `research_projects`

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | |
| `school_id` | UUID | FK → `schools.id`, NOT NULL | |
| `department_id` | UUID | FK → `departments.id`, NULL | Département porteur |
| `faculty_id` | UUID | FK → `faculties.id`, NULL | Faculté |
| `title` | VARCHAR(500) | NOT NULL | Titre du projet |
| `title_fr` | VARCHAR(500) | NULL | Titre en français |
| `slug` | VARCHAR(255) | UNIQUE | Slug généré automatiquement |
| `status` | ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED') | DEFAULT 'PLANNED' | Statut |
| `start_date` | DATE | NULL | Date de début |
| `end_date` | DATE | NULL | Date de fin prévue |
| `funding_source` | VARCHAR(500) | NULL | Source de financement |
| `budget` | DECIMAL(15,2) | NULL | Budget |
| `principal_investigator` | VARCHAR(255) | NULL | Chercheur principal |
| `investigators` | JSONB/TEXT[] | NULL | Liste des chercheurs associés |
| `summary` | TEXT | NULL | Résumé |
| `keywords` | TEXT[] | NULL | Mots-clés |
| `is_published` | BOOLEAN | DEFAULT false | Visible sur le site public |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | |

### Endpoints

| Méthode | Endpoint | Rôles | Description |
|---------|----------|-------|-------------|
| `GET` | `/api/v1/university/research` | admin, teacher, student, parent | Lister (`?status=&department_id=&faculty_id=&search=`) |
| `GET` | `/api/v1/university/research/:id` | admin, teacher, student, parent | Détail |
| `POST` | `/api/v1/university/research` | admin | Créer |
| `PUT` | `/api/v1/university/research/:id` | admin | Modifier |
| `DELETE` | `/api/v1/university/research/:id` | admin | Supprimer |
| `GET` | `/api/v1/university/research/public` | PUBLIC (no auth) | Projets publiés pour le site vitrine |

### Exemple POST

```http
POST /api/v1/university/research

{
  "department_id": "uuid-math",
  "title": "Mathematical Modeling of Epidemics in Sub-Saharan Africa",
  "title_fr": "Modélisation mathématique des épidémies en Afrique subsaharienne",
  "status": "IN_PROGRESS",
  "start_date": "2025-01-01",
  "end_date": "2027-12-31",
  "funding_source": "Cameroon Ministry of Higher Education",
  "budget": 50000000,
  "principal_investigator": "Prof. Jean Mbarga",
  "investigators": ["Dr. Alice Ngo", "Dr. Paul Biya"],
  "summary": "This project develops mathematical models...",
  "keywords": ["epidemiology", "mathematical modeling", "public health"],
  "is_published": true
}
```

---

## 5. Publications (Publications)

### Description

Articles scientifiques, revues, thèses, papiers de conférence. Liés à un projet de recherche (optionnel).

### Table proposée : `publications`

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | |
| `school_id` | UUID | FK → `schools.id`, NOT NULL | |
| `research_project_id` | UUID | FK → `research_projects.id`, NULL | Projet lié |
| `department_id` | UUID | FK → `departments.id`, NULL | |
| `faculty_id` | UUID | FK → `faculties.id`, NULL | |
| `title` | VARCHAR(500) | NOT NULL | Titre |
| `title_fr` | VARCHAR(500) | NULL | Titre en français |
| `type` | ENUM('JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'THESIS', 'BOOK', 'BOOK_CHAPTER', 'REPORT', 'OTHER') | NOT NULL | Type |
| `authors` | TEXT[] | NOT NULL | Liste des auteurs |
| `journal_name` | VARCHAR(500) | NULL | Nom de la revue |
| `publisher` | VARCHAR(255) | NULL | Éditeur |
| `doi` | VARCHAR(255) | NULL | DOI (Digital Object Identifier) |
| `issn` | VARCHAR(20) | NULL | ISSN |
| `isbn` | VARCHAR(20) | NULL | ISBN (pour livres) |
| `publication_date` | DATE | NULL | Date de publication |
| `volume` | VARCHAR(50) | NULL | Volume |
| `issue` | VARCHAR(50) | NULL | Numéro |
| `pages` | VARCHAR(50) | NULL | Pages (ex: "45-67") |
| `abstract` | TEXT | NULL | Résumé |
| `keywords` | TEXT[] | NULL | Mots-clés |
| `url` | VARCHAR(500) | NULL | Lien vers l'article |
| `citation` | TEXT | NULL | Citation formatée (auto-générée possible) |
| `is_published` | BOOLEAN | DEFAULT false | Visible sur le site public |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | |

### Endpoints

| Méthode | Endpoint | Rôles | Description |
|---------|----------|-------|-------------|
| `GET` | `/api/v1/university/publications` | admin, teacher, student | Lister (`?type=&department_id=&research_project_id=&search=&year=`) |
| `GET` | `/api/v1/university/publications/:id` | admin, teacher, student | Détail |
| `POST` | `/api/v1/university/publications` | admin | Créer |
| `PUT` | `/api/v1/university/publications/:id` | admin | Modifier |
| `DELETE` | `/api/v1/university/publications/:id` | admin | Supprimer |
| `GET` | `/api/v1/university/publications/public` | PUBLIC | Publications publiées pour le site vitrine |

### Exemple POST

```http
POST /api/v1/university/publications

{
  "research_project_id": "uuid-projet-1",
  "department_id": "uuid-math",
  "title": "An SIR Model with Vaccination for Epidemic Control",
  "type": "JOURNAL_ARTICLE",
  "authors": ["Mbarga, J.", "Ngo, A.", "Biya, P."],
  "journal_name": "Journal of Applied Mathematics",
  "publisher": "Springer",
  "doi": "10.1000/xyz123",
  "issn": "1234-5678",
  "publication_date": "2026-03-15",
  "volume": "42",
  "issue": "3",
  "pages": "245-267",
  "abstract": "We propose a mathematical model for epidemic control...",
  "keywords": ["SIR model", "vaccination", "epidemic control"],
  "url": "https://doi.org/10.1000/xyz123",
  "is_published": true
}
```

---

## 6. Relations entre entités

```
School
  ├── Faculties
  │     ├── Departments
  │     │     ├── Programs (Licence / Master / Doctorat)
  │     │     └── ResearchProjects
  │     │           └── Publications
  │     └── ResearchProjects (direct, si transversal)
  └── ...
```

- Un **Département** appartient à une **Faculté** (et à une seule).
- Un **Programme** appartient à un **Département** (optionnellement une Faculté aussi pour filtrage facile).
- Un **Projet de Recherche** peut être lié à un Département.
- Une **Publication** peut être liée à un Projet de Recherche.

---

## 7. Requêtes transverses utiles

### Dashboard d'une faculté

`GET /api/v1/university/faculties/:id/stats`

```json
{
  "faculty_id": "uuid",
  "faculty_name": "Faculty of Science",
  "departments_count": 5,
  "programs_count": 8,
  "programs_by_cycle": { "LICENCE": 4, "MASTER": 3, "DOCTORATE": 1 },
  "active_research_projects": 12,
  "publications_count": 45,
  "publications_this_year": 8
}
```

### Programmes par faculté

`GET /api/v1/university/faculties/:id/programs?cycle=MASTER`

---

## 8. Notes pour le backend

1. **Tenant isolation** : Toutes les requêtes doivent filtrer par `school_id`. Ce champ est extrait du token JWT ou du header `X-School-Subdomain`.
2. **Soft delete ou vérification de dépendances** : Avant de supprimer une faculté, vérifier qu'aucun département ne lui est rattaché. Si soft delete, ajouter un champ `deleted_at`.
3. **Génération de `slug`** : Pour les programmes et projets de recherche, un slug unique devrait être généré automatiquement à partir du nom.
4. **Pagination** : Tous les `GET` de liste doivent supporter `?page=&limit=20&search=` et retourner un objet pagination.
5. **Enum `cycle`** : Les valeurs sont `LICENCE`, `MASTER`, `DOCTORATE`. Utiliser une ENUM PostgreSQL ou un VARCHAR avec validation.
6. **JSONB vs table relationnelle** : Pour les `investigators` (chercheurs) et `authors` (auteurs), un simple `TEXT[]` est suffisant en V1. On pourra normaliser en tables séparées plus tard si besoin.
7. **Site vitrine public** : Les endpoints `GET .../public` ne nécessitent **pas d'auth** et ne retournent que les entrées marquées `is_published = true`.

---

## 9. Résumé des endpoints

| Module | Endpoint | Méthodes |
|--------|----------|----------|
| **Facultés** | `/api/v1/university/faculties` | GET, POST |
| | `/api/v1/university/faculties/:id` | GET, PUT, DELETE |
| | `/api/v1/university/faculties/:id/stats` | GET |
| | `/api/v1/university/faculties/:id/programs` | GET |
| **Départements** | `/api/v1/university/departments` | GET, POST |
| | `/api/v1/university/departments/:id` | GET, PUT, DELETE |
| **Programmes** | `/api/v1/university/programs` | GET, POST |
| | `/api/v1/university/programs/:id` | GET, PUT, DELETE |
| **Recherche** | `/api/v1/university/research` | GET, POST |
| | `/api/v1/university/research/:id` | GET, PUT, DELETE |
| | `/api/v1/university/research/public` | GET |
| **Publications** | `/api/v1/university/publications` | GET, POST |
| | `/api/v1/university/publications/:id` | GET, PUT, DELETE |
| | `/api/v1/university/publications/public` | GET |
