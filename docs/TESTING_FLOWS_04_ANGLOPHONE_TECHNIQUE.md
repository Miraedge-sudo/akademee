# AKADEMEE — Guide de Test : Anglophone Technical (Document 4/6)

> **Prérequis** : avoir lu et exécuté le **Document 0 — Mise en place commune** (`docs/TESTING_FLOWS_00_COMMUN.md`).
> Ce document couvre les flows **spécifiques au système Anglophone Technical** (code Akademee : `anglophone_technical` / `ANG_TECH`).

---

## 1. Contexte éducatif réel (pour bien tester)

Le sous-système anglophone technique du Cameroun se déroule dans les **Technical Colleges** (ex : Government Technical Colleges) sous la tutelle du MINESEC, avec des examens organisés par le **Cameroon GCE Board** pour les filières techniques (TVEE) et par l'OBC pour les filières bilingues (CAP/BTC). **Parcours type :**

```
Primary → FSLC
   ↓
TECHNICAL COLLEGE — 1st cycle (Forms 1–3) → Technical School Certificate
   ↓
TECHNICAL COLLEGE — 2nd cycle (Forms 4–5) → Technical College Certificate
   ↓  Examen : TVEE INTERMEDIATE LEVEL (TVEE IL) en fin de Form 5
HIGH SCHOOL — Lower Sixth → Upper Sixth (Technical)
   ↓  Examen : TVEE ADVANCED LEVEL (TVEE AL) en fin d'Upper Sixth
   ↓
Universités / polytechniques / vie active
```

**Les deux grands groupes de spécialités :**
- **Industrial Specialties** : Woodwork (menuiserie-bois), Mechanics (mécanique auto/industrielle), Electrical & Electronics (électrotechnique, électronique), Building & Civil (construction, génie civil).
- **Commercial Specialties** : Accounting (comptabilité), Secretarial (secrétariat), Management / Business Studies, Home Economics.

