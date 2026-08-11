# AKADEMEE — Guide de Test : Anglophone General (Document 2/6)

> **Prérequis** : avoir lu et exécuté le **Document 0 — Mise en place commune** (`docs/TESTING_FLOWS_00_COMMUN.md`).
> Ce document couvre les flows **spécifiques au système Anglophone General** (code Akademee : `anglophone_general` / `ANG_GEN`).

---

## 1. Contexte éducatif réel (pour bien tester)

Le sous-système anglophone du Cameroun (influence britannique, tutorat MINESEC, examens du **Cameroon GCE Board**). **Parcours officiel d'un élève :**

```
Nursery (2 ans : Nursery 1 & 2)
   ↓
Primary (6 ans : Class 1 → Class 6)
   ↓  Examen : FSLC (First School Leaving Certificate) — 12 épreuves, moyenne ≥ 50 %
SECONDARY — Lower cycle (5 ans) : Form 1 → Form 2 → Form 3 → Form 4 → Form 5
   ↓  Examen : GCE Ordinary Level (fin de Form 5) — minimum 4 matières réussies
HIGH SCHOOL — Upper cycle (2 ans) : Lower Sixth → Upper Sixth
   ↓  Choix de filière : Arts (A1–A8) ou Sciences (S1–S5)
   ↓  Examen : GCE Advanced Level — maximum ~5 matières (2-3 principales + General Paper)
   ↓
Université (admission : ≥ 2 passes A-Level + ≥ 4 passes O-Level)
```

**Points d'attention pour le testeur :**
- **Année scolaire** : septembre → juin, découpée en **3 Terms** et **6 séquences** (2 par term).
- **Notation GCE** : notes souvent en **pourcentage** (/100) converties en **grades** :
  | Grade | Plage | Statut |
  |-------|-------|--------|
  | A | 80–100 | Pass (Excellent) |
  | B | 70–79 | Pass (Very Good) |
  | C | 60–69 | Pass (Good) |
  | D | 50–59 | Pass/Credit (O-Level) — Fail à l'A-Level |
  | E | 40–49 | Pass (O-Level) — Fail à l'A-Level |
  | U | < 40 | Ungraded (Fail) |
- **Seuil de passage** : 50 % (moyenne), 4 passes O-Level pour progresser.
- **Filières du Upper Sixth** : **Arts** (Literature, History, Economics, Maths for Arts, Philosophy…) et **Science** (Maths, Physics, Chemistry, Biology, Geology).
- **Coefficients** : présents mais moins normalisés qu'en francophone — chaque école fixe les siens (l'app les gère par classe).

---

## 2. Ce qu'Akademee implémente pour ce système

| Élément | Valeur Akademee |
|---------|-----------------|
| Code système | `ANG_GEN` (`anglophone_general`) |
| Hiérarchie de périodes | `sequence` → `term` |
| Documents de bulletin | « SEQUENTIAL REPORT CARD » (6/an), « TERM REPORT CARD » (3/an), « ANNUAL REPORT CARD » (1/an) |
| Langue du bulletin | Anglais (labels, MINISTRY OF SECONDARY EDUCATION) |
| Échelle de notes | Configurable par l'école (recommandé : 0–100, seuil 50) |
| Niveaux types | Form 1–5 (Lower Secondary), Lower Sixth & Upper Sixth (Upper Secondary) |
| Filières (series) | Arts (A1–A8), Science (S1–S5) |
| Examens officiels | GCE O-Level, GCE A-Level |

---

## 3. Ordre des flows spécifiques

```
F-1  Configuration de la notation (échelle /100, grades, offres de matières, composantes)
F-2  Saisie des notes (par classe / matière / séquence)
F-3  Calculs & vérifications (moyennes %, grades, rangs)
F-4  Génération du bulletin (cycle DRAFT → PUBLISH → LOCK)
F-5  Export PDF & impression du bulletin
F-6  Examens officiels (GCE O-Level & A-Level)
```

---

## 4. Flow F-1 — Configuration de la notation

### F-1.1 Échelle de notation
- **Où** : `/dashboard/grading-config`
- **Étapes** : créer une échelle « GCE /100 » (min 0, max 100) + version avec **seuil de passage 50**.
- **Vérifications** : la version active est utilisée ; une échelle 0–20 reste possible (config flexible) mais pour l'anglophone les scores sur 100 sont recommandés.

### F-1.2 Grades & mentions (A–F / U)
- **Où** : `/dashboard/grading-config` (seuils de mentions)
- **Exemple de seuils** à configurer pour refléter la grille GCE (⚠️ configurables par école — vérifier ceux réellement enregistrés) :

