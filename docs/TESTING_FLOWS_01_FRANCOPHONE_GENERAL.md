# AKADEMEE — Guide de Test : Système Francophone Général (Document 1/6)

> **Prérequis** : avoir lu et exécuté le **Document 0 — Mise en place commune** (`docs/TESTING_FLOWS_00_COMMUN.md`).
> Ce document couvre les flows **spécifiques au système Francophone Général** (code Akademee : `francophone_general` / `FR_GEN`).

---

## 1. Contexte éducatif réel (pour bien tester)

Le sous-système francophone du Cameroun (tutelle MINESEC) suit le modèle français. **Parcours officiel d'un élève :**

```
Maternelle (3 ans : Petite/Moyenne/Grande Section)
   ↓
Primaire (6 ans : SIL → CP → CE1 → CE2 → CM1 → CM2)
   ↓  Examen : CEP (Certificat d'Études Primaires) + concours d'entrée en 6ème
COLLÈGE — Premier cycle (4 ans) : 6ème → 5ème → 4ème → 3ème
   ↓  Examen : BEPC (Brevet d'Études du Premier Cycle) en fin de 3ème
LYCÉE — Second cycle (3 ans) : Seconde → Première → Terminale
   ↓  Examen : PROBATOIRE en fin de 1ère
   ↓  Examen : BACCALAURÉAT (OBC) en fin de Terminale
   ↓
Université / Grandes écoles (LMD)
```

**Points d'attention pour le testeur :**
- **Année scolaire** : septembre → juin, découpée en **3 trimestres** et **6 séquences** (2 séquences par trimestre).
- **Notation** : notes sur **/20** ; moyenne de passage : **10/20**.
- **Coefficients** : chaque matière a un coefficient (ex : Maths 5, Français 4, Anglais 3…) ; la moyenne générale est **pondérée** : `Σ (note × coeff) / Σ coeff`.
- **Mentions officielles** : Passable (10+), Assez Bien, Bien, Très Bien.
- **Séries du second cycle** : A (littéraire), C (Maths-Physique), D (Maths-SVT), E (Maths-Technique), TI (informatique), B (économie). Le choix de série se fait en Seconde.
- **Orientation & redoublement** : décisions du conseil de classe (admis / conditionnel / redoublement).

---

## 2. Ce qu'Akademee implémente pour ce système

| Élément | Valeur Akademee |
|---------|-----------------|
| Code système | `FR_GEN` (`francophone_general`) |
| Hiérarchie de périodes | `sequence` → `trimestre` |
| Documents de bulletin | « BULLETIN DE SÉQUENCE » (6/an), « BULLETIN TRIMESTRIEL » (3/an), « BULLETIN ANNUEL » (1/an) |
| Langue du bulletin | Français (labels, ministère MINESEC) |
| Échelle de notes | 0 à 20, seuil de passage 10, arrondi `round_half_up` à 2 décimales |
| Composantes d'évaluation | CC (Contrôle Continu, ~40 %) + Composition (~60 %), éventuellement TP |
| Niveaux types | 6ème, 5ème, 4ème, 3ème, 2nde, 1ère, Terminale (avec série : C, A, D…) |
| Examens officiels | BEPC, Probatoire, Baccalauréat |

---

## 3. Ordre des flows spécifiques

```
F-1  Configuration de la notation (échelle, mentions, offres de matières, composantes)
F-2  Saisie des notes (par classe / matière / séquence)
F-3  Calculs & vérifications (moyennes, rangs, mentions)
F-4  Génération du bulletin (cycle DRAFT → PUBLISH → LOCK)
F-5  Export PDF & impression du bulletin
F-6  Examens officiels (BEPC, Probatoire, Baccalauréat)
```

---

## 4. Flow F-1 — Configuration de la notation