**Points d'attention pour le testeur :**
- **Année scolaire** : septembre → juin, **3 Terms**, 6 séquences.
- **Notation** : scores souvent en **pourcentage** convertis en **grades** (A–U) comme au GCE ; seuil de passage **50 %**.
- **Épreuves pratiques** : les matières techniques combinent **theory** et **practical** (workshop) — le bulletin peut afficher des scores séparés.
- **Examens** : **TVEE IL** (fin de Form 5) et **TVEE AL** (fin d'Upper Sixth) ; selon les écoles bilingues, CAP/BTC.
- **Coefficients** : les matières de spécialité portent les coefficients/pondérations les plus élevés.

---

## 2. Ce qu'Akademee implémente pour ce système

| Élément | Valeur Akademee |
|---------|-----------------|
| Code système | `ANG_TECH` (`anglophone_technical`) |
| Hiérarchie de périodes | `sequence` → `term` |
| Documents de bulletin | « SEQUENTIAL REPORT CARD (TECHNICAL) », « TERM REPORT CARD (TECHNICAL) », « ANNUAL REPORT CARD (TECHNICAL) » |
| Langue du bulletin | Anglais (MINISTRY OF SECONDARY EDUCATION — TECHNICAL & VOCATIONAL) |
| Échelle de notes | Configurable (recommandé : 0–100, seuil 50) |
| Niveaux types | Form 1–5 (Technical), Lower & Upper Sixth (Technical) |
| Filières (series) | Industrial Specialties (`/dashboard/series/industrial`), Commercial Specialties (`/dashboard/series/commercial`) |
| Spécificité bulletin | **Mode « scores séparés »** theory / practical |
| Examens officiels | TVEE Intermediate Level, TVEE Advanced Level |

---

## 3. Ordre des flows spécifiques

```
F-1  Configuration de la notation (échelle, grades, offres, composantes theory/practical)
F-2  Saisie des notes (avec workshop/practical)
F-3  Calculs & vérifications
F-4  Génération du bulletin technique (mode scores séparés)
F-5  Export PDF & impression
F-6  Examens officiels (TVEE IL & AL)
```

---

## 4. Flow F-1 — Configuration de la notation

### F-1.1 Échelle de notation
- **Où** : `/dashboard/grading-config`
- **Étapes** : échelle 0–100, version avec seuil **50** (ou 0–20 selon l'école), arrondi `round_half_up`.
- **Vérifications** : la version active s'applique aux bulletins.

### F-1.2 Grades (A–F / U)
- **Où** : `/dashboard/grading-config` — seuils type GCE (cf. document 2) : A (80–100), B (70–79), C (60–69), D (50–59), E (40–49), U (< 40).
- **Vérifications** : moyenne 75 % → B ; 45 % → E ; 35 % → U.

### F-1.3 Offres de matières & coefficients
- **Où** : `/dashboard/subject-offerings`
- **Étapes** : lier matières ↔ classe technique ↔ période ; **pondérer fortement les matières de spécialité** (ex : Woodwork 6, Electrical Installation 5).
- **Vérifications** : le coefficient de la classe prime ; seules les matières liées apparaissent au bulletin.

### F-1.4 Composantes d'évaluation (theory / practical)
- **Où** : détail d'une offre de matière
- **Étapes** : définir **Theory** (ex : 40 %) et **Practical / TP** (ex : 60 %), éventuellement **CA** (Continuous Assessment) et **Exam**.
- 🏷️ **Correspondance avec l'app** : types de composantes = `CONTINUOUS_ASSESSMENT`/CA, `EXAM`, `THEORY`, `PRACTICAL`/TP.
- **Vérifications** :
  - ✅ Moyenne matière = pondération des composantes ramenée sur la note max.
  - ✅ Le bulletin technique affiche les **scores séparés** theory/practical (mode split activé pour `ANG_TECH`).
  - ✅ Composante non notée → moyenne proportionnelle ; aucune note → « — ».

---

## 5. Flow F-2 — Saisie des notes

- **Où** : `/dashboard/grade-entry` (enseignant), `/dashboard/grades` (admin), `/dashboard/grades/anglophone`
- **Objectif** : saisir theory + practical par élève/matière/séquence.

**Étapes :**
1. Classe technique (ex : Form 5 Electrical) → matière (ex : Electrical Installation) → séquence.
2. Saisir Theory et Practical de chaque élève.
3. Enregistrer.

**Vérifications :**
- ✅ Persistance + réaffichage ; bulk upload si disponible.
- ✅ Statuts (GRADED, absences, PENDING, EXEMPTED) ; modification tracée ; resit.
- ✅ Les scores pratiques (workshop) apparaissent séparément au bulletin.

**Cas limites :** élève absent au workshop (statut) ; élève ajouté en cours de term.

---

## 6. Flow F-3 — Calculs & vérifications

> Toujours calculer à la main.

**Scénario type (Form 4 Technical, 2 élèves, notes sur 100) :**

| Élève | Woodwork (coeff 6) | Mathematics (coeff 4) | English (coeff 3) | Moyenne attendue |
|-------|--------------------|-----------------------|-------------------|------------------|
| A     | 78                 | 65                    | 70                 | `(78×6 + 65×4 + 70×3)/13 = (468+260+210)/13 = 72,2 %` → **B** |
| B     | 44                 | 51                    | 48                 | `(44×6 + 51×4 + 48×3)/13 = (264+204+144)/13 = 47,1 %` → **E** |

**Vérifications :**
- ✅ Pondération par coefficients (spécialité la plus lourde).
- ✅ Moyenne générale arrondie ; rang ; moyenne de classe ; min/max/avg par matière.
- ✅ Grade dérivé (72,2 → B ; 47,1 → E).
- ✅ **Note pratique** : Theory 55 + Practical 80 (60 %) → `(55×0,4 + 80×0,6) = 70 %`.
- ✅ Appréciation auto en anglais ; rang partiel signalé si élèves incomplets.

**API** : `GET /api/v1/calculations/subject-average`, `period-average`, `cohort-ranks`.

---

## 7. Flow F-4 — Génération du bulletin technique

- **Où** : `/dashboard/report-cards`
- **Objectif** : générer le report card d'un élève/classe technique, vérifier le mode scores séparés.

**Cycle de vie :** `DRAFT → PUBLISH → LOCK → UNLOCK → REVISE → DELETE`.

**Contenu attendu (EN, technical) :**
- En-tête : REPUBLIC OF CAMEROON, MINISTRY OF SECONDARY EDUCATION — TECHNICAL & VOCATIONAL, school name, « TERM REPORT CARD (TECHNICAL) », academic year.
- Student info : name, class (ex : Form 5 Electrical), specialty, reg. no., rank/class size.
- Subjects table : subject, teacher, **theory score**, **practical score** (si split), overall score, coefficient, weighted score, **grade (A–U)**, rank, remark.
- Summary : overall average (%), class average, rank, grade/honours, pass mark (50).
- Attendance + signatures (Subject Teacher, Principal, Parent/Guardian).

**Vérifications :**
- ✅ Scores séparés theory/practical affichés pour les classes `ANG_TECH`.
- ✅ DRAFT → PUBLISH → LOCK → UNLOCK → REVISE (v+1) → DELETE.
- ✅ Élève sans notes → « — » ; non inscrit → erreur ; régénération → recalcul.
- ✅ Génération en masse (queue : QUEUED → PROCESSING → COMPLETED/FAILED).

---

## 8. Flow F-5 — Export PDF & impression

- **Où** : fiche bulletin → bouton PDF/Print
- **Vérifications :**
  - ✅ PDF conforme (theory/practical visibles, logo, signatures).
  - ✅ Format EN technique : « TERM REPORT CARD (TECHNICAL) », MINESEC TECHNICAL & VOCATIONAL.
  - ✅ Export ZIP classe si disponible ; testé Chrome + Firefox.

---

## 9. Flow F-6 — Examens officiels (TVEE)

- **Où** : `/dashboard/exams/tvee-il`, `/dashboard/exams/tvee-al`, `/dashboard/exams/tvee-results`
- **Objectif** : gérer les examens TVEE.

**Étapes :**
1. Créer l'examen (ex : « TVEE IL 2027 — Electrical »).
2. Inscrire les candidats : **Form 5** pour TVEE IL ; **Lower/Upper Sixth** pour TVEE AL.
3. Enregistrer les résultats (grades A–U, avec practical le cas échéant).
4. Consulter les résultats.

**Vérifications :**
- ✅ Éligibilité par niveau correcte.
- ✅ CRUD examen, inscriptions, résultats, consultation.
- ✅ Résultats pratiques distincts saisissables si le champ existe.
- ⚠️ Non testable actuellement : numéros de candidats, publication en ligne.

---

## 10. Scénario E2E « Cycle complet Anglophone Technical »

Sur une école vierge avec **uniquement** le système Anglophone Technical :

1. Mise en place commune (doc 0) + année 2026-2027 avec **3 Terms**.
2. Créer les niveaux : Form 1 → Form 5 (Technical), Lower Sixth, Upper Sixth (Technical).
3. Créer les filières : **Industrial** (Electrical, Woodwork) et **Commercial** (Accounting, Secretarial).
4. Créer les matières : Electrical Installation, Workshop Practice, Woodwork, Accounting, Mathematics, English.
5. Créer les classes : Form 1, Form 4 Electrical, Form 5 Commercial, Upper Sixth Electrical.
6. Affecter avec **coefficients élevés sur les spécialités** ; assigner enseignants ; prof principal.
7. Créer 4 élèves avec parents ; inscrire en Form 4 et Form 5.
8. Configurer l'échelle /100 (seuil 50) + grades A–U.
9. Offres de matières (Term 1) + composantes **Theory** (40 %) / **Practical** (60 %).
10. Saisir les notes de séquence 1 (theory + workshop).
11. Vérifier moyennes/grades à la main.
12. Générer le TERM REPORT CARD d'un élève de Form 4 Electrical : vérifier **scores séparés**, coefficient, grade, rang.
13. Publier → verrouiller → réviser (v2) → publier.
14. Télécharger le PDF.
15. Créer l'examen TVEE IL et inscrire les élèves de Form 5.
16. Vérifier le dashboard (stats + activités récentes).

**Critère de réussite** : scores theory/practical corrects au bulletin ; grades conformes à la grille GCE.

---

## 11. Checklist Anglophone Technical

- [ ] Échelle /100, seuil 50, grades A–U dérivés correctement
- [ ] Filières Industrial & Commercial créées et rattachées aux classes
- [ ] Coefficients élevés sur les matières de spécialité
- [ ] Composantes Theory + Practical configurées ; moyenne pondérée exacte
- [ ] Saisie theory + workshop ; statuts ; resit ; modification tracée
- [ ] Moyenne générale pondérée ; rangs ; moyenne de classe ; grade
- [ ] Bulletin technique : **scores séparés theory/practical** affichés
- [ ] Cycle DRAFT → PUBLISH → LOCK → UNLOCK → REVISE → DELETE
- [ ] PDF conforme au format EN technique (TECHNICAL & VOCATIONAL)
- [ ] Examens TVEE IL & AL (création, inscriptions, résultats)

---

> **Fin des documents système.** Pour rappel, l'**Université (LMD)** n'est pas couverte : le module est encore en développement et ses flows ne sont pas complets. Reprenez le **Document 0** pour les parcours communs transverses.