| Mention | Plage moyenne (%) |
|---------|-------------------|
| A (Excellent) | 80 – 100 |
| B (Very Good) | 70 – 79.99 |
| C (Good) | 60 – 69.99 |
| D (Credit) | 50 – 59.99 |
| E (Pass) | 40 – 49.99 |
| U (Ungraded) | < 40 |

- **Vérifications** : une moyenne de 75 % affiche le grade B ; 49 % → E ; 38 % → U. Seuils modifiables sans doublons.

### F-1.3 Offres de matières & coefficients
- **Où** : `/dashboard/subject-offerings`
- **Étapes** : lier matières ↔ classe ↔ période avec **coefficient** (ex : Maths 4, English 3, Biology 3…).
- **Vérifications** : seule une matière liée apparaît dans la saisie et au bulletin.

### F-1.4 Composantes d'évaluation
- **Où** : détail d'une offre de matière
- **Étapes** : définir les composantes. En contexte anglophone typique : **Continuous Assessment (CA)** (ex : 40 %, /100) + **Exam** (60 %, /100). Possibles aussi : Theory, Practical.
- **Vérifications** :
  - ✅ Moyenne matière = pondération CA/Exam ramenée sur la note max.
  - ✅ Composante non notée → moyenne calculée sur les composantes renseignées (proportionnelle).
  - ✅ Aucune note → moyenne `null`, bulletin affiche « — ».

---

## 5. Flow F-2 — Saisie des notes

