# AKADEMEE — Guide de Test : Système Universitaire LMD (Document 5/6)

> **Prérequis** : avoir lu et exécuté le **Document 0 — Mise en place commune** (`docs/TESTING_FLOWS_00_COMMUN.md`).
> Ce document couvre les flows **spécifiques au système Université** (code Akademee : `university` / `UNIV`), c'est-à-dire le **module LMD** : Facultés, Départements, Programmes (Licence/Master/Doctorat), Projets de Recherche et Publications — API sous `/api/v1/university`.

---

## 1. Contexte éducatif réel (pour bien tester)

Le système universitaire camerounais (tutelle **MINESUP**) suit le modèle **LMD** (Licence – Master – Doctorat). **Parcours type :**

```
Baccalauréat
   ↓
LICENCE (Bac+3, 180 crédits ECTS) — 6 semestres
   ↓
MASTER (Bac+5, 120 crédits ECTS) — 4 semestres
   ↓
DOCTORAT (Bac+8, 180 crédits ECTS) — 6 semestres
```

**Points d'attention pour le testeur :**
- **Organisation** : une **Université** est structurée en **Facultés** (ex : Faculté des Sciences), elles-mêmes composées de **Départements** (ex : Département d'Informatique). Les **Programmes LMD** sont portés par un département (et rattachés à une faculté).
- **Année universitaire** : octobre → juillet, découpée en **2 semestres** (Akademee : générer des périodes « semestre » pour ce système).
- **Cycles** : `LICENCE`, `MASTER`, `DOCTORATE` — durée 3/2/3 ans, crédits ECTS 180/120/180.
- **Langues d'enseignement** : `FR`, `EN`, `BILINGUAL`.
- **Recherche** : les enseignants-chercheurs mènent des **Projets de Recherche** (statuts : planifié, en cours, terminé, en pause, annulé) qui produisent des **Publications** (articles, thèses, ouvrages…).
- **Site vitrine** : les projets et publications marqués *publiés* (`is_published = true`) sont destinés à être visibles sur le site public de l'établissement.

---

## 2. Ce qu'Akademee implémente pour ce système

| Élément | Valeur Akademee |
|---------|-----------------|
| Code système | `UNIV` (`university`) |
| Préfixe API | `/api/v1/university` |
| Entités | `faculties`, `departments`, `programs`, `research_projects`, `publications` |
| Hiérarchie de périodes | 2 **semestres** par année universitaire |
| Cycle (programmes) | `LICENCE` / `MASTER` / `DOCTORATE` |
| Langue (programmes) | `FR` / `EN` / `BILINGUAL` |
| Statut (projets de recherche) | `PLANNED` / `IN_PROGRESS` / `COMPLETED` / `ON_HOLD` / `CANCELLED` |
| Type (publications) | `JOURNAL_ARTICLE` / `CONFERENCE_PAPER` / `THESIS` / `BOOK` / `BOOK_CHAPTER` / `REPORT` / `OTHER` |
| Droits | Lecture : tous rôles authentifiés ; **écriture : ADMIN uniquement** ; endpoints `/public` sans authentification |
| Isolation | Par établissement (`school_id` via JWT ou sous-domaine / header `X-School-Subdomain`) |
| Traçabilité | Toutes les écritures passent par le journal d'audit (visibles dans les « Activités récentes » du dashboard) |

### Règles métier clés

- **Code unique par école** : faculté, département et programme (index `(school_id, code)`).
- **Slug unique par école** : généré automatiquement pour les projets de recherche (ex : `mathematical-modeling-epidemics`, suffixe `-2`, `-3`… si conflit).
- **Suppression protégée** :
  - une **faculté** qui contient des départements → refus (`409 Cannot delete faculty: X department(s) still reference it`) ;
  - un **département** qui contient des programmes → refus (`409`) ;
  - un **projet de recherche** supprimé → les publications liées sont **conservées** (`research_project_id` remis à NULL), pas de suppression en cascade.
- **Pagination** : toutes les listes supportent `?page=&limit=` (défaut 20, max 100) + recherche `search` (ILIKE) + filtres dédiés.

---

## 3. Ordre des flows spécifiques

```
U-1  Configuration initiale (activation du système, année universitaire, semestres)
U-2  Facultés (CRUD)
U-3  Départements (CRUD, rattachement faculté)
U-4  Programmes LMD (CRUD, cycles, langues)
U-5  Détail faculté : stats & programmes par cycle (page /dashboard/faculties/:id)
U-6  Projets de recherche (CRUD, statuts, publication)
U-7  Publications (CRUD, types, lien projet)
U-8  Sécurité, rôles & tenant (lecture/write, isolation, audit)
U-9  Endpoints publics (vitrine)
```

---

## 4. Flow U-1 — Configuration initiale

### U-1.1 Activation du système « University »
- **Où** : `/educational-system-selection` (ou étape 4 de l'onboarding)
- **Étapes** : activer le système **University LMD** (seul ou avec d'autres systèmes).
- **Vérifications** :
  - ✅ Le badge/menu **University** apparaît dans la sidebar.
  - ✅ Les entrées **« LMD Programs »**, **« Faculties & Departments »** et **« Research & Publications »** sont visibles (groupe université).
  - ✅ Si le système n'est **pas** activé, ces entrées n'apparaissent pas.

### U-1.2 Année universitaire & semestres
- **Où** : `/dashboard/academic-years`, `/dashboard/periods`
- **Étapes** : créer l'année (ex : 2026-2027) et générer **2 semestres** (Semestre 1, Semestre 2) avec dates cohérentes.
- **Vérifications** :
  - ✅ L'année est activable comme année courante.
  - ✅ Les périodes « semestre » sont créées pour le système université.
  - ⚠️ Les listes (facultés, programmes…) ne sont pas liées à l'année (structure « fixe ») — seul le paramétrage financier/notes l'est : c'est le comportement attendu pour l'instant.

---

## 5. Flow U-2 — Facultés

- **Où** : `/dashboard/faculties` (liste + CRUD)
- **Objectif** : créer les facultés de l'université (ex : Faculté des Sciences, Faculté des Arts).

**Étapes :**
1. Créer une faculté : **nom (EN)** (ex : *Faculty of Science*), **nom (FR)** (ex : *Faculté des Sciences*), **code** (ex : `FS`), doyen, email, téléphone, bâtiment, année de création, actif.
2. Modifier / supprimer / rechercher / paginer.

**Vérifications :**
- ✅ **CRUD complet** ; pagination (20/page) et recherche par nom/code/doyen fonctionnelles.
- ✅ Le tableau affiche : nom (+ `nameFr`), code, doyen, **nb départements**, **nb programmes**, statut actif/inactif.
- ✅ Dans le formulaire, les champs sont correctement libellés : `name` = **Nom (EN)** / **Name (EN)**, `name_fr` = **Nom (FR)** / **Name (FR)** (pas de libellés inversés).
- ❌ Code déjà utilisé dans la même école → erreur (unicité par école).
- ❌ Suppression d'une faculté **ayant des départements** → refus `409` avec message explicite affiché en toast.
- ❌ Création/modification/suppression avec un rôle **non-admin** (enseignant, comptable…) → `403`.

**API** : `GET|POST /api/v1/university/faculties`, `GET|PUT|DELETE /api/v1/university/faculties/:id`.

**Exemple POST :**
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
  "building": "Bâtiment A",
  "established_year": 1993
}
```

---

## 6. Flow U-3 — Départements

- **Où** : `/dashboard/departments` (liste + CRUD, filtre par faculté)
- **Objectif** : créer les départements **rattachés à une faculté** (ex : Département de Mathématiques).

**Vérifications :**
- ✅ **`faculty_id` obligatoire** à la création (le sélecteur de faculté est requis — bouton « Ajouter » désactivé s'il n'existe aucune faculté).
- ✅ **Filtre par faculté** dans la barre de filtres (liste rechargée avec `?faculty_id=`).
- ✅ Le tableau affiche : nom (+ `nameFr`), faculté (`facultyName`), chef (`headName`), nb programmes, statut.
- ❌ Code de département déjà utilisé (même école) → erreur.
- ❌ Suppression d'un département **ayant des programmes** → refus `409`.
- ❌ `faculty_id` inconnu / d'une autre école → `404 Faculty not found`.

**API** : `GET|POST /api/v1/university/departments`, `GET|PUT|DELETE /api/v1/university/departments/:id`, liste filtrable par `?faculty_id=`.

---

## 7. Flow U-4 — Programmes LMD

- **Où** : `/dashboard/programs/licence` | `/dashboard/programs/master` | `/dashboard/programs/doctorate`
- **Objectif** : créer les programmes par **cycle** (la page pré-filtre sur le cycle).

**Étapes :**
1. Créer un programme : nom (EN), nom (FR), **code**, **cycle** (`LICENCE`/`MASTER`/`DOCTORATE`), **durée (1-10 ans)**, crédits ECTS, **langue**, faculté (optionnel), département (optionnel), statut actif.
2. Filtrer par cycle / faculté / département ; rechercher ; paginer ; modifier / supprimer.

**Vérifications :**
- ✅ Les pages `licence` / `master` / `doctorate` **pré-filtrent** par cycle (le badge de cycle est correct, le filtre cycle est pré-sélectionné).
- ✅ Le formulaire : `name` = **Nom (EN)**, `name_fr` = **Nom (FR)** (libellés corrects).
- ✅ Le tableau affiche : nom + code, **cycle** (badge coloré Licence/Master/Doctorat), département (ou « fac. »), durée, crédits, langue.
- ❌ Cycle invalide (ex : `BTS`) → validation bloquée.
- ❌ Durée hors 1-10 → validation bloquée.
- ❌ Changement de faculté dans le formulaire → le sélecteur de département se **vide** (dépendance correcte) et se recharge avec les départements de la nouvelle faculté.
- ✅ Un programme peut être créé **sans** faculté ni département (transversal) — `null` accepté.

**API** : `GET|POST /api/v1/university/programs`, `GET|PUT|DELETE /api/v1/university/programs/:id` ; filtres `?cycle=&faculty_id=&department_id=&search=`.

---

## 8. Flow U-5 — Détail faculté : stats & programmes (page dédiée)

- **Où** : `/dashboard/faculties/:id` (accès via le **nom cliquable** ou le **bouton œil 👁** dans la liste des facultés)
- **Objectif** : consulter le **dashboard de la faculté** alimenté par `GET /faculties/:id/stats` et `GET /faculties/:id/programs`.

**Étapes :**
1. Depuis `/dashboard/faculties`, ouvrir la fiche d'une faculté.
2. Vérifier les 5 cartes de stats + la répartition par cycle.
3. Filtrer les programmes par cycle, paginer.
4. Vérifier la liste des départements rattachés.

**Vérifications (avec des valeurs connues) :**

> Scénario de référence : 1 faculté « FS », 2 départements, 3 programmes (1 LICENCE, 1 MASTER, 1 DOCTORATE), 1 projet de recherche `IN_PROGRESS`, 2 publications dont 1 publiée cette année.

| Carte | Valeur attendue |
|-------|-----------------|
| Départements | 2 |
| Programmes | 3 |
| Projets de recherche actifs | 1 (seuls `PLANNED`/`IN_PROGRESS`/`ON_HOLD` comptent) |
| Publications | 2 |
| Publications cette année | 1 |

- ✅ La **répartition par cycle** affiche Licence 1, Master 1, Doctorat 1 (barres proportionnelles, total 3).
- ✅ Le **filtre cycle** du tableau des programmes fonctionne (ex : « MASTER » → 1 ligne) et se **réinitialise à « Tous les cycles »** possible.
- ✅ La **pagination** fonctionne (10/page) ; le compteur de résultats est cohérent.
- ✅ La liste des départements correspond aux départements créés (nom, code, chef, nb programmes).
- ❌ Faculté inexistante (`/dashboard/faculties/00000000-0000-0000-0000-000000000000`) → écran **« Faculté introuvable »** avec lien retour.
- ⚠️ **Note API** : la réponse de `/stats` utilise du camelCase (`programsByCycle`, `activeResearchProjects`, `publicationsThisYear`, …) — c'est **cette forme** que le frontend consomme (la spec initiale prévoyait du snake_case ; l'écart est documenté).

**API** : `GET /api/v1/university/faculties/:id/stats`, `GET /api/v1/university/faculties/:id/programs?cycle=MASTER&page=1&limit=10`.

---

## 9. Flow U-6 — Projets de recherche

- **Où** : `/dashboard/research`
- **Objectif** : gérer les projets des enseignants-chercheurs (titre, statut, dates, financement, budget, chercheurs, mots-clés, visibilité).

**Vérifications :**
- ✅ **CRUD complet** ; le titre est obligatoire.
- ✅ **Statuts** : `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`, `CANCELLED` — badges colorés et libellés FR/EN corrects.
- ✅ **Slug généré automatiquement** et unique par école (créer 2 projets avec le même titre → le 2ᵉ reçoit un suffixe `-2`).
- ✅ **Tableaux** `investigators` (chercheurs) et `keywords` (mots-clés) : saisie par virgules dans l'UI, stockés en tableau, réaffichés en badges.
- ✅ **Budget** : saisi en nombre, formaté en devise dans la liste.
- ✅ **Visibilité** : bascule « Visible sur le site public » (`is_published`), filtre Publié/Brouillon dans la liste.
- ✅ **Suppression** : le message de confirmation précise que « les publications liées seront conservées » ; après suppression, les publications liées existent toujours avec `researchProjectId` nul.
- ⚠️ Filtres : statut, faculté, visibilité disponibles dans l'UI (le filtre département est supporté par l'API mais pas encore exposé dans l'UI — à vérifier uniquement via API si besoin).

**API** : `GET|POST /api/v1/university/research`, `GET|PUT|DELETE /api/v1/university/research/:id` ; filtres `?status=&faculty_id=&department_id=&is_published=&search=`.

---

## 10. Flow U-7 — Publications

- **Où** : `/dashboard/publications`
- **Objectif** : gérer articles, communications, thèses, ouvrages… liés optionnellement à un projet de recherche.

**Vérifications :**
- ✅ **CRUD complet** ; **titre obligatoire** et **au moins 1 auteur** (validation UI + API).
- ✅ **Type** : les 7 valeurs (`JOURNAL_ARTICLE`, `CONFERENCE_PAPER`, `THESIS`, `BOOK`, `BOOK_CHAPTER`, `REPORT`, `OTHER`) avec badges et libellés FR/EN.
- ✅ **Champs bibliographiques** : revue, éditeur, DOI, ISSN, ISBN, date, volume, numéro, pages, URL, citation, résumé, mots-clés.
- ✅ **Lien projet de recherche** : sélecteur alimenté par `GET /research` (optionnel).
- ✅ **Dépendance faculté → département** : changer la faculté vide le département sélectionné.
- ✅ **Filtres** : type, année (liste déroulante), faculté, département + recherche (titre, auteur, mot-clé).
- ❌ Type invalide → validation bloquée ; auteurs vide → refus.
- ✅ **Visibilité** `is_published` (publiée / brouillon) correctement enregistrée et affichée.

**API** : `GET|POST /api/v1/university/publications`, `GET|PUT|DELETE /api/v1/university/publications/:id` ; filtres `?type=&year=&faculty_id=&department_id=&search=`.

---

## 11. Flow U-8 — Sécurité, rôles & tenant

**Rôles (à tester pour chaque endpoint) :**

| Rôle | Lecture (GET) | Écriture (POST/PUT/DELETE) |
|------|:---:|:---:|
| ADMIN | ✅ | ✅ |
| TEACHER | ✅ | ❌ (403) |
| STUDENT | ✅ | ❌ (403) |
| ACCOUNTANT / SECRETARY / PARENT | ✅ | ❌ (403) |
| Non authentifié | ❌ (401) — sauf endpoints `/public` | ❌ |

**Vérifications :**
- ✅ Un enseignant connecté **voit** les listes (facultés, programmes…) mais reçoit une erreur `403` s'il tente de créer/modifier/supprimer (le frontend affiche le toast d'erreur).
- ✅ **Isolation tenant** : les données de l'école A (`sous-domaine-a`) n'apparaissent **jamais** dans l'école B (`sous-domaine-b`) — créer une faculté dans A, vérifier qu'elle est absente dans B et dans les réponses API de B.
- ✅ **Journal d'audit** : après chaque création/modification/suppression (faculté, département, programme, projet, publication), le flux « Activités récentes » du dashboard (`/dashboard`) affiche l'action avec l'acteur, l'entité et la date.

---

## 12. Flow U-9 — Endpoints publics (vitrine)

- **Objectif** : vérifier que les endpoints **sans JWT** ne renvoient que le contenu **publié**.

**Étapes (via Swagger `/api-docs` ou curl) :**
1. `GET /api/v1/university/research/public` avec uniquement le header `X-School-Subdomain: <sous-domaine>` (ou via le sous-domaine de l'hôte).
2. `GET /api/v1/university/publications/public` idem.

**Vérifications :**
- ✅ Réponse `200` **sans token** ; seuls les éléments `is_published = true` sont retournés.
- ✅ Un projet/publication en brouillon n'apparaît pas.
- ✅ Pagination + recherche (`search`, `status`, `type`, `year`) fonctionnent sur ces routes publiques.
- ❌ Sans sous-domaine / header → liste vide ou `404` (tenant introuvable), jamais de fuite de données d'une autre école.
- ⚠️ **État connu** : le site vitrine public (templates `website`) **ne consomme pas encore** ces endpoints (non branché au frontend) — le test se fait donc au niveau API pour l'instant.

---

## 13. Scénario E2E « Université prête »

Sur une école vierge avec le système **University LMD** activé :

1. Mise en place commune complète (doc 0) + activation du système University.
2. Créer l'année universitaire 2026-2027 avec **2 semestres**.
3. Créer **2 facultés** : Faculté des Sciences (`FS`), Faculté des Arts (`FA`).
4. Créer **2 départements** rattachés à FS : Mathématiques (`MATH`), Informatique (`INFO`).
5. Créer **3 programmes** : Licence Informatique (`LIC-INFO`, LICENCE, 3 ans, 180 crédits), Master Informatique (`MAS-INFO`, MASTER, 2 ans, 120 crédits), Doctorat Informatique (`DOC-INFO`, DOCTORATE, 3 ans, 180 crédits) — tous rattachés à INFO/FS.
6. Ouvrir `/dashboard/faculties/FS` → vérifier stats (2 départements, 3 programmes, répartition 1/1/1) et la liste des programmes.
7. Créer **1 projet de recherche** `IN_PROGRESS` (slug auto, 2 chercheurs, mots-clés, budget) puis le **publier**.
8. Créer **2 publications** (1 `JOURNAL_ARTICLE` liée au projet, publiée ; 1 `THESIS` en brouillon, année courante).
9. Vérifier `GET /research/public` et `GET /publications/public` : ne retournent que le projet publié + l'article publié.
10. Vérifier le **journal d'activité** du dashboard (facultés, programmes, projet, publications créés).
11. Se connecter avec un **enseignant** : lecture OK, écriture refusée (403).
12. Vérifier l'**isolation** : les données n'existent pas dans une autre école.

**Critère de réussite** : aucune erreur serveur/console, chaque stat et chaque valeur vérifiée à la main correspond à l'affichage.

---

## 14. Checklist Université

### Configuration
- [ ] Système University activé → menu « Faculties & Departments », « LMD Programs », « Research & Publications » dans la sidebar
- [ ] Année universitaire avec 2 semestres

### Facultés & Départements
- [ ] CRUD faculté (nom EN/FR, code, doyen, bâtiment, année) ; pagination + recherche
- [ ] CRUD département ; `faculty_id` requis ; filtre par faculté
- [ ] Labels des formulaires corrects : `name` = (EN), `name_fr` = (FR)
- [ ] Code unique par école (faculté & département)
- [ ] Suppression faculté avec départements → 409 ; département avec programmes → 409

### Programmes LMD
- [ ] CRUD programme (code, cycle LICENCE/MASTER/DOCTORATE, durée 1-10, crédits, langue FR/EN/BILINGUAL)
- [ ] Pages `/programs/licence|master|doctorate` pré-filtrées par cycle
- [ ] Sélecteur département dépendant de la faculté (se vide au changement)
- [ ] Filtres cycle/faculté/département + recherche

### Détail faculté
- [ ] Page `/faculties/:id` accessible depuis la liste (nom cliquable + bouton œil)
- [ ] 5 cartes de stats exactes (départements, programmes, projets actifs, publications, publications année)
- [ ] Répartition par cycle (barres) cohérente avec les données
- [ ] Tableau programmes (filtre cycle + pagination) et tableau départements
- [ ] Faculté inconnue → écran « Faculté introuvable »

### Recherche & Publications
- [ ] CRUD projet (statuts, slug unique, chercheurs/mots-clés en tableaux, budget, visibilité)
- [ ] Suppression projet → publications conservées (`research_project_id` = null)
- [ ] CRUD publication (titre + ≥1 auteur requis, 7 types, champs bibliographiques, lien projet)
- [ ] Filtres type/année/faculté/département

### Sécurité & tenant
- [ ] Écriture ADMIN uniquement (403 pour enseignant/étudiant/comptable)
- [ ] Lecture pour tous les rôles authentifiés (401 sans token)
- [ ] Isolation par sous-domaine (aucune fuite entre écoles)
- [ ] Journal d'audit : écritures visibles dans les « Activités récentes »

### Public
- [ ] `GET /research/public` et `GET /publications/public` sans JWT → uniquement `is_published = true`
- [ ] Pagination + filtres sur les routes publiques

---

## 15. Annexe — Contrôles API rapides

**Résumé des endpoints :**

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
| | `/api/v1/university/research/public` | GET (public) |
| **Publications** | `/api/v1/university/publications` | GET, POST |
| | `/api/v1/university/publications/:id` | GET, PUT, DELETE |
| | `/api/v1/university/publications/public` | GET (public) |

**Réponse attendue d'une liste :**
```json
{
  "success": true,
  "message": "Faculties retrieved",
  "data": { "items": [ /* ... */ ], "pagination": { "page": 1, "limit": 20, "total": 1 } }
}
```

**Exemples de contrôles (curl) :**
```bash
# 1. Liste des facultés (authentifié)
curl -H "Authorization: Bearer $TOKEN" -H "X-School-Subdomain: univ-dschang" \
     "http://localhost:5000/api/v1/university/faculties?page=1&limit=20"

# 2. Stats d'une faculté
curl -H "Authorization: Bearer $TOKEN" -H "X-School-Subdomain: univ-dschang" \
     "http://localhost:5000/api/v1/university/faculties/$FACULTY_ID/stats"

# 3. Programmes d'une faculté, cycle Master
curl -H "Authorization: Bearer $TOKEN" -H "X-School-Subdomain: univ-dschang" \
     "http://localhost:5000/api/v1/university/faculties/$FACULTY_ID/programs?cycle=MASTER"

# 4. Endpoint public (sans token)
curl -H "X-School-Subdomain: univ-dschang" \
     "http://localhost:5000/api/v1/university/research/public"
```

**Erreurs à vérifier :**
| Cas | Code attendu |
|-----|:---:|
| Non authentifié sur une route privée | `401` |
| Non-admin en écriture | `403` |
| Ressource inconnue / autre école | `404` |
| Suppression avec dépendances (faculté→départements, département→programmes) | `409` |
| Validation (cycle/langue/type invalides, durée hors plage, auteurs vides) | `400`/`422` avec `errors[]` |

---

> **Document précédent** : `docs/TESTING_FLOWS_04_ANGLOPHONE_TECHNIQUE.md` — puis revenir au **Document 0** pour les flows transverses (communications, dashboards, site web).