### F-1.1 Échelle de notation (Grading Scale)
- **Où** : `/dashboard/grading-config`
- **Étapes** : créer une échelle « Notation /20 » (min 0, max 20) + une **version** (seuil de passage 10, arrondi `round_half_up`, précision 2).
- **Vérifications** :
  - ✅ CRUD échelle + versions ; la version **active** (par dates d'effet) est utilisée dans les bulletins.
  - ✅ L'échelle par défaut existe si l'école n'en a pas créé.

### F-1.2 Seuils de mentions
- **Où** : `/dashboard/grading-config` (onglet mentions) — seuils par défaut attendus (⚠️ ils sont **configurables par école** : vérifier les seuils réellement enregistrés dans la config de l'école testée) :

| Mention (FR) | Plage moyenne /20 |
|--------------|-------------------|
| Excellent | 17 – 20 |
| Très bien | 16 – 16.99 |
| Bien | 14 – 15.99 |
| Assez bien | 12 – 13.99 |
| Passable | 10 – 11.99 |
| Insuffisant | 8 – 9.99 |
| Faible | < 8 |

- **Vérifications** : la mention dérivée d'une moyenne tombe dans la bonne plage ; seuils modifiables (attention : pas de doublons/chevauchements).

### F-1.3 Offres de matières (Subject Offerings)
- **Où** : `/dashboard/subject-offerings`
- **Étapes** : pour chaque **classe** + **période**, lier les **matières** avec **coefficient** (et crédits si besoin).
- **Vérifications** : une matière non liée à la classe n'apparaît pas dans la saisie de notes ni au bulletin ; le coefficient affiché au bulletin correspond bien à celui de la classe.

### F-1.4 Composantes d'évaluation
- **Où** : `/dashboard/subject-offerings` (détail d'une offre)
- **Étapes** : définir les composantes d'une matière : **CC** (Contrôle Continu, ex : poids 40 %, note /20) et **Composition** (poids 60 %, note /20). Possible aussi : **TP** (Travaux Pratiques).
- 🏷️ **Correspondance avec l'app** : la « Composition » correspond au type de composante **EXAM** dans Akademee (types : `CONTINUOUS_ASSESSMENT`/CC, `EXAM`, `THEORY`, `PRACTICAL`/TP) — chercher ces types dans l'UI de configuration.
- **Vérifications** :
  - ✅ La moyenne matière = `(noteCC × 0,4 + noteCompo × 0,6)` (pondérée par `weight_percent`), ramenée sur la note max.
  - ✅ Si une composante n'a pas de note : la moyenne est calculée sur les composantes notées (proportionnelle).
  - ✅ Si **aucune note** n'est saisie : moyenne `null` → le bulletin affiche « — », pas 0.

---

## 5. Flow F-2 — Saisie des notes

- **Où** : `/dashboard/grade-entry` (enseignant), `/dashboard/grades` (admin)
- **Objectif** : saisir les notes /20 par élève, par matière, par composante et par **séquence**.

**Étapes :**
1. Sélectionner classe → matière → séquence (ou période).
2. Saisir la note **CC** et la note **Composition** de chaque élève (sur 20).
3. Enregistrer.

**Vérifications :**
- ✅ Les notes sont persistées et réaffichées (rechargement).
- ✅ Saisie **en masse** (bulk upload Excel, si disponible) fonctionne et valide les notes.
- ✅ Statuts possibles d'une évaluation : `GRADED`, `ABSENT_JUSTIFIED`, `ABSENT_UNJUSTIFIED`, `PENDING`, `EXEMPTED` (une note ne peut pas être saisie avec un statut d'absence).
- ✅ Modification d'une note : l'ancienne valeur est conservée (`previous_score`) et tracée (audit de note).
- ✅ **Rattrapage (resit)** : option `is_resit` gérée (note de rattrapage prise en compte si activée).
- ❌ Note hors barème (ex : 25/20) → validation bloquée (si implémentée).

**Cas limites :**
- Élève absent → statut d'absence, aucune moyenne calculée sur cette composante.
- Élève ajouté en cours de période → il apparaît pour la saisie, les notes manquantes restent vides.

---

## 6. Flow F-3 — Calculs & vérifications (à tester avec des valeurs connues)

> Objectif : vérifier l'exactitude mathématique. **Toujours calculer à la main les valeurs attendues avant de valider.**

**Scénario de calcul type (classe de 4ème, 2 élèves) :**

| Élève | Maths (coeff 4) | Français (coeff 5) | Anglais (coeff 3) | Moyenne générale attendue |
|-------|-----------------|--------------------|--------------------|---------------------------|
| A     | 16              | 12                 | 10                 | `(16×4 + 12×5 + 10×3)/(4+5+3) = (64+60+30)/12 = 12,83` |
| B     | 8               | 7                  | 11                 | `(8×4 + 7×5 + 11×3)/12 = (32+35+33)/12 = 8,33` |

**Vérifications :**
- ✅ Moyenne matière = moyenne pondérée des composantes (CC/Compo).
- ✅ Moyenne générale = `Σ(note × coeff) / Σcoeff` (arrondie à 2 décimales).
- ✅ **Rang** : A = 1/2, B = 2/2 ; rang par matière calculé.
- ✅ **Moyenne de classe** = moyenne des moyennes des élèves.
- ✅ **Mention** de A = « Assez bien » (12,83 → plage 12-13,99) ; mention de B = « Insuffisant » (8,33 → plage 8-9,99).
- ✅ **Appréciation automatique** par matière (Excellent ≥17, Très bien ≥16, Bien ≥14, Assez bien ≥12, Passable ≥10, Insuffisant ≥8, Faible <8) — modifiable par l'enseignant si le champ est prévu.
- ✅ **Rang partiel** : si certains élèves n'ont pas de notes, la moyenne de classe reste cohérente et le bulletin signale un classement partiel.
- ✅ Notes min/max/moyenne par matière affichées au bulletin.

**API de contrôle** : `GET /api/v1/calculations/subject-average`, `GET /api/v1/calculations/period-average`, `GET /api/v1/calculations/cohort-ranks`.

---

## 7. Flow F-4 — Génération du bulletin

- **Où** : `/dashboard/report-cards`
- **Objectif** : générer le bulletin d'un élève (ou de toute une classe) pour une période/séquence, puis suivre son **cycle de vie**.

**Étapes :**
1. Sélectionner classe → période (séquence, trimestre) → générer.
2. Consulter le **payload** du bulletin (aperçu).

**Cycle de vie du bulletin (à tester intégralement) :**

```
DRAFT ──(publish)──▶ PUBLISHED ──(lock)──▶ LOCKED
  ▲                     │                     │
  └──────(unlock)───────┴────(revise)────────┘
                    (revise = nouvelle version DRAFT v+1)
```

**Vérifications par statut :**
- **DRAFT** : généré avec les moyennes/rangs/mentions ; modifiable (les lignes se régénèrent si les notes changent) ; version = 1.
- **PUBLISH** : visible/publier → `PUBLISHED`, horodatage `published_at`.
- **LOCK** : verrouillé — les notes ne peuvent plus le modifier.
- **UNLOCK** : uniquement depuis `LOCKED` → retour `DRAFT` (sinon erreur « Only LOCKED report cards can be unlocked »).
- **REVISE** : depuis `LOCKED`/`PUBLISHED` → la version courante passe `LOCKED` et une **nouvelle version DRAFT v+1** est créée.
- **DELETE** : suppression bulletin + lignes + jobs associés nettoyés.

**Contenu attendu du bulletin (payload) :**
- En-tête officiel : République du Cameroun, MINESEC, nom de l'établissement, « BULLETIN DE SÉQUENCE / TRIMESTRIEL / ANNUEL », année scolaire.
- Infos élève : nom, classe, date de naissance, matricule, **rang / effectif**.
- Tableau des matières : matière, enseignant, note /20, **coefficient**, **points pondérés**, rang matière, appréciation.
- Résumé : **moyenne générale /20**, moyenne de classe, rang, **mention**, seuil de passage (10/20).
- Assiduité : présents / absents / retards (si saisis) sur la période.
- Signatures : professeur principal, chef d'établissement, parent.

**Cas limites :**
- Générer pour un élève **sans note** → moyenne « — », mention vide (pas de valeur inventée).
- Générer pour un élève **non inscrit** → erreur explicite.
- Régénérer après modification de notes → les valeurs sont recalculées (pas de données figées).
- Génération **en masse** (toute la classe) via la file de travaux (queue) : suivi de progression, statuts `QUEUED → PROCESSING → COMPLETED / FAILED`.

---

## 8. Flow F-5 — Export PDF & impression

- **Où** : depuis la fiche bulletin (`/dashboard/report-cards`) — bouton « Télécharger PDF » / « Imprimer »
- **Objectif** : obtenir un PDF fidèle au bulletin.

**Vérifications :**
- ✅ Le PDF se télécharge et s'ouvre correctement.
- ✅ Le rendu est identique à l'aperçu (logo, tableau, moyennes, signatures).
- ✅ **Export en masse** (ZIP) pour toute une classe, si disponible.
- ✅ Le document affiche la mention et le format du système **FR_GEN** (« BULLETIN TRIMESTRIEL » en français).
- ⚠️ À tester sur navigateurs (Chrome, Firefox) — le rendu PDF est généré côté client (html2canvas + jsPDF) dans la version actuelle.

---

## 9. Flow F-6 — Examens officiels

- **Où** : `/dashboard/exams/bepc`, `/dashboard/exams/probatoire`, `/dashboard/exams/baccalaureat`, `/dashboard/exams/francophone-results`
- **Objectif** : gérer les examens officiels du système francophone général.

**Étapes :**
1. Créer l'examen (ex : « BEPC 2027 ») avec ses dates.
2. **Inscrire** les élèves de 3ème (BEPC), de 1ère (Probatoire) ou de Terminale (Bac).
3. Enregistrer les **résultats** par candidat.
4. Consulter les résultats (page résultats).

**Vérifications :**
- ✅ Seuls les élèves de la bonne classe sont éligibles à l'inscription.
- ✅ CRUD examen, inscriptions (liste des candidats), saisie des résultats (admis/ajourné, notes).
- ✅ Résultats consultables et cohérents.
- ⚠️ Fonctionnalités futures non testables actuellement : génération des numéros de candidats GCE/Bac, publication en ligne des résultats.

---

## 10. Scénario E2E « Cycle complet Francophone Général »

Sur une école vierge avec **uniquement** le système Francophone Général :

1. Mise en place commune complète (doc 0) avec l'année 2026-2027.
2. Créer les niveaux : 6ème, 5ème, 4ème, 3ème, 2nde, 1ère, Terminale (ordre croissant).
3. Créer les séries : A, C, D.
4. Créer les matières : Maths, Français, Anglais, Physique-Chimie, SVT, Histoire-Géo, Philosophie, EPS.
5. Créer les classes : 6ème A, 5ème A, 4ème A, 3ème A, 2nde C, 2nde A, 1ère C, 1ère A, Tle C, Tle A.
6. Affecter les matières avec coefficients (ex : Maths 5 en 2nde C, 4 en 6ème).
7. Créer 2 enseignants ; assigner Maths-Fr-Ang ; nommer un prof principal par classe.
8. Créer 5 élèves (répartis en 6ème A et Tle C) avec comptes parents.
9. Configurer l'échelle /20 (passage 10) + les seuils de mentions.
10. Créer les offres de matières pour la période du trimestre 1 + composantes CC (40 %) / Composition (60 %).
11. Saisir les notes de séquence 1 pour les 2 classes.
12. Vérifier les moyennes/rangs/mentions à la main (calculs ci-dessus).
13. Générer le bulletin trimestriel d'un élève de 6ème A : vérifier note /20, coefficient, points, rang, mention.
14. Publier le bulletin → verrouiller → réviser (v2) → publier.
15. Télécharger le PDF.
16. Créer l'examen « BEPC » et inscrire les élèves de 3ème (au moins un élève).
17. Vérifier le dashboard (stats + activités récentes).

**Critère de réussite** : chaque note/moyenne/mention vérifiée à la main correspond exactement à l'affichage.

---

## 11. Checklist Francophone Général

- [ ] Échelle /20 + seuil 10 + arrondi configurés et appliqués
- [ ] Seuils de mentions : Excellent / Très bien / Bien / Assez bien / Passable / Insuffisant / Faible
- [ ] Offres de matières par classe+période avec coefficients
- [ ] Composantes CC (40 %) + Composition (60 %) ; moyenne pondérée correcte
- [ ] Saisie notes /20 par séquence ; statuts (absent, exempté) ; resit ; modification tracée
- [ ] Moyenne générale pondérée par coefficients exacte
- [ ] Rangs (classe + par matière), moyenne de classe, min/max/avg par matière
- [ ] Mention dérivée correcte ; appréciation auto modifiable
- [ ] Bulletin : DRAFT → PUBLISH → LOCK → UNLOCK → REVISE (v+1) → DELETE
- [ ] Bulletin « sans notes » : affiche « — », pas de 0 inventé
- [ ] PDF du bulletin conforme au format FR (BULLETIN TRIMESTRIEL, MINESEC)
- [ ] Assiduité remontée dans le bulletin (si présences saisies)
- [ ] Examens : BEPC, Probatoire, Baccalauréat (création, inscriptions, résultats)

---

> **Document suivant** : `docs/TESTING_FLOWS_02_ANGLOPHONE_GENERAL.md` pour le système anglophone général (GCE).