- **Où** : `/dashboard/grade-entry` (enseignant), `/dashboard/grades` (admin), `/dashboard/grades/anglophone`
- **Objectif** : saisir les notes (en % ou /20 selon l'école) par élève, matière, composante et séquence.

**Étapes :**
1. Classe (ex : Form 3) → matière (ex : Mathematics) → séquence/term.
2. Saisir CA et Exam de chaque élève.
3. Enregistrer.

**Vérifications :**
- ✅ Persistance + réaffichage après rechargement.
- ✅ Bulk upload (Excel) si disponible.
- ✅ Statuts d'évaluation : `GRADED`, absences justifiées/non, `PENDING`, `EXEMPTED`.
- ✅ Modification tracée (`previous_score` + audit).
- ✅ Resit (`is_resit`).

**Cas limites :** élève absent (statut, pas de note) ; élève ajouté en cours de term (apparaît, notes vides).

---

## 6. Flow F-3 — Calculs & vérifications

> Toujours calculer à la main avant de valider.

**Scénario type (Form 3, 2 élèves, notes sur 100) :**

| Élève | Maths (coeff 4) | English (coeff 3) | Biology (coeff 3) | Moyenne attendue |
|-------|-----------------|--------------------|--------------------|------------------|
| A     | 85              | 72                 | 60                 | `(85×4 + 72×3 + 60×3)/10 = (340+216+180)/10 = 73,6 %` → **B** |
| B     | 45              | 52                 | 38                 | `(45×4 + 52×3 + 38×3)/10 = (180+156+114)/10 = 45 %` → **E** |

**Vérifications :**
- ✅ Moyenne matière = pondération des composantes (CA/Exam) ramenée sur 100.
- ✅ Moyenne générale = `Σ(note × coeff) / Σcoeff`, arrondie 2 décimales.
- ✅ **Grade** dérivé des seuils (73,6 → B ; 45 → E).
- ✅ **Rang** classe + rang par matière ; moyenne de classe ; min/max/avg par matière.
- ✅ **Appréciation automatique** en anglais (Excellent, Very good, Good, Fairly good, Passable, Insufficient, Weak) — modifiable.
- ✅ **Rang partiel** signalé si des élèves n'ont pas de notes.

**API** : `GET /api/v1/calculations/subject-average`, `period-average`, `cohort-ranks`.

---

## 7. Flow F-4 — Génération du bulletin

- **Où** : `/dashboard/report-cards`
- **Objectif** : générer le report card d'un élève / d'une classe pour une **séquence** ou un **term**, et tester le cycle de vie.

**Cycle de vie :**

```
DRAFT ──(publish)──▶ PUBLISHED ──(lock)──▶ LOCKED
  ▲                     │                     │
  └──────(unlock)───────┴────(revise)────────┘   (revise = DRAFT v+1)
```

**Contenu attendu (version EN) :**
- En-tête : REPUBLIC OF CAMEROON, MINISTRY OF SECONDARY EDUCATION, school name, « SEQUENTIAL / TERM / ANNUAL REPORT CARD », academic year.
- Student info : name, class, DOB, reg. no., **rank / class size**.
- Subjects table : subject, teacher, **score**, coefficient, weighted score, **grade (A–F)**, rank, remark.
- Summary : **OVERALL AVERAGE (%)**, class average, rank, **grade/honours**, pass mark (50).
- Attendance : present / absent / late over the period.
- Signatures : Subject Teacher, Principal, Parent/Guardian.

**Vérifications par statut :**
- **DRAFT** : valeurs calculées, modifiable, version 1.
- **PUBLISH** : horodaté `PUBLISHED`.
- **LOCK** : plus modifiable par les notes.
- **UNLOCK** : seulement depuis `LOCKED` (sinon erreur).
- **REVISE** : nouvelle version DRAFT v+1, l'ancienne passe `LOCKED`.
- **DELETE** : bulletin + lignes + jobs nettoyés.

**Cas limites :** élève sans notes (« — », pas de grade inventé) ; élève non inscrit (erreur) ; régénération après changement de notes (recalcul) ; génération en masse (queue, statuts QUEUED → PROCESSING → COMPLETED/FAILED).

---

## 8. Flow F-5 — Export PDF & impression

- **Où** : fiche bulletin (`/dashboard/report-cards`) — bouton PDF/Print
- **Vérifications** :
  - ✅ PDF téléchargeable et conforme à l'aperçu (logo, tableau, grades, signatures).
  - ✅ Format **ANG_GEN** respecté : « TERM REPORT CARD », labels anglais, MINISTRY OF SECONDARY EDUCATION.
  - ✅ Export ZIP pour toute une classe si disponible.
  - ✅ Testé sur Chrome + Firefox (rendu client html2canvas/jsPDF actuellement).

---

## 9. Flow F-6 — Examens officiels (GCE)

- **Où** : `/dashboard/exams/gce-o-level`, `/dashboard/exams/gce-a-level`, `/dashboard/exams/gce-results`
- **Objectif** : gérer les examens GCE.

**Étapes :**
1. Créer l'examen (ex : « GCE O-Level 2027 ») + dates.
2. **Inscrire** les candidats : Form 5 pour l'O-Level ; Lower/Upper Sixth pour l'A-Level.
3. Enregistrer les **résultats** (grades A–U par matière).
4. Consulter les résultats.

**Vérifications :**
- ✅ Éligibilité : seuls les bons niveaux peuvent être inscrits.
- ✅ CRUD examen, inscriptions, saisie résultats (grade/statut), consultation.
- ✅ Cohérence des grades saisis (A–U).
- ⚠️ Non testable actuellement : génération des numéros de candidats GCE, publication en ligne.

---

## 10. Scénario E2E « Cycle complet Anglophone General »

Sur une école vierge avec **uniquement** le système Anglophone General :

1. Mise en place commune (doc 0) + année 2026-2027 avec **3 Terms** générés.
2. Créer les niveaux : Form 1 → Form 5, Lower Sixth, Upper Sixth (ordre).
3. Créer les filières : Arts, Science.
4. Créer les matières : English Language, Mathematics, Physics, Chemistry, Biology, Literature, History.
5. Créer les classes : Form 1, Form 3, Form 5, Lower Sixth Science, Upper Sixth Science.
6. Affecter les matières avec coefficients ; assigner 2 enseignants ; prof principal.
7. Créer 5 élèves avec comptes parents ; inscrire en Form 3 et Form 5.
8. Configurer l'échelle /100 (seuil 50) + grades A–U.
9. Offres de matières (Term 1) + composantes CA (40 %) / Exam (60 %).
10. Saisir les notes de la séquence 1 (scores en %).
11. Vérifier moyennes/grades/rangs à la main.
12. Générer le TERM REPORT CARD d'un élève de Form 3 : score %, grade, rang, honours.
13. Publier → verrouiller → réviser (v2) → publier.
14. Télécharger le PDF (version anglaise).
15. Créer l'examen GCE O-Level et inscrire un élève de Form 5.
16. Vérifier le dashboard admin (stats + activités récentes).

**Critère de réussite** : chaque moyenne/grade vérifié à la main correspond à l'affichage.

---

## 11. Checklist Anglophone General

- [ ] Échelle /100, seuil 50, arrondi appliqués
- [ ] Grades A / B / C / D / E / U dérivés correctement
- [ ] Offres de matières par classe+term avec coefficients
- [ ] Composantes CA + Exam ; moyenne pondérée exacte
- [ ] Saisie notes (%) ; statuts ; resit ; modification tracée
- [ ] Moyenne générale pondérée ; rang classe + par matière ; moyenne de classe
- [ ] Appréciations en anglais ; grade au bulletin
- [ ] Report card : DRAFT → PUBLISH → LOCK → UNLOCK → REVISE → DELETE
- [ ] Bulletin sans notes : « — », pas de grade inventé
- [ ] PDF conforme au format EN (TERM REPORT CARD, MINESEC)
- [ ] Assiduité au bulletin
- [ ] Examens GCE O-Level & A-Level (création, inscriptions, résultats)

---

> **Document suivant** : `docs/TESTING_FLOWS_03_FRANCOPHONE_TECHNIQUE.md` pour le système francophone technique.
