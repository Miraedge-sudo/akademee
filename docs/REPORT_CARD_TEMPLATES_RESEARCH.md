# Rapport de Recherche : Templates de Bulletins Scolaires

> Analyse comparative des systèmes d'évaluation et formats de bulletins  
> Recherche web — Juillet 2026

---

## 📋 Sommaire

1. [Système Éducatif Camerounais](#1-système-éducatif-camerounais)
   - [Sous-système Francophone](#11-sous-système-francophone)
   - [Sous-système Anglophone (GCE)](#12-sous-système-anglophone-gce)
   - [Structure Commune APC](#13-structure-commune-apc)
   - [Tableau comparatif des mentions](#14-tableau-comparatif-des-mentions)
2. [Système Éducatif Français](#2-système-éducatif-français)
   - [Livret Scolaire Unique (LSU)](#21-livret-scolaire-unique-lsu)
   - [Bulletins traditionnels du secondaire](#22-bulletins-traditionnels-du-secondaire)
3. [Systèmes Internationaux](#3-systèmes-internationaux)
   - [International Baccalaureate (IB)](#31-international-baccalaureate-ib)
   - [British Curriculum](#32-british-curriculum)
   - [American High School](#33-american-high-school)
4. [Synthèse et Recommandations](#4-synthèse-et-recommandations)
   - [Structure optimale pour Akademee](#41-structure-optimale-du-bulletin)
   - [Spécifications fonctionnelles](#42-spécifications-fonctionnelles)
   - [Schéma d'affichage](#43-schéma-daffichage-du-bulletin)

---

## 1. Système Éducatif Camerounais

### 1.1 Sous-système Francophone

**Structure scolaire :**
- **Primaire** → CEP (Certificat d'Études Primaires)
- **Premier cycle secondaire** → 6ème, 5ème, 4ème, 3ème → **BEPC** (Brevet d'Études du Premier Cycle)
- **Second cycle** → Seconde, Première, Terminale → **Probatoire** + **Baccalauréat** (organisé par l'OBC)

**Structure du bulletin :**

```
┌─────────────────────────────────────────────────────────────────────┐
│                RÉPUBLIQUE DU CAMEROUN                               │
│                Paix – Travail – Patrie                              │
│         MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES                     │
│     Délégation Régionale : [Région]  |  Département : [Département] │
│                       [Nom de l'Établissement]                      │
│                      BULLETIN DE NOTES                              │
│            Année Scolaire : [Année]  |  Trimestre : [N°]            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Élève : [Nom & Prénoms]            |  Classe : [Classe]            │
│  Date de naissance : [JJ/MM/AAAA]   |  Effectif : [Nombre]          │
│  Matricule : [Identifiant]          |  Redoublant : [Oui/Non]       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  DOMAINE 1 : LANGUES ET COMMUNICATION                               │
├─────────┬──────────┬──────┬──────┬────────┬────────┬────────────────┤
│ MATIÈRE │ ENSEIGN. │ NOTE │ COEF │ MOY.   │ NIVEAU │ APPRÉCIATION   │
│         │          │/20   │      │ POND.  │  APC   │                │
├─────────┼──────────┼──────┼──────┼────────┼────────┼────────────────┤
│ Français│ [Nom]    │ 14.0 │  4   │  56.0  │   TBM  │ Bien           │
│ Anglais │ [Nom]    │ 12.0 │  3   │  36.0  │   M    │ Assez bien     │
│ ...     │          │      │      │        │        │                │
├─────────┴──────────┴──────┴──────┼────────┴────────┴────────────────┤
│ TOTAL COEFFICIENTS : XX          │ TOTAL POINTS : XXX.X             │
├──────────────────────────────────┴──────────────────────────────────┤
│                                                                     │
│  MOYENNE GÉNÉRALE : [XX.XX] /20    |  RANG : [X] / [Effectif]      │
│                                                                     │
│  MENTION : [Très Bien / Bien / Assez Bien / Passable / Insuffisant] │
│                                                                     │
│  DÉCISION DU CONSEIL DE CLASSE :                                    │
│  □ Admis   □ Passage conditionnel   □ Redoublement                  │
│  Appréciation du professeur principal : [Commentaire...]            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                      SIGNATURES                                     │
│  ─────────────    ───────────────    ───────────────                 │
│  Le Professeur     Le Chef           Le Parent / Tuteur              │
│  Principal         d'Établissement   (Lu et approuvé)               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  DISCIPLINE                                                         │
│  Absences : [X] non justifiées / [Y] justifiées                     │
│  Retards : [Z]    |    Sanctions : [Liste]                          │
├─────────────────────────────────────────────────────────────────────┤
│  GRILLE DE NOTATION APC                                             │
│  Niveau 4 (A+) : 18-20  → Très Bien Acquis                          │
│  Niveau 3 (A/B+) : 14-18 → Bien Acquis                              │
│  Niveau 2 (C+/C) : 10-14 → Acquis / Moyennement Acquis              │
│  Niveau 1 (D) : < 10    → Non Acquis                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Sous-système Anglophone (GCE)

**Structure scolaire :**
- **Primaire** → FSLC (First School Leaving Certificate)
- **Premier cycle secondaire** → Form 1 → Form 5 → **GCE O-Level**
- **Second cycle** → Lower Sixth, Upper Sixth → **GCE A-Level**

**Structure du bulletin :**

```
┌─────────────────────────────────────────────────────────────────────┐
│               REPUBLIC OF CAMEROON                                  │
│               Peace – Work – Fatherland                             │
│            MINISTRY OF SECONDARY EDUCATION                          │
│                          [School Name]                              │
│                         REPORT BOOKLET                              │
│            Academic Year: [Year]  |  Term: [1st/2nd/3rd]            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Student: [Name]               |  Class: [Form X]                   │
│  Date of Birth: [DD/MM/YYYY]   |  Class Size: [Number]             │
│  Reg. No: [ID]                 |  Repeater: [Yes/No]                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  PERFORMANCE TABLE                                                  │
├────────────┬───────────┬──────┬──────┬─────────┬─────────┬─────────┤
│ SUBJECT    │ TEACHER   │ SCORE│ COEFF│ WEIGHTED│ GRADE   │ REMARK  │
│            │           │ /100 │      │  SCORE  │ (A-F)   │         │
├────────────┼───────────┼──────┼──────┼─────────┼─────────┼─────────┤
│ English    │ [Name]    │  75  │  3   │  225    │   B     │ Good    │
│ Maths      │ [Name]    │  62  │  4   │  248    │   C     │ Fair    │
│ ...        │           │      │      │         │         │         │
├────────────┴───────────┴──────┴──────┼─────────┴─────────┴─────────┤
│ TOTAL COEFFICIENTS: XX              │ TOTAL WEIGHTED: XXXX         │
├─────────────────────────────────────┴──────────────────────────────┤
│                                                                     │
│  OVERALL AVERAGE: [XX.XX]%  |  RANK: [X] / [Class Size]            │
│                                                                     │
│  GRADE: [A/B/C/D/E/U]    |    HONOURS: [Excellent/Good/Fair/...]   │
│                                                                     │
│  PROMOTION STATUS:                                                  │
│  □ Promoted   □ Conditional   □ Repeat                              │
│  Comments from Class Teacher: [...]                                 │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                      SIGNATURES                                     │
│  ──────────────    ───────────────    ───────────────                │
│  Subject Teacher    Principal          Parent / Guardian             │
│                                      (Seen and approved)            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  CONDUCT & ATTENDANCE                                               │
│  Absences: [X] Unexcused / [Y] Excused                              │
│  Lateness: [Z]    |    Conduct: [Excellent/Good/Fair/Poor]          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  GCE GRADING SCALE                                                  │
│  A (80-100) : Excellent    → Pass                                  │
│  B (70-79)  : Very Good    → Pass                                  │
│  C (60-69)  : Good         → Pass                                  │
│  D (50-59)  : Credit       → Pass (O-Level) / Fail (A-Level)       │
│  E (40-49)  : Pass         → Pass (O-Level) / Fail (A-Level)       │
│  U (<40)    : Ungraded     → Fail                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Structure Commune APC

Depuis la réforme de l'Approche par Compétences (APC), les deux systèmes partagent une grille d'évaluation commune à 4 niveaux :

| Niveau | Code | Score /20 | Score /100 | Signification |
|--------|------|-----------|------------|---------------|
| 4 | A+ | 18-20 | 90-100 | Très Bien Acquis / Excellent |
| 3 | A/B+ | 14-18 | 70-89 | Bien Acquis / Good |
| 2 | C+/C | 10-14 | 50-69 | Acquis / Satisfactory |
| 1 | D | < 10 | < 50 | Non Acquis / Insufficient |

### 1.4 Tableau comparatif des mentions

| Francophone | Anglophone | Score /20 | Score % |
|-------------|------------|-----------|---------|
| Très Bien avec Félicitations | Distinction | 18-20 | 90-100% |
| Très Bien | Excellent | 16-17.99 | 80-89% |
| Bien | Very Good | 14-15.99 | 70-79% |
| Assez Bien | Good | 12-13.99 | 60-69% |
| Passable | Fair | 10-11.99 | 50-59% |
| Insuffisant | Poor | < 10 | < 50% |

---

## 2. Système Éducatif Français

### 2.1 Livret Scolaire Unique (LSU)

Le LSU est un outil numérique national obligatoire du CP à la 3ème.

**Caractéristiques :**
- 📱 **100% numérique** via le portail ÉduConnect
- 📊 **Évaluation par compétences** sur une échelle qualitative à 4 niveaux
- 🗓️ **Bilans périodiques** (trimestres) + bilan de fin de cycle
- 📋 **Socle commun** de connaissances, compétences et culture

**Structure de l'évaluation par compétences :**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LIVRET SCOLAIRE UNIQUE                           │
│             [Nom Établissement] - [Ville]                           │
│             Année scolaire [XXXX-XXXX]                              │
├─────────────────────────────────────────────────────────────────────┤
│  Élève : [Nom Prénom]   |   Né(e) le : [Date]                       │
│  Classe : [Classe]      |   Cycle : [Cycle 2/3/4]                  │
├─────────────────────────────────────────────────────────────────────┤
│  COMPÉTENCES ÉVALUÉES                                                │
├──────────────┬────────────┬──────────┬──────────┬──────────┬────────┤
│  DOMAINE     │ COMPÉTENCE │  P1      │  P2      │  P3      │ Bilan │
├──────────────┼────────────┼──────────┼──────────┼──────────┼────────┤
│ Les langages │ Comprendre │ [1-4]    │ [1-4]    │ [1-4]    │ [1-4] │
│ pour penser  │ s'exprimer │          │          │          │       │
│ et communiq. │ à l'oral   │          │          │          │       │
├──────────────┼────────────┼──────────┼──────────┼──────────┼────────┤
│ Les méthodes │ ...        │ ...      │ ...      │ ...      │ ...   │
│ et outils    │            │          │          │          │       │
├──────────────┼────────────┼──────────┼──────────┼──────────┼────────┤
│              │ TOTAL /20  │ [Note]   │ [Note]   │ [Note]   │ [Note]│
│              │ Moy.Classe │ [Moy]    │ [Moy]    │ [Moy]    │ [Moy] │
├──────────────┴────────────┴──────────┴──────────┴──────────┴────────┤
│  Échelle : 1=Maîtrise insuffisante  2=Maîtrise fragile              │
│            3=Maîtrise satisfaisante  4=Très bonne maîtrise          │
├─────────────────────────────────────────────────────────────────────┤
│  APPRÉCIATIONS                                                      │
│  Professeur principal : [...]                                       │
│  Chef d'établissement : [...]                                       │
├─────────────────────────────────────────────────────────────────────┤
│  CONSEIL DE CLASSE                                                  │
│  Avis : [Passage / Réorientation / Redoublement]                    │
│  Orientation proposée : [Filière/Série]                             │
│  Décision : [Admis(e) / Ajourné(e)]                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Bulletins traditionnels du secondaire (Lycée)

Dans les lycées français (Seconde, Première, Terminale), le format traditionnel reste courant :

```
┌─────────────────────────────────────────────────────────────────────┐
│                [Nom du Lycée / Établissement]                        │
│            BULLETIN SCOLAIRE — [Trimestre/Semestre N°]              │
│            Année scolaire [XXXX-XXXX]                               │
├─────────────────────────────────────────────────────────────────────┤
│  Élève : [Nom Prénom]   |   Classe : [Seconde/Première/Terminale X] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TABLEAU DES NOTES                                                  │
├────────────┬─────────┬──────────┬──────────┬──────────┬──────────────┤
│  MATIÈRE   │  NOTE   │  COEF    │ MOYENNE  │  MIN     │  APPRÉCIATION│
│            │  /20    │          │ CLASSE   │  MAX     │              │
├────────────┼─────────┼──────────┼──────────┼──────────┼──────────────┤
│ Mathématiques│ 15.0   │    4     │  12.5    │ 15.0 /   │ Bon travail,│
│            │         │          │          │  8.0     │ doit partic.│
├────────────┼─────────┼──────────┼──────────┼──────────┼──────────────┤
│ Français   │ 12.0    │    3     │  11.0    │ 14.0 /   │ Assez bien  │
│            │         │          │          │  6.5     │             │
├────────────┴─────────┴──────────┴──────────┴──────────┴──────────────┤
│  MOYENNE GÉNÉRALE : [XX.XX] /20                                     │
│  MOYENNE DE LA CLASSE : [XX.XX] /20                                 │
│  RANG : [X] / [Effectif]                                            │
├─────────────────────────────────────────────────────────────────────┤
│  MENTION : [Très Bien / Bien / Assez Bien / Passable]               │
├─────────────────────────────────────────────────────────────────────┤
│  CONSEIL DE CLASSE                                                   │
│  Appréciation : [...]                                               │
│  Avis : Très favorable / Favorable / Réserves / Défavorable         │
│  Orientation : [Série/Filière proposée]                             │
├─────────────────────────────────────────────────────────────────────┤
│  DISCIPLINE - APPÉCIATIONS DU CONSEIL                                │
│  Absences justifiées : [X] | Injustifiées : [Y]                     │
│  Retards : [Z]                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  SIGNATURES                                                         │
│  Le Professeur Principal    Le Proviseur    Les Parents              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Systèmes Internationaux

### 3.1 International Baccalaureate (IB)

| Aspect | Détail |
|--------|--------|
| **Échelle** | 1–7 (4 = seuil de réussite) |
| **Total DP** | 42 points (matières) + 3 points (core) = max 45 |
| **Core** | Theory of Knowledge (TOK), Extended Essay (EE), Creativity Activity Service (CAS) |
| **Approche** | Critères spécifiques par matière, pas de courbe |
| **Mentions** | Bilingual Diploma, points totaux |

**Structure du bulletin IB :**

```
┌─────────────────────────────────────────────────────────────────────┐
│           [School Name] — International Baccalaureate                │
│                       REPORT OF PROGRESS                            │
│              Diploma Programme — Year [1/2]                        │
├─────────────────────────────────────────────────────────────────────┤
│  Student: [Name]    |    Candidate No: [XXXX-XXX]                    │
├─────────────────────────────────────────────────────────────────────┤
│  SUBJECT                    LEVEL     GRADE      TEACHER COMMENT    │
│  ─────────────────────────────────────────────────────────────────  │
│  English A: Literature       HL        6         [Comment]          │
│  French B                   SL        5         [Comment]           │
│  Mathematics: AA            HL        4         [Comment]           │
│  ...                                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  APPROACHES TO LEARNING (ATL)                                        │
│  │ Thinking skills          │ ● ● ● ○ ○ │ 3/5                     │
│  │ Communication skills     │ ● ● ● ● ○ │ 4/5                     │
│  │ Self-management          │ ● ● ● ○ ○ │ 3/5                     │
│  ─────────────────────────────────────────────────────────────       │
├─────────────────────────────────────────────────────────────────────┤
│  LEARNER PROFILE                                                     │
│  □ Inquirer   □ Knowledgeable   □ Thinker   □ Communicator          │
│  □ Principled □ Open-minded     □ Caring    □ Risk-taker            │
│  □ Balanced   □ Reflective                                          │
├─────────────────────────────────────────────────────────────────────┤
│  CAS ACTIVITIES: [Summary of activities]                            │
├─────────────────────────────────────────────────────────────────────┤
│  HOMEROOM TEACHER COMMENT: [...]                                    │
│  SIGNATURE: ___________    DATE: ___________                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 British Curriculum

| Aspect | Détail |
|--------|--------|
| **Échelle** | A*, A, B, C, D, E, U (GCSE / A-Level) |
| **Seuil réussite GCSE** | C/4 ou supérieur |
| **Seuil réussite A-Level** | E (A*, A = excellent, B, C = good, D, E = pass) |
| **Progress indicators** | "Exceeding", "On Target", "Working Towards" |
| **Approche** | Attainment vs Progress (progression dans le temps) |

**Structure du bulletin British :**

```
┌─────────────────────────────────────────────────────────────────────┐
│                       [School Name]                                  │
│                        REPORT CARD                                   │
│              Academic Year [XXXX-XXXX] — [Term X]                   │
├─────────────────────────────────────────────────────────────────────┤
│  Student: [Name]    |    Form: [X]    |    Tutor Group: [X]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SUBJECT            TARGET   CURRENT  EFFORT  HOMEWORK  TEACHER     │
│                                GRADE          GRADE     COMMENT     │
│  ─────────────────────────────────────────────────────────────────  │
│  English            6        5         B       B+       [Comment]   │
│  Mathematics        7        6         A       B        [Comment]   │
│  Science            6        5         B-      B        [Comment]   │
│  ...                                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ATTENDANCE                                                         │
│  Present: [X]  |  Absent: [Y] (Authorised: [A] / Unauthorised: [B])│
│  Lates: [Z]    |  Overall Attendance: [XX.X]%                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  FORM TUTOR COMMENT:                                                │
│  [...]                                                              │
│                                                                     │
│  HEAD OF YEAR COMMENT:                                              │
│  [...]                                                              │
├─────────────────────────────────────────────────────────────────────┤
│  SIGNATURES                                                         │
│  Student: ___________   |   Parent: ___________   |   Tutor: ______│
│  Date: [DD/MM/YYYY]                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 American High School

| Aspect | Détail |
|--------|--------|
| **Échelle** | A (90-100%), B (80-89%), C (70-79%), D (60-69%), F (<60%) |
| **GPA** | Weighted/Unweighted (AP courses = +1.0) |
| **Crédits** | Carnegie units pour graduation |
| **Standards** | Common Core, State Standards |
| **Approche** | Standards-Based Grading (SBG) de plus en plus courant |

**Structure du bulletin américain :**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    [School Name] — [District]                        │
│            HIGH SCHOOL REPORT CARD — [Semester/Grading Period]      │
│                    Academic Year [XXXX-XXXX]                        │
├─────────────────────────────────────────────────────────────────────┤
│  Student: [Name]              ID: [Student ID]                      │
│  Grade: [9/10/11/12]          Graduation Year: [YYYY]              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  COURSE              TEACHER    TERM  EXAM   FINAL   CREDITS  GRADE │
│                                   %     %      %             LTR   │
│  ─────────────────────────────────────────────────────────────────  │
│  English III        [Name]      85    82     84      1.0      B    │
│  Algebra II         [Name]      78    75     77      1.0      C+   │
│  Biology            [Name]      92    88     90      1.0      A-   │
│  US History         [Name]      70    65     68      1.0      D+   │
│  Spanish II         [Name]      88    85     87      1.0      B+   │
│  ...                                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GPA: Weighted [3.45]  |  Unweighted [3.20]  |  Class Rank: [42]/[450]│
│  Honor Roll: [Yes/No]   |  Credits Earned: [15.0]/[24.0]           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  STANDARDS-BASED ASSESSMENT (selected subjects)                     │
│                                                                     │
│  Mathematics (Algebra II):                                          │
│  │ Standard: Quadratic equations         │ 3 (Proficient)   │       │
│  │ Standard: Linear functions            │ 4 (Advanced)     │       │
│  │ Standard: Statistics & probability    │ 2 (Basic)        │       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  TEACHER COMMENTS                                                   │
│  English: [Comment...]                                             │
│  Mathematics: [Comment...]                                          │
│  ...                                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ATTENDANCE                                                         │
│  Days Present: [X]  |  Excused Absences: [Y]  |  Unexcused: [Z]    │
├─────────────────────────────────────────────────────────────────────┤
│  COUNSELOR'S NOTES: [...]                                          │
├─────────────────────────────────────────────────────────────────────┤
│  SIGNATURES                                                         │
│  Student: ___________  |  Parent/Guardian: ___________              │
│  Date: _______________                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Synthèse et Recommandations

### 4.1 Structure optimale pour Akademee

Après analyse des 5 systèmes, voici la structure de bulletin recommandée, qui couvre à la fois les besoins camerounais (systèmes anglophone et francophone) et les standards internationaux :

```
┌─────────────────────────────────────────────────────────────────────┐
│  [EN-TÊTE OFFICIEL — configurable selon le pays / système]          │
│                                                                     │
│  • Logo/Nom de l'établissement  • Devise (ex: Paix-Travail-Patrie)  │
│  • Ministère de tutelle         • Année scolaire                    │
│  • Titre : "BULLETIN DE NOTES" / "REPORT CARD"                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  1. INFORMATIONS ÉLÈVE                                              │
│                                                                     │
│  ┌──────────────┬──────────────┐  ┌──────────────┬──────────────┐  │
│  │ 👤 Élève     │ [Nom Complet]│  │ 📅 Date naiss│ [Date]       │  │
│  │ 🏫 Classe    │ [Classe]     │  │ 📋 Matricule  │ [ID]        │  │
│  │ 📊 Effectif  │ [Nombre]     │  │ 🔄 Redoublant │ [Oui/Non]   │  │
│  └──────────────┴──────────────┘  └──────────────┴──────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  2. TABLEAU DES NOTES (adaptable anglophone/francophone)            │
│                                                                     │
│  ┌──────┬──────────┬──────┬──────┬────────┬────────┬────────┬──────┐│
│  │  N°  │ MATIÈRE  │ COEF │ NOTE │ POINTS │ RANG   │ NIVEAU │ APP  ││
│  │      │          │      │ /20  │ POND.  │ CLASSE │ APC    │      ││
│  ├──────┼──────────┼──────┼──────┼────────┼────────┼────────┼──────┤│
│  │  1   │ [Matière]│  X   │ XX.X │ XXX.X  │  X/Y   │  N3    │ Bien││
│  │  2   │ [Matière]│  X   │ XX.X │ XXX.X  │  X/Y   │  N2    │ As. ││
│  │  ... │  ...     │ ...  │ ...  │ ...    │  ...   │  ...   │ ... ││
│  ├──────┼──────────┼──────┼──────┼────────┼────────┼────────┼──────┤│
│  │      │ TOTAL    │  XX  │      │ XXX.X  │        │        │      ││
│  └──────┴──────────┴──────┴──────┴────────┴────────┴────────┴──────┘│
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  3. RÉSULTATS                                                       │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  MOYENNE GÉNÉRALE : XX.XX /20                          │       │
│  │  Moyenne de la classe : XX.XX /20                      │       │
│  │  Rang : X / Y élèves                                   │       │
│  │  Seuil de réussite : 10/20 (XX%)                       │       │
│  │  Décision : ✅ ADMIS / ❌ ÉCHEC                        │       │
│  │  Mention : 🏆 [Très Bien / Bien / Assez Bien / ...]   │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  4. APPRÉCIATIONS & SIGNATURES                                      │
│                                                                     │
│  Appréciation du professeur principal : [Commentaire...]            │
│  Décision du conseil de classe : [Admis/Conditionnel/Redoublement]  │
│  Orientation : [Série/Filière proposée]                             │
│                                                                     │
│  ───────────────    ───────────────    ───────────────               │
│  L'Enseignant        Le Chef            Le Parent / Tuteur            │
│                     d'Établissement    (Lu et approuvé)              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  5. ASSIDUITÉ                                                       │
│                                                                     │
│  Absences : [X] justifiées / [Y] non justifiées                     │
│  Retards : [Z]    |    Conduite : [TB/B/AB/P/I]                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  6. GRILLE DE RÉFÉRENCE                                             │
│                                                                     │
│  Niveau 4 (A+)  : 18-20 → Très Bien Acquis / Excellent             │
│  Niveau 3 (A/B+): 14-18 → Bien Acquis / Good                       │
│  Niveau 2 (C+/C): 10-14 → Acquis / Satisfactory                    │
│  Niveau 1 (D)   : < 10  → Non Acquis / Insufficient                │
│                                                                     │
│  ⚡ Document généré par Akademee le [Date]                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Spécifications fonctionnelles

| Section | Configuration | Bilingue FR/EN |
|---------|---------------|----------------|
| En-tête officiel | Logo, devise, ministère par pays | ✅ |
| Infos élève | Champs configurables | ✅ |
| Tableau des notes | Matières, coeff, notes/20, points, rang | ✅ |
| Appréciations | Niveaux APC + texte libre | ✅ |
| Mentions | Seuils configurables par système | ✅ |
| Décision | Admis/Conditionnel/Redoublement | ✅ |
| Signatures | Enseignant, Principal, Parent | ✅ |
| Assiduité | Absences, retards, conduite | ✅ |
| Grille de référence | Niveaux APC affichés | ✅ |

### 4.3 Points clés à retenir

1. **Le Cameroun a 2 systèmes** : Francophone (notes/20, mentions FR, BEPC/Bac) et Anglophone (grades A-F, GCE O/A-Level)
2. **Les deux systèmes utilisent l'APC** (Approche par Compétences) avec 4 niveaux de maîtrise
3. **Les coefficients** sont essentiels — la moyenne générale est toujours pondérée
4. **Le rang** est universellement présent (position dans la classe)
5. **Les signatures** sont obligatoires : Enseignant + Chef d'établissement + Parent
6. **Le système français** utilise le LSU numérique avec évaluation par compétences (1-4)
7. **L'IB** utilise une échelle 1-7 avec approche critérielle et ATL skills
8. **Le British** combine grades (A*-U) avec progress indicators et effort grades
9. **L'américain** utilise le GPA (weighted/unweighted) avec crédits pour graduation

### Recommandation pour Akademee

Le bulletin déjà implémenté dans le code couvre déjà la majorité des besoins :
- ✅ Tableau matières avec coefficients
- ✅ Notes sur 20 et points pondérés
- ✅ Moyenne générale et rang
- ✅ Mention configurable
- ✅ Appréciations (TB/B/AB/P/I)
- ✅ Signatures (3 blocs)
- ✅ Bilingue FR/EN
- ✅ PDF exportable

**Améliorations suggérées :**
1. Ajouter la **grille APC** en bas du bulletin
2. Ajouter la section **Décision du conseil de classe** (Admis/Conditionnel/Redoublement)
3. Ajouter la section **Assiduité** (absences, retards)
4. Ajouter la **moyenne de la classe** pour contexte
5. Ajouter les **notes min/max** de la classe (comme dans le système français)
6. Support du **système de grades A-F** pour le sous-système anglophone GCE
