# AKADEMEE — Guide de Test : Mise en Place Commune (Document 0/6)

> **À lire en premier.** Ce document décrit **tous les flows partagés** par les 5 systèmes éducatifs d'Akademee, dans l'**ordre de priorité** (ce qu'il faut faire avant quoi). Les spécificités de chaque système (niveaux, séries, examens, bulletin, université) sont dans les documents 1 à 5 :
>
> - 📘 **Document 1** — Francophone Général (`docs/TESTING_FLOWS_01_FRANCOPHONE_GENERAL.md`)
> - 📗 **Document 2** — Anglophone General (`docs/TESTING_FLOWS_02_ANGLOPHONE_GENERAL.md`)
> - 📙 **Document 3** — Francophone Technique (`docs/TESTING_FLOWS_03_FRANCOPHONE_TECHNIQUE.md`)
> - 📕 **Document 4** — Anglophone Technique (`docs/TESTING_FLOWS_04_ANGLOPHONE_TECHNIQUE.md`)
> - 🎓 **Document 5** — Université LMD (`docs/TESTING_FLOWS_05_UNIVERSITY.md`)
>
> **Pour qui ?** Testeurs de l'application (QA, recette client, démonstration).
> **Objectif ?** Savoir **quoi tester**, **où**, **comment** et **quel résultat attendre**, du tout début (une école arrive sur akademee.cm) jusqu'au bulletin de notes.

---

## 📋 Table des matières

1. [Environnement de test](#1-environnement-de-test)
2. [Ordre global des flows (priorités & dépendances)](#2-ordre-global-des-flows)
3. [Flow 1 — Arrivée sur akademee.cm (Landing)](#3-flow-1--arrivée-sur-akademeecm-landing)
4. [Flow 2 — Inscription de l'école](#4-flow-2--inscription-de-lécole)
5. [Flow 3 — Vérification de l'email](#5-flow-3--vérification-de-lemail)
6. [Flow 4 — Onboarding en 5 étapes](#6-flow-4--onboarding-en-5-étapes)
7. [Flow 5 — Sélection des systèmes éducatifs](#7-flow-5--sélection-des-systèmes-éducatifs)
8. [Flow 6 — Connexion & gestion de session](#8-flow-6--connexion--gestion-de-session)
9. [Flow 7 — Année académique, périodes & séquences](#9-flow-7--année-académique-périodes--séquences)
10. [Flow 8 — Niveaux](#10-flow-8--niveaux)
11. [Flow 9 — Séries & Filières](#11-flow-9--séries--filières)
12. [Flow 10 — Matières](#12-flow-10--matières)
13. [Flow 11 — Classes](#13-flow-11--classes)
14. [Flow 12 — Affectations (matières↔classes, enseignants↔matières, profs principaux)](#14-flow-12--affectations)
15. [Flow 13 — Utilisateurs & invitations](#15-flow-13--utilisateurs--invitations)
16. [Flow 14 — Élèves & comptes parents](#16-flow-14--élèves--comptes-parents)
17. [Flow 15 — Inscriptions & transferts](#17-flow-15--inscriptions--transferts)
18. [Flow 16 — Finance (frais, paiements, reçus)](#18-flow-16--finance)
19. [Flow 17 — Présences](#19-flow-17--présences)
20. [Flow 18 — Communications (annonces, notifications, messages)](#20-flow-18--communications)
21. [Flow 19 — Dashboards & journal d'activité](#21-flow-19--dashboards--journal-dactivité)
22. [Flow 20 — Site web public & paramètres](#22-flow-20--site-web-public--paramètres)
23. [Scénario E2E « École prête »](#23-scénario-e2e--école-prête-)
24. [Checklist globale](#24-checklist-globale)

---

## 1. Environnement de test

| Élément | Valeur |
|---------|--------|
| Application web | `http://localhost:3000` (dev) — ou le domaine de recette fourni |
| API | `http://localhost:5000` (dev), docs Swagger sur `/api-docs` |
| Base de données | PostgreSQL (dev local / Supabase) |
| Comptes de démo (seed) | Mot de passe de **tous** les comptes seed : `Akademee@2025` (voir tableau ci-dessous) |

**Comptes seed disponibles** (après `node scripts/seed-schools.js` — **8 écoles**) — connexion avec `subdomain` + `loginEmail` + mot de passe :

| Sous-domaine | École | Systèmes activés | Rôles disponibles |
|--------------|-------|------------------|-------------------|
| `palmiers` | Groupe Scolaire Les Palmiers | Francophone Général, Anglophone General | admin@, teacher1-4@, accountant1-4@, student1-4@ |
| `baobab` | Collège Bilingue Le Baobab | Francophone Général, Anglophone General | idem |
| `bonanjo` | Lycée Technique de Bonanjo | Francophone Technique, Anglophone Technical | idem |
| `etoiles` | École Privée Les Étoiles | Francophone Général, Anglophone General | idem |
| `montcameroon` | Institut Scolaire Mont Cameroon | Anglophone General, Francophone Général | idem |
| `lareference` | Complexe Scolaire La Référence | Francophone Général, Francophone Technique | idem |
| `garoua-intl` | École Internationale de Garoua | Francophone Général, Anglophone General | idem |
| `savanes` | Collège Privé Les Savanes | Francophone Général | idem |

Format des emails : `admin@{subdomain}.cm`, `teacher1@{subdomain}.cm`, `accountant1@{subdomain}.cm`, `student1@{subdomain}.cm` (avec suffixes `.teacher` / `.accountant` / `.student` générés par l'app — vérifier le login email réel affiché au seed).

> ⚠️ **Règle d'or du testeur** : chaque test doit être fait sur un **sous-domaine propre** (une école = un sous-domaine = des données isolées). Ne jamais mélanger deux écoles dans le même test.

---

## 2. Ordre global des flows

Les flows sont numérotés par **ordre de priorité** : un flow ne peut être testé correctement que si les précédents sont passés. C'est aussi **l'ordre logique de configuration d'une école réelle**.

```
1.  Arrivée sur akademee.cm (landing)
2.  Inscription de l'école → 3. vérification email
4.  Onboarding (5 étapes) → 5. sélection des systèmes éducatifs
6.  Connexion & session
7.  Année académique (+ périodes + séquences)
8.  Niveaux → 9. Séries/Filières → 10. Matières
11. Classes (→ dépend de : année, niveau)
12. Affectations (matières→classe, enseignants→matière, prof principal)
13. Utilisateurs & invitations
14. Élèves → 15. Inscriptions
16. Finance (frais → assignation → paiements → reçus)
17. Présences
--- puis les flows SPÉCIFIQUES au système (documents 1-4) : configuration de notation,
    saisie des notes, génération du bulletin, examens officiels ---
18. Communications
19. Dashboards & journal d'activité
20. Site web public & paramètres
```

> 💡 **Rappel des dépendances clés** : *créer un niveau avant une classe*, *une année académique avant des classes*, *des matières avant leur affectation*, *des classes avant d'inscrire des élèves*, *des frais avant d'enregistrer des paiements*, *des notes avant de générer un bulletin*.

---

## 3. Flow 1 — Arrivée sur akademee.cm (Landing)

- **Où** : page d'accueil `/`
- **Objectif** : vérifier la vitrine publique d'Akademee et les entrées de navigation.

**Étapes :**
1. Ouvrir `/`.
2. Vérifier la présentation de la plateforme (hero, fonctionnalités, CTA).
3. Cliquer sur les CTA : « S'inscrire / Register » → `/register`, « Se connecter / Login » → `/login`.

**Vérifications / résultats attendus :**
- La page se charge sans erreur console.
- Les liens fonctionnent et redirigent vers les bonnes pages.
- La page est **responsive** (mobile/tablette/desktop).

**Cas limites à tester :**
- Navigation directe vers une URL inconnue → page « Under Development » ou redirection propre (jamais d'écran blanc).

---

## 4. Flow 2 — Inscription de l'école

- **Où** : `/register`
- **Objectif** : créer un compte école (sous-domaine unique + admin).

**Étapes :**
1. Remplir : nom de l'école, **sous-domaine** (ex : `testsaintjean`), email admin, mot de passe, confirmation.
2. Soumettre.

**Vérifications :**
- ✅ Compte créé → redirection vers la page de vérification email.
- ✅ L'email de vérification est envoyé (dans le dev, vérifier les logs serveur / boîte de test).
- ❌ Sous-domaine déjà pris → message d'erreur clair (API : `GET /api/schools/check-subdomain`).
- ❌ Mot de passe trop court (< 8) / emails différents → erreurs de validation sous les champs.

**Cas limites :**
- Sous-domaine avec majuscules/espaces/caractères spéciaux → rejeté (uniquement minuscules, chiffres, tirets).
- Email invalide → bloqué.

---

## 5. Flow 3 — Vérification de l'email

- **Où** : page `/verify-email` (lien reçu par email)
- **Objectif** : activer le compte école.

**Étapes :**
1. Ouvrir le lien de vérification reçu par email.
2. Vérifier la confirmation et la redirection vers l'onboarding.

**Vérifications :**
- ✅ Email vérifié → accès à l'onboarding autorisé.
- ❌ Lien expiré/invalide → message d'erreur + possibilité de **renvoyer l'email** (resend).
- ✅ Tant que l'email n'est pas vérifié, le login / l'onboarding est bloqué (message explicite).

---

## 6. Flow 4 — Onboarding en 5 étapes

- **Où** : `/onboarding`
- **Objectif** : configurer l'école (identité, contact, classes par défaut, statistiques, publication du site).

| Étape | Contenu | Points de test |
|-------|---------|----------------|
| **1. Identité** | Logo (upload), nom, slogan/tagline | Upload image valide/invalide (taille, type), aperçu du logo |
| **2. Contact** | Email, téléphone, adresse, ville, région | Validation email/téléphone, champs requis |
| **3. Classes & Niveaux** | Choix d'un **preset** (Francophone, Anglophone…) qui pré-remplit les classes, puis personnalisation (ajout/modif/suppression) | Le preset charge les bonnes classes (ex : 6ème A…, Form 1…), modification persistée |
| **4. Stats & Systèmes** | Nombres (élèves, enseignants, classes), **sélection des systèmes éducatifs** (multi), année de fondation, type d'examen, taux de réussite | Multi-sélection, badges visibles, sauvegarde |
| **5. Publication** | Récapitulatif → « Publier le site » | Publication OK → redirection vers le dashboard |

**Vérifications transverses :**
- La navigation **Précédent/Suivant** conserve les données déjà saisies.
- Les validations bloquent la progression tant que les champs requis sont vides.
- Après l'onboarding, `schools.onboarding_completed = true` (l'école ne repasse plus par le wizard).
- `POST /api/schools/onboarding` enregistre bien les données ; `POST /api/schools/onboarding/media` gère les uploads (Cloudinary).

---

## 7. Flow 5 — Sélection des systèmes éducatifs

- **Où** : `/educational-system-selection`
- **Objectif** : activer les systèmes que l'école gère. **5 choix possibles** :
  1. Francophone Général (BEPC, Probatoire, Baccalauréat)
  2. Anglophone General (GCE O-Level & A-Level)
  3. Francophone Technique (CAP, Brevet & Bac Technique)
  4. Anglophone Technical (TVEE IL & AL)
  5. University LMD *(voir **Document 5** — Guide de test Université LMD : `docs/TESTING_FLOWS_05_UNIVERSITY.md`)*

**Étapes :**
1. Cliquer sur les systèmes à activer (multi-sélection).
2. Cliquer sur « Continuer vers le dashboard ».

> 💡 Cette page et l'étape 4 de l'onboarding renseignent **le même champ** (`schools.educational_systems`) : passer par l'un ou l'autre met à jour la même sélection.

**Vérifications :**
- ✅ Au moins 1 système requis (sinon message d'erreur).
- ✅ Les systèmes sélectionnés apparaissent en **badges** dans la sidebar (admin) et pilotent la navigation spécifique (Examens, Séries, Niveaux du système).
- ✅ La sélection est persistée (rechargement de page).
- ⚠️ Tester chaque combinaison : 1 seul système, plusieurs systèmes, tous les systèmes.

---

## 8. Flow 6 — Connexion & gestion de session

- **Où** : `/login`
- **Objectif** : authentification par sous-domaine + email + mot de passe.

**Étapes :**
1. Saisir sous-domaine, email (ou login email), mot de passe → « Se connecter ».
2. Vérifier la redirection vers `/dashboard` (rôle prioritaire : ADMIN > STUDENT > TEACHER > ACCOUNTANT > PARENT).

**Vérifications :**
- ✅ Connexion valide (chaque rôle : admin, enseignant, comptable, étudiant, parent).
- ❌ Mot de passe faux / email inconnu → « Invalid email or password ».
- ❌ Sous-domaine inconnu → message dédié.
- ✅ « Mot de passe oublié » → lien de reset reçu par email → nouveau mot de passe utilisable.
- ✅ Déconnexion → token invalidé (blacklist), retour à `/login`.
- ✅ Session expirée (401) → rafraîchissement automatique du token (`POST /api/auth/refresh`) ou redirection propre vers le login.

**Cas limites :**
- Accès direct à `/dashboard` sans être connecté → redirection vers `/login`.
- Tester `GET /api/auth/me` renvoie le profil + l'école + les systèmes éducatifs.

---

## 9. Flow 7 — Année académique, périodes & séquences

- **Où** : `/dashboard/academic-years` (création & activation), `/dashboard/periods`, `/dashboard/sequences`
- **Objectif** : créer l'année scolaire, ses périodes (termes/semestres) et séquences.

**Ordre de test :**
1. **Créer l'année** : nom (ex : 2026-2027), date début/fin, sélection des systèmes éducatifs.
2. **Génération des périodes** : cocher « générer automatiquement » si disponible → attendu selon le système :
   - Anglophone (général/technique) : **3 Terms**
   - Francophone (général/technique) : **2 semestres / 3 trimestres** (selon la config de l'école)
   - Université : 2 semestres
3. **Séquences** : créer/ouvrir/fermer/verrouiller les séquences dans chaque période (`/dashboard/sequences`).

**Vérifications :**
- ✅ L'année peut être **activée** comme année courante (une seule active à la fois).
- ✅ Toutes les listes (classes, étudiants, stats du dashboard) sont **filtrées par l'année active** (sélecteur d'année).
- ✅ Périodes & séquences : dates cohérentes, CRUD complet, statut (ouvert/fermé/verrouillé).
- ❌ Double activation d'année → l'ancienne est désactivée automatiquement.
- ⚠️ Une période **verrouillée** doit empêcher la saisie de notes (si le verrou est implémenté).

**API** : `POST /api/academics/years`, `PUT /api/academics/years/:id/activate`, `POST /api/periods`, `POST /api/v1/sequences`, `PUT /api/v1/sequences/:id/open|close|lock|unlock`.

---

## 10. Flow 8 — Niveaux

- **Où** : `/dashboard/levels`
- **Objectif** : définir les niveaux scolaires du système (ex : 6ème, 5ème… ou Form 1…). **Obligatoire AVANT de créer une classe.**

**Étapes :**
1. Ajouter un niveau : nom, **ordre**, code (ex : `6E`).
2. Modifier / supprimer un niveau.

**Vérifications :**
- ✅ CRUD complet ; l'ordre détermine la progression.
- ❌ Suppression d'un niveau **déjà utilisé par une classe** → blocage ou comportement documenté (pas de corruption de données).
- ✅ Les niveaux sont isolés par **système éducatif** (un niveau francophone n'apparaît pas dans un contexte anglophone).

**API** : `POST /api/levels`, `GET /api/levels`, `PUT /api/levels/:id`, `DELETE /api/levels/:id`.

---

## 11. Flow 9 — Séries & Filières

- **Où** : `/dashboard/series`
- **Objectif** : définir les séries/filières du second cycle (ex : Série A, C, D — ou Streams A1…S5 — ou filières STT/Industrielle).

**Vérifications :**
- ✅ CRUD complet (nom, code, système associé).
- ✅ Une classe de second cycle peut être rattachée à une série (utile pour l'orientation et le bulletin).
- ⚠️ **Pas de série pour le premier cycle** (6ème-3ème / Form 1-5) : comportement attendu.

---

## 12. Flow 10 — Matières

- **Où** : `/dashboard/subjects`
- **Objectif** : créer le référentiel de matières (Maths, Français, Anglais, Physique-Chimie…).

**Étapes :**
1. Ajouter une matière : nom, type (théorique/pratique), code.
2. Modifier / supprimer.

**Vérifications :**
- ✅ CRUD complet, noms bilingues FR/EN si le champ existe.
- ❌ Suppression d'une matière affectée à une classe/enseignant → blocage documenté.
- ⚠️ Les **coefficients** sont fixés par classe (voir Flow 12) — pas sur la matière elle-même.

---

## 13. Flow 11 — Classes

- **Où** : `/dashboard/classes` (liste), `/dashboard/classes/new` (création), `/dashboard/classes/:id` (détail)
- **Objectif** : créer les classes d'une année académique. **Dépend de** : année académique active + niveau (+ série pour le 2nd cycle).

**Étapes :**
1. Créer une classe : nom (ex : `6ème A`, `Form 1`, `Tle C`), **niveau**, année, capacité, professeur principal (optionnel).
2. Depuis la fiche classe : voir les élèves, les matières, les enseignants.

**Vérifications :**
- ✅ La classe apparaît dans la liste et dans les menus de sélection (notes, présences, bulletin).
- ✅ La capacité est respectée/affichée (alerte si pleine, si implémentée).
- ✅ L'affectation **professeur principal** est visible et modifiable.
- ⚠️ Les routes spécifiques par système (`/dashboard/classes/college`, `/lycee`, `/lower-secondary`, `/upper-secondary`, `/tech-college`, `/tech-lycee`…) filtrent les classes par niveau/système.
- ❌ Créer une classe sans année active → message d'erreur clair.

**API** : `POST /api/classes`, `GET /api/classes`, `GET /api/classes/:id`, `GET /api/classes/:id/students`, `POST /api/classes/:id/teachers`.

---

## 14. Flow 12 — Affectations

Trois affectations distinctes à tester **dans cet ordre** :

### 12.1 Matières → Classe (coefficients)
- **Où** : `/dashboard/subject-classes` ou depuis la fiche classe
- **Étapes** : associer des matières à une classe, **fixer le coefficient** de chaque matière pour cette classe.
- **Vérifications** : la liste reflète les matières ; le coefficient est bien celui utilisé dans les calculs de moyenne ; **le coefficient de la classe prime sur celui de l'offre de matière** (source de vérité pour le bulletin).

### 12.2 Enseignant → Matière (+ classe)
- **Où** : `/dashboard/teacher-assignments`
- **Étapes** : assigner un enseignant à une matière pour une classe donnée.
- **Vérifications** : l'enseignant voit la matière/classe dans son espace (`/dashboard/my-classes`, `/dashboard/grade-entry`).

### 12.3 Professeur principal → Classe
- **Où** : `/dashboard/classes/:id/teachers` ou création de classe
- **Vérifications** : le professeur principal apparaît sur la classe et dans les bulletins (appréciation/signature).

**API** : `POST /api/class-subjects` (+ `bulk`), `POST /api/subject-teachers`, `POST /api/classes/:id/teachers`.

---

## 15. Flow 13 — Utilisateurs & invitations

- **Où** : `/dashboard/users` (liste), `/dashboard/users/create` (création unifiée)
- **Objectif** : créer les comptes **enseignants, comptables, secrétaires**, et gérer les rôles.

**Étapes :**
1. Créer un utilisateur : prénom, nom, email, rôle (enseignant/comptable/secrétaire), mot de passe.
2. Vérifier la génération du **login email** et l'envoi de l'email de bienvenue (le cas échéant).
3. Assigner des rôles via `/dashboard/users` (ou API `POST /api/roles/:userId/assign`).

**Vérifications :**
- ✅ L'utilisateur peut se connecter avec ses identifiants.
- ✅ Le rôle détermine la **navigation** (sidebar) et les **permissions** (ex : un comptable ne voit pas la gestion des classes).
- ✅ **Invitations** : `POST /api/invites/send` → lien d'invitation → acceptation → compte créé.
- ❌ Email déjà utilisé dans l'école → erreur.
- ✅ **Changement de mot de passe** (profil) et **mot de passe oublié** fonctionnent.

---

## 16. Flow 14 — Élèves & comptes parents

- **Où** : `/dashboard/students`, `/dashboard/students/:id`
- **Objectif** : créer un élève (compte utilisateur + rôle étudiant + matricule + compte parent).

**Étapes :**
1. Créer un élève : prénom, nom, date de naissance, genre, email (optionnel), classe, photo (optionnel).
2. **Facultatif mais recommandé** : saisir les infos parent (prénom, nom, email, téléphone, lien de parenté).
3. Enregistrer.

**Vérifications :**
- ✅ Un **matricule** (student number) est généré automatiquement.
- ✅ Un compte `STUDENT` est créé + rôle assigné ; **login email** généré.
- ✅ Si des infos parent sont saisies : un **compte parent** est créé automatiquement et **lié** via `guardians` (le parent peut se connecter et voir son enfant).
- ✅ L'élève apparaît dans la classe et dans la liste des étudiants.
- ❌ Email élève déjà utilisé → réutilisation propre du compte utilisateur existant (pas de doublon).

**Cas limites :**
- Élève sans email → fonctionne, login par identifiant généré.
- Photo : upload valide/invalide.

**API** : `POST /api/students`, `GET /api/students`, `GET /api/students/:id`, `PUT /api/students/:id`, `DELETE /api/students/:id`.

---

## 17. Flow 15 — Inscriptions & transferts

- **Où** : création d'élève (inscription directe) ou `/dashboard/students/:id` ; admissions `/dashboard/admissions/applications`
- **Objectif** : inscrire un élève dans une classe, gérer les statuts et les transferts.

**Vérifications :**
- ✅ L'inscription lie l'élève à une **classe** + **année académique** (table `enrollments`).
- ✅ Changement de statut : `active`, `graduated`, `expelled`, `transferred` (API `PUT /api/enrollments/:id/status`).
- ✅ **Transfert** (`POST /api/enrollments/:id/transfer`) : l'ancienne inscription passe `transferred`, une nouvelle est créée dans la classe cible.
- ✅ Un élève inscrit apparaît dans la fiche classe, la saisie de notes, la présence, le bulletin.
- ❌ Inscrire un élève dans une classe d'une autre année → erreur ou blocage documenté.

**Cas limite** : un élève **non inscrit** ne doit pas être éligible au bulletin (message explicite à la génération).

---

## 18. Flow 16 — Finance

- **Où** : `/dashboard/fees` (types de frais), `/dashboard/fees/assign` (assignation), `/dashboard/payments` (paiements), `/dashboard/receipts` (reçus), `/dashboard/finance` (tableau de bord)

**Ordre de test :**
1. **Créer un type de frais** : nom (ex : Frais de scolarité S1), montant, échéance, périodicité.
2. **Assigner les frais aux classes** (ou directement aux élèves via `student_fees`).
3. **Enregistrer un paiement** : élève, type de frais, montant, mode (cash, mobile money, virement, chèque), date.
4. **Consulter** : statut de l'élève (paid / partial / pending), total dû/payé/reste, reçu PDF, dashboard finance.

**Vérifications :**
- ✅ `POST /api/payments` : le statut `student_fees.amount_paid` et `students.fee_status` sont synchronisés **après recalcul/backfill** (bouton de recalcul ou `POST /api/fee-calculation/recalculate` ; script `scripts/backfill-payments.js`).
- ✅ **Détection de doublon** : même élève + même frais + même montant le même jour → rejet (`DUPLICATE_PAYMENT`).
- ✅ **Surpaiement bloqué** : montant > reste dû → rejet (`OVERPAYMENT` / `FEE_ALREADY_PAID`).
- ✅ Reçu PDF téléchargeable et lisible (`/dashboard/receipts`).
- ✅ Dashboard finance : encaissements mensuels, par classe, impayés, taux de recouvrement.
- ❌ Paiement pour un élève sans frais assignés → comportement défini (impossible ou avertissement).

**API** : `POST /api/finance/fees`, `POST /api/finance/fees/assign`, `POST /api/payments`, `GET /api/payments/student/:studentId`, `POST /api/fee-calculation/recalculate`, `GET /api/dashboard/finance-stats`.

---

## 19. Flow 17 — Présences

- **Où** : `/dashboard/attendance` (saisie), `/dashboard/my-attendance` (étudiant/parent)

**Étapes :**
1. Sélectionner une classe + une date.
2. Marquer chaque élève : présent / absent / retard / excusé.
3. Enregistrer.

**Vérifications :**
- ✅ Saisie simple et **en masse** (bulk) fonctionnent.
- ✅ Les statistiques (taux de présence par élève/classe, tendances mensuelles) sont cohérentes.
- ✅ L'élève / le parent voit ses présences.
- ✅ Les absences/retards remontent dans le **bulletin** (section assiduité).
- ❌ Date future / classe vide → gestion propre.

**API** : `POST /api/attendance`, `POST /api/attendance/bulk`, `GET /api/attendance-stats/student/:studentId`, `GET /api/attendance-stats/class/:classId`.

---

## 20. Flow 18 — Communications

### 20.1 Annonces
- **Où** : `/dashboard/announcements`
- **Étapes** : créer → publier → dépublier → supprimer.
- **Vérifications** : seule une annonce **publiée** est visible sur le site public de l'école (`/site` ou sous-domaine) et dans les espaces élèves/parents.

### 20.2 Notifications
- **Où** : cloche de notifications (navbar), `/api/notifications`
- **Vérifications** : liste, non-lues, marquer comme lu, compter les non-lues, envoi direct (`POST /api/notifications/send`).

### 20.3 Messages campus
- **Où** : `/dashboard/campus-messages`
- **Vérifications** : envoi/réception entre rôles (parent ↔ école), filet de messages.

---

## 21. Flow 19 — Dashboards & journal d'activité

- **Où** : `/dashboard` (admin), `/dashboard/accountant-home` (comptable), `/dashboard/teacher-home`, `/dashboard/student-home`, `/dashboard/parent-home`

**Vérifications :**
- ✅ Les statistiques (élèves, enseignants, classes, revenus) sont **réelles et filtrées par l'année active**.
- ✅ Le graphique de revenus reflète les paiements enregistrés.
- ✅ **Activités récentes** : le flux montre la **vraie activité** (création d'élève, de classe, paiement…) avec acteur + date — basé sur le journal d'audit (`audit_logs`).
- ✅ Le bouton **Actualiser** rafraîchit les données.
- ✅ Chaque rôle voit son dashboard (pas d'accès aux sections interdites).
- ✅ L'API `GET /api/dashboard/activities` renvoie les dernières actions réelles.

**Cas limite** : après une action (créer un élève, payer), l'activité récente doit montrer cette action (après rafraîchissement).

---

## 22. Flow 20 — Site web public & paramètres

### 22.1 Site web
- **Où** : `/dashboard/website` (admin) ; site public sur `/{subdomain}` ou `/site`
- **Vérifications** : changement de couleur principale, de template, de description, statistiques, galerie → le site public reflète les changements ; **publication/dépublication** contrôle l'accès public.

### 22.2 Paramètres
- **Où** : `/dashboard/settings`
- **Vérifications** : infos école (nom, logo, contact…), modification persistée.

---

## 23. Scénario E2E « École prête »

Scénario complet de mise en place d'une école vierge (à faire sur un **nouveau sous-domaine**).

1. Créer le compte école → vérifier l'email.
2. Onboarding complet (5 étapes) avec sélection de **2 systèmes** (ex : Francophone Général + Anglophone General).
3. Créer l'année académique 2026-2027 et **activer** la génération des périodes.
4. Créer les niveaux (6ème→Tle et Form 1→Upper Sixth).
5. Créer les séries (A, C, D / Arts, Science).
6. Créer les matières (Maths, Français, Anglais, Physique-Chimie, SVT…).
7. Créer les classes (6ème A, Form 1…).
8. Affecter les matières aux classes avec coefficients ; assigner les enseignants.
9. Créer 2 enseignants + 1 comptable (rôles).
10. Créer 3 élèves (dont 1 avec infos parent) et les inscrire dans les classes.
11. Créer des frais et les assigner ; enregistrer 1 paiement complet + 1 partiel.
12. Saisir des présences sur 2-3 jours.
13. Saisir des notes (voir doc système) et générer le bulletin d'un élève.
14. Vérifier que le dashboard admin montre des statistiques cohérentes + les activités récentes.
15. Publier le site web et vérifier la vitrine publique.

**Critère de réussite** : aucune erreur serveur/console sur tout le parcours, données cohérentes à chaque étape.

---

## 24. Checklist globale

### Authentification & école
- [ ] Landing page fonctionnelle et responsive
- [ ] Inscription école (validation sous-domaine, email, mot de passe)
- [ ] Vérification email (valide, expirée, renvoi)
- [ ] Onboarding 5 étapes (retour arrière, persistance, presets)
- [ ] Sélection des systèmes éducatifs (1, plusieurs, aucun → erreur)
- [ ] Login tous rôles / login erroné / mot de passe oublié
- [ ] Déconnexion / session expirée / refresh token

### Structure académique
- [ ] Année académique (création, activation unique, génération périodes)
- [ ] Périodes & séquences (CRUD, statuts ouverture/verrouillage)
- [ ] Niveaux (CRUD, ordre, isolation par système)
- [ ] Séries/Filières (CRUD, rattachement 2nd cycle)
- [ ] Matières (CRUD)
- [ ] Classes (CRUD, capacité, prof principal, filtres par système)
- [ ] Affectations (matière↔classe + coeff, enseignant↔matière, prof principal)

### Utilisateurs & élèves
- [ ] Création enseignant/comptable/secrétaire (rôles, login email)
- [ ] Invitations (send/validate/accept/decline)
- [ ] Création élève (matricule, compte étudiant, compte parent auto)
- [ ] Inscriptions (statuts, transfert, apparition dans classe/notes/bulletin)

### Finance
- [ ] Types de frais (CRUD)
- [ ] Assignation frais → classes/élèves
- [ ] Paiement (doublon, surpaiement, modes, reçu PDF, synchronisation des statuts)
- [ ] Dashboard finance & rapports

### Présences & communications
- [ ] Saisie simple et bulk, statistiques, remontée dans le bulletin
- [ ] Annonces (publier/dépublier), notifications, messages campus

### Cross-système
- [ ] Les données d'une école/système n'apparaissent jamais chez une autre école
- [ ] Filtre année académique appliqué partout
- [ ] L'application est responsive (mobile/tablette/desktop)
- [ ] Aucune erreur console / réseau sur les parcours principaux

---

> **Suite** : passez maintenant au(x) document(s) de votre système cible (1 à 5) pour tester la **configuration de notation**, la **saisie des notes**, la **génération du bulletin**, les **examens officiels** et le **module universitaire LMD** propres à chaque système.
