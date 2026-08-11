# AKADEMEE — Guide de Test : Système Francophone Technique (Document 3/6)

> **Prérequis** : avoir lu et exécuté le **Document 0 — Mise en place commune** (`docs/TESTING_FLOWS_00_COMMUN.md`).
> Ce document couvre les flows **spécifiques au système Francophone Technique** (code Akademee : `francophone_technical` / `FR_TECH`).

---

## 1. Contexte éducatif réel (pour bien tester)

Le sous-système francophone technique (tutelle MINESEC — Direction de l'Enseignement Technique, examens de l'**OBC**). Il se déroule dans les **Lycées Techniques**, **CETIC** (Collèges d'Enseignement Technique Industriel et Commercial) et **CETIF**. **Parcours officiel :**

```
Primaire → CEP / concours d'entrée
   ↓
1er CYCLE technique (4 ans) : 1ère Année T → 2ème Année T → 3ème Année T → 4ème Année T
   ↓  Diplôme : CAP (Certificat d'Aptitude Professionnelle) ou BEPC Technique (fin de 4ème T)
2nd CYCLE technique (3 ans) : Seconde T → Première T → Terminale T
   ↓  Examen : PROBATOIRE TECHNIQUE (fin de 1ère)
   ↓  Examen : BAC TECHNIQUE ou Brevet de Technicien (BT) (fin de Terminale)
   ↓
ENSET / Universités / Écoles Polytechniques / vie active
```

**Les deux grandes filières du 2nd cycle :**
- **Filière Tertiaire (STT — Sciences et Technologies du Tertiaire)** : ACA (Action et Communication Administratives), CG (Comptabilité-Gestion), ACC (Action et Communication Commerciales), FIG (Fiscalité et Informatique de Gestion), SES… ; **BT** : Hôtellerie-Restauration, Tourisme, ESF (Économie Sociale et Familiale).
- **Filière Industrielle (IND)** : Génie mécanique & auto (F1, F2 Électronique, F3 Électrotechnique, F5 Froid, AF1-3, CMA, MEM, BIJO), Génie civil & bois (F4/BA, F4/BE, F4/TP, GT, IB-TMG, AMEB), Génie chimique & santé (F6/BIPE, F6/COPH, F6/MIPE, F7, F8, MHB), filières agricoles (TAG).

**Points d'attention pour le testeur :**
- **Notation** : notes sur **/20**, passage à **10/20**.
- **Coefficients** : les **matières professionnelles** (technologie, construction, atelier, comptabilité) ont les **coefficients les plus élevés** (4 à 8+), devant les matières scientifiques puis littéraires.
- **Épreuves pratiques** : le Bac technique / les séries industrielles combinent **épreuves écrites** et **épreuves pratiques** (atelier, labo) — le bulletin technique peut donc afficher des scores séparés (théorie / pratique).
- 🏷️ **Note sur les libellés** : le 1er cycle réel (1ère T → 4ème T) est libellé dans l'app « **Collège Technique (6ᵉ–3ᵉ)** » et le 2nd cycle « **Lycée Technique (Seconde–Terminale)** » — c'est la même réalité, avec les noms de l'UI.
- **Examens** : CAP, BEPC Technique, Probatoire Technique, Bac Technique / BT.
- **Formation professionnelle** (CFP, ENIET) : hors périmètre classique des lycées techniques, mais existe en parallèle.

---

## 2. Ce qu'Akademee implémente pour ce système

| Élément | Valeur Akademee |
|---------|-----------------|
| Code système | `FR_TECH` (`francophone_technical`) |
| Hiérarchie de périodes | `sequence` → `trimestre` |
| Documents de bulletin | « BULLETIN DE SÉQUENCE (TECHNIQUE) », « BULLETIN TRIMESTRIEL (TECHNIQUE) », « BULLETIN ANNUEL (TECHNIQUE) » |
| Langue du bulletin | Français (MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES — ENS. TECHNIQUE) |
| Échelle de notes | 0 à 20, seuil 10, arrondi `round_half_up` |
| Niveaux types | 2nde T, 1ère T, Tle T (rattachés à une filière) ; 1er cycle : 6ème–3ème technique |
| Filières (series) | Filière Industrielle (`/dashboard/series/industriel`), Filière Tertiaire STT (`/dashboard/series/tertiaire`) |
| Spécificité bulletin | **Mode « scores séparés »** théorie / pratique (composantes Theory + Practical/TP) |
| Examens officiels | CAP, Probatoire Technique, Bac Technique / BT |

---

## 3. Ordre des flows spécifiques

```
F-1  Configuration de la notation (échelle, mentions, offres, composantes théorie/pratique)
F-2  Saisie des notes (avec épreuves pratiques)
F-3  Calculs & vérifications (coefficients pro élevés, moyenne pondérée)
F-4  Génération du bulletin technique (mode scores séparés)
F-5  Export PDF & impression
F-6  Examens officiels (CAP, Probatoire Technique, Bac Technique)
```

---

## 4. Flow F-1 — Configuration de la notation

### F-1.1 Échelle de notation
- **Où** : `/dashboard/grading-config`
- **Étapes** : échelle 0–20, version avec seuil **10**, arrondi `round_half_up`, précision 2.
- **Vérifications** : la version active s'applique aux bulletins techniques.

### F-1.2 Seuils de mentions (FR)
- **Où** : `/dashboard/grading-config` — mêmes mentions que le général francophone (Excellent ≥17, Très bien ≥16, Bien ≥14, Assez bien ≥12, Passable ≥10, Insuffisant ≥8, Faible <8).
- **Vérifications** : cohérence des plages, pas de chevauchement.

### F-1.3 Offres de matières & coefficients
- **Où** : `/dashboard/subject-offerings`
- **Étapes** : lier matières ↔ classe technique ↔ période. **Vérifier que les matières professionnelles ont des coefficients élevés** (ex : Technologie de spécialité 6, Comptabilité 5, Atelier 5).
- **Vérifications** : le coefficient de la classe prime sur l'offre ; seules les matières liées apparaissent au bulletin.

### F-1.4 Composantes d'évaluation (théorie / pratique)
- **Où** : détail d'une offre de matière
- **Étapes** : définir les composantes. **Spécifique au technique** : prévoir à la fois **Theory** (cours, ex : 40 %) et **Practical / TP** (atelier, ex : 60 %) — en plus des éventuelles **CC** (Contrôle Continu) et **Composition**.
- 🏷️ **Correspondance avec l'app** : types de composantes = `CONTINUOUS_ASSESSMENT`/CC, `EXAM` (la « Composition »), `THEORY`, `PRACTICAL`/TP.
- **Vérifications** :
  - ✅ La moyenne matière pondère chaque composante par son `weight_percent`.
  - ✅ Le bulletin technique affiche les **scores séparés** (théorie / pratique) quand les composantes sont renseignées (mode split).
  - ✅ Composante non notée → moyenne proportionnelle sur les composantes notées.
  - ✅ Aucune note → moyenne `null`, « — » au bulletin.

---

## 5. Flow F-2 — Saisie des notes

- **Où** : `/dashboard/grade-entry` (enseignant), `/dashboard/grades` (admin)
- **Objectif** : saisir notes de cours ET notes pratiques par élève/matière/séquence.

**Étapes :**
1. Sélectionner classe technique (ex : Tle TIG) → matière pro (ex : Comptabilité) → séquence.
2. Saisir les composantes (Theory, Practical, CC, Composition) de chaque élève.
3. Enregistrer.

**Vérifications :**
- ✅ Persistance + réaffichage.
- ✅ Bulk upload si disponible.
- ✅ Statuts (GRADED, absences, PENDING, EXEMPTED) ; modification tracée ; resit.
- ✅ Les notes pratiques (TP) sont bien saisies et apparaissent séparément au bulletin.

**Cas limites :** élève absent à l'atelier (statut, pas de note pratique) ; élève ajouté en cours d'année.

---

## 6. Flow F-3 — Calculs & vérifications

> Toujours calculer à la main.

**Scénario type (classe Tle TIG, 2 élèves) :**

| Élève | Comptabilité (coeff 5) | Maths (coeff 4) | Français (coeff 2) | Moyenne attendue |
|-------|------------------------|------------------|--------------------|------------------|
| A     | 15                     | 12               | 11                 | `(15×5 + 12×4 + 11×2)/11 = (75+48+22)/11 = 13,18` → **Assez bien** |
| B     | 7                      | 9                | 10                 | `(7×5 + 9×4 + 10×2)/11 = (35+36+20)/11 = 8,27` → **Insuffisant** |

**Vérifications :**
- ✅ Pondération par coefficients (les matières pro pèsent plus lourd).
- ✅ Moyenne générale arrondie 2 décimales ; rang ; moyenne de classe ; min/max/avg par matière.
- ✅ Mention dérivée ; appréciation auto en français.
- ✅ **Note pratique** : vérifier qu'une matière avec Theory 10/20 et Practical 16/20 (60 %) donne `(10×0,4 + 16×0,6) = 13,6/20`.
- ✅ Rang partiel signalé si élèves incomplets.

**API** : `GET /api/v1/calculations/subject-average`, `period-average`, `cohort-ranks`.

---

## 7. Flow F-4 — Génération du bulletin technique

- **Où** : `/dashboard/report-cards`
- **Objectif** : générer le bulletin d'un élève/classe technique et vérifier le **mode scores séparés**.

**Cycle de vie :** identique aux autres systèmes : `DRAFT → PUBLISH → LOCK → UNLOCK → REVISE → DELETE`.

**Contenu attendu (FR, technique) :**
- En-tête : République du Cameroun, MINESEC — **ENS. TECHNIQUE**, établissement, « BULLETIN TRIMESTRIEL (TECHNIQUE) », année scolaire.
- Infos élève : nom, classe (ex : Tle TIG), filière, matricule, rang/effectif.
- Tableau des matières : matière, enseignant, **note théorie**, **note pratique** (si split), note /20, coefficient, points, rang, appréciation.
- Résumé : moyenne générale /20, moyenne de classe, rang, **mention**.
- Assiduité + signatures (prof principal, chef d'établissement, parent).

**Vérifications :**
- ✅ Les bulletins des classes **techniques** affichent les scores séparés théorie/pratique quand disponibles (mode split activé pour `FR_TECH`).
- ✅ DRAFT → PUBLISH → LOCK → UNLOCK → REVISE (v+1) → DELETE fonctionnels.
- ✅ Élève sans notes → « — » ; élève non inscrit → erreur ; régénération → recalcul.
- ✅ Génération en masse via la file de travaux (statuts QUEUED → PROCESSING → COMPLETED/FAILED).

---

## 8. Flow F-5 — Export PDF & impression

- **Où** : fiche bulletin → bouton PDF/Print
- **Vérifications :**
  - ✅ PDF conforme à l'aperçu (théorie/pratique visibles, logo, signatures).
  - ✅ Format FR technique : « BULLETIN TRIMESTRIEL (TECHNIQUE) », MINESEC ENS. TECHNIQUE.
  - ✅ Export ZIP classe si disponible ; testé Chrome + Firefox.

---

## 9. Flow F-6 — Examens officiels techniques

- **Où** : `/dashboard/exams/cap`, `/dashboard/exams/probatoire-technique`, `/dashboard/exams/bac-technique`, `/dashboard/exams/tech-results`
- **Objectif** : gérer les examens du technique francophone.

**Étapes :**
1. Créer l'examen (ex : « Bac Technique 2027 — F3 Électrotechnique »).
2. Inscrire les candidats (4ème T pour le CAP, 1ère T pour le Probatoire technique, Tle T pour le Bac technique).
3. Enregistrer les résultats (avec épreuves pratiques le cas échéant).
4. Consulter les résultats.

**Vérifications :**
- ✅ Éligibilité par niveau correcte.
- ✅ CRUD examen, inscriptions, résultats, consultation.
- ✅ Possibilité de saisir des **résultats pratiques** distincts si le champ existe.
- ⚠️ Non testable actuellement : numéros de candidats, publication en ligne.

---

## 10. Scénario E2E « Cycle complet Francophone Technique »

Sur une école vierge avec **uniquement** le système Francophone Technique :

1. Mise en place commune (doc 0) + année 2026-2027.
2. Créer les niveaux : 1er cycle (1ère T → 4ème T) et 2nd cycle (2nde T, 1ère T, Tle T) — ou utiliser 6ème–3ème technique / 2nde–Tle.
3. Créer les filières : **Industrielle** (ex : F3 Électrotechnique) et **Tertiaire** (ex : STT-CG).
4. Créer les matières : Technologie de spécialité, Atelier, Comptabilité, Économie, Droit, Maths, Français, Anglais, Techniques Quantitatives, Bureautique.
5. Créer les classes : 2nde TIG, 1ère TIG, Tle TIG (tertiaire) — exemples.
6. Affecter avec **coefficients pro élevés** (Comptabilité 5, Atelier 5, Technologie 6) ; assigner enseignants ; prof principal.
7. Créer 4 élèves avec parents ; inscrire en 1ère TIG et Tle TIG.
8. Configurer l'échelle /20 + mentions.
9. Offres de matières (trimestre 1) + composantes **Theory** (40 %) / **Practical** (60 %) + CC/Composition.
10. Saisir les notes de séquence 1 (y compris pratiques).
11. Vérifier moyennes/mentions à la main.
12. Générer le bulletin trimestriel d'un élève de Tle TIG : vérifier **scores séparés théorie/pratique**, coefficient, points, rang, mention.
13. Publier → verrouiller → réviser (v2) → publier.
14. Télécharger le PDF.
15. Créer l'examen « Bac Technique » et inscrire les élèves de Tle TIG.
16. Vérifier le dashboard (stats + activités récentes).

**Critère de réussite** : les notes pratiques pèsent dans la moyenne comme configuré ; le bulletin affiche bien théorie/pratique.

---

## 11. Checklist Francophone Technique

- [ ] Échelle /20, seuil 10, arrondi appliqués
- [ ] Mentions FR correctes
- [ ] Filières Industrielle & Tertiaire (STT) créées et rattachées aux classes du 2nd cycle
- [ ] Coefficients élevés sur les matières professionnelles
- [ ] Composantes Theory + Practical (TP) configurées ; moyenne pondérée exacte
- [ ] Saisie des notes de cours et d'atelier ; statuts ; resit ; modification tracée
- [ ] Moyenne générale pondérée ; rangs ; moyenne de classe ; mention
- [ ] Bulletin technique : **scores séparés théorie/pratique** affichés
- [ ] Cycle DRAFT → PUBLISH → LOCK → UNLOCK → REVISE → DELETE
- [ ] PDF conforme au format FR technique (MINESEC ENS. TECHNIQUE)
- [ ] Examens CAP / Probatoire Technique / Bac Technique (création, inscriptions, résultats)

---

> **Document suivant** : `docs/TESTING_FLOWS_04_ANGLOPHONE_TECHNIQUE.md` pour le système anglophone technique.
