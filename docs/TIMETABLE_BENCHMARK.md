# Benchmark — Gestion des Emplois du Temps (Timetable)

> Recherche menée le 14/08/2026 pour la feature « Emploi du temps » d'Akademee.
> Sources : Index Education (EDT/PRONOTE), Skolengo, aSc TimeTables, Untis, Lantiv,
> FET (open source), Fedena (open source), Eduka Software, comparatifs Classter & DevOpsSchool.

---

## 1. État du projet Akademee (avant ce benchmark)

**Aucune feature d'emploi du temps n'existe.** Les seuls fichiers présents sont des
placeholders UI avec données fictives :

- `frontend/src/app/features/students/components/StudentSchedule.jsx` — « Today's classes »
  (affiche un message « will appear here once configured », aucune API appelée).
- `frontend/src/app/features/teachers/components/TodaySchedule.jsx` — liste `SAMPLE_SCHEDULE`
  codée en dur (Maths, 07:30, R.12…), bouton « Full timetable » qui pointe vers
  `/dashboard/my-classes` inexistant.

Côté backend : aucune table, route, contrôleur ou service lié à l'emploi du temps
(`grep -il "timetable|schedule"` ne remonte que le scheduler de cron jobs et un validateur d'examens).

---

## 2. Acteurs étudiés (positionnement)

| Outil | Type | Force principale | Marché |
|---|---|---|---|
| **EDT / PRONOTE** (Index Education) | Commercial, desktop | Référence francophone : placement auto (98% des cours placés automatiquement), analyseur de contraintes, remplacements | France & francophonie (dont Afrique) |
| **Skolengo** | ENT cloud (SaaS) | Module EDT intégré à un ENT : synergie vie scolaire / cahier de textes, remplacements 1 clic | France & francophonie |
| **aSc TimeTables** | Commercial (desktop + cloud) | Générateur auto « 5 000 000 de possibilités en ~5 min », substitution intégrée, 200 000 écoles | Monde (K-12) |
| **Untis** | Commercial | Grands établissements/districts, analyses avancées | Europe (surtout DACH) |
| **Lantiv** | Commercial, IA | Génération pilotée par IA | Monde |
| **FET** | **Open source (GNU AGPL), C++** | Algorithme de placement à contraintes, gratuit, modes spéciaux (dont « Mornings-Afternoons » pour Maroc/Algérie) | Monde, intégration possible |
| **Fedena** | Open source (Ruby on Rails) | SIS tout-en-un très répandu en Afrique : timetable par classe, class timings, custom weekdays | Afrique, Inde |

**Constat clé** : deux approches cohabitent sur le marché :

1. **Approche « grille par classe »** (Fedena, beaucoup de SIS africains) : on définit des
   créneaux (class timings) puis on remplit la grille hebdomadaire de chaque classe,
   enseignant par enseignant. Simple, pédagogique, adapté aux petites structures.
2. **Approche « générateur automatique »** (EDT, aSc, Untis, FET) : on déclare des activités
   (matière + classe + enseignant + volume horaire) et des contraintes ; l'algorithme place
   tout, l'admin ajuste à la main ensuite. Adapté aux gros établissements.

---

## 3. Modèle conceptuel (consensus de tous les acteurs)

- **Grille hebdomadaire** : jours (lun–sam pour le Cameroun) × **créneaux horaires** (periods).
- **Créneaux (periods / class timings)** : définis par l'école — nom, heure de début, heure de
  fin, **pause**, ordre dans la journée (Fedena : « class timings », « custom weekdays »).
- **Activité / cours** : `matière + classe + enseignant + salle + créneau(jour, période)`.
  C'est l'unité de base de la grille (aSc : « lesson », FET : « activity »).
- **Ressources** : enseignants, classes, salles, matières. Le générateur affecte les activités
  aux créneaux **sans conflit** :
  - un enseignant ne peut pas être à deux endroits à la fois ;
  - une classe non plus ;
  - une salle non plus.

### Contraintes typiques (FET / aSc / EDT)
- **Indisponibilités** enseignant / classe / salle (jour × créneau) — EDT 1997, Skolengo.
- **Volume horaire** par matière et par classe (ex. Maths 6 h/sem).
- **Max heures par jour** pour un enseignant / une classe.
- **Max cours consécutifs** (éviter les « trous » / back-to-back).
- **Cours doubles** pour certaines matières (TP, labo).
- **Répartition** d'une matière sur la semaine (pas tout le même jour).
- **Salles préférentielles** (EDT 2014) + **recherche de salles libres** (EDT 1999).
- **Groupes en parallèle** (spécialités, groupes de besoin — EDT 2019/2024) : des groupes
  d'élèves travaillent en parallèle sans tenir compte des classes.

### Modes spéciaux pertinents pour le Cameroun
- **FET a un mode « Mornings-Afternoons »** conçu pour les systèmes marocain/algérien :
  **demi-journées (matin / après-midi)**. C'est exactement le modèle camerounais des écoles
  qui fonctionnent en **mi-temps** (double vacation) : une école qui tourne en
  « matinée » et « après-midi ». À prévoir dès la conception.

---

## 4. Fonctionnalités benchmarkées (synthèse des leaders)

| Fonctionnalité | EDT/PRONOTE | Skolengo | aSc | FET | Fedena | Priorité Akademee |
|---|---|---|---|---|---|---|
| Grille hebdo par classe | ✅ | ✅ | ✅ | ✅ | ✅ | **V1 — cœur** |
| Vue par enseignant | ✅ | ✅ | ✅ | ✅ | ✅ | **V1** |
| Vue par salle | ✅ | ✅ | ✅ | ✅ | ❌ | V2 |
| Vue « aujourd'hui » mobile | ✅ (PRONOTE) | ✅ | ✅ | ❌ | ✅ | **V1** (placeholder déjà là) |
| Placement manuel drag & drop | ✅ | ✅ | ✅ | ✅ | ✅ | **V1** |
| Détection de conflits temps réel | ✅ | ✅ | ✅ | ✅ | ✅ | **V1 — obligatoire** |
| Génération automatique | ✅ (98%) | ✅ | ✅ (5 min) | ✅ | ❌ | V2 |
| Analyseur de contraintes avant calcul | ✅ | ✅ | ✅ | ✅ | ❌ | V2 |
| Indisponibilités enseignant/classe | ✅ | ✅ | ✅ | ✅ | ✅ | **V1** |
| Remplacements (absence → remplaçant) | ✅ (2009) | ✅ (1 clic) | ✅ (Substitutions) | ❌ | ❌ | **V1.5 / V2** |
| Gestion des pauses / récré | ✅ | ✅ | ✅ | ✅ | ✅ | **V1** |
| Salles préférentielles / recherche salle libre | ✅ | ✅ | ✅ | ✅ | ❌ | V2 |
| Exceptions / événements (jour férié, sortie) | ✅ (2008) | ✅ | ✅ (Calendar) | ✅ | ✅ | V2 |
| Export PDF / impression | ✅ | ✅ | ✅ | ✅ | ✅ | **V1** |
| Publication mobile + notifications de changement | ✅ (SMS) | ✅ (ENT) | ✅ (app) | ❌ | ✅ (SMS) | V2 |
| Groupes / spécialités en parallèle | ✅ | ✅ | ✅ | ✅ | ❌ | V2 |
| Suivi volume horaire enseigné | ✅ | ✅ | ✅ | ❌ | ❌ | V2 |

---

## 5. Modèle de données recommandé (dérivé de FET + Fedena + conventions SQL)

```sql
-- Créneaux de la semaine (class timings)
timetable_periods (
  period_id      uuid PK,
  school_id      uuid FK,
  name           text,          -- « 1ère heure », « Matin 1 »…
  day            smallint,      -- 1=lundi … 6=samedi
  start_time     time,
  end_time       time,
  is_break       boolean,       -- pause/récré (non inscriptible)
  sort_order     smallint,
  UNIQUE (school_id, day, sort_order)
)

-- Affectation d'un cours dans la grille
timetable_entries (
  entry_id          uuid PK,
  school_id         uuid FK,
  academic_year_id  uuid FK,    -- scopé par année (cohérent avec le reste d'Akademee)
  class_id          uuid FK,
  subject_id        uuid FK,
  teacher_id        uuid FK,    -- users
  room_id           uuid FK NULL,
  period_id         uuid FK,    -- jour + créneau
  group_id          uuid FK NULL,  -- sous-groupe (V2 : groupes en parallèle)
  week_type         text NULL,  -- NULL=chaque semaine, 'A'/'B' (V2 : semaines alternées)
  created_by        uuid FK,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (academic_year_id, class_id, period_id, group_id),  -- pas 2 cours en même temps pour une classe
  UNIQUE (academic_year_id, teacher_id, period_id),          -- pas 2 cours pour un enseignant
  UNIQUE (academic_year_id, room_id, period_id)              -- pas 2 cours dans une salle
)

-- Indisponibilités (enseignant / classe / salle)
timetable_unavailabilities (
  id          uuid PK,
  school_id   uuid FK,
  academic_year_id uuid FK,
  entity_type text,            -- 'teacher' | 'class' | 'room'
  entity_id   uuid,            -- user_id / class_id / room_id
  period_id   uuid FK,         -- jour + créneau
  UNIQUE (entity_type, entity_id, period_id)
)

-- Salles (V2 : salles préférentielles, recherche de salle libre)
rooms (
  room_id   uuid PK,
  school_id uuid FK,
  name      text,
  capacity  smallint,
  room_type text,              -- 'classroom' | 'lab' | 'computer'…
)

-- Remplacements (V2 : absences enseignants)
substitutions (
  id               uuid PK,
  school_id        uuid FK,
  entry_id         uuid FK,        -- cours remplacé
  substitute_id    uuid FK,        -- enseignant remplaçant
  date             date,           -- remplacement ponctuel (vs grille)
  reason           text,
  status           text            -- 'proposed' | 'confirmed' | 'cancelled'
)
```

**Points de conception à trancher dès le départ :**
1. **Grille par classe** (chaque classe a SA grille ; l'emploi du temps d'un enseignant est
   l'agrégat des grilles de ses classes) — c'est le modèle Fedena, le plus simple et le plus
   répandu en Afrique. Recommandé pour la **V1**.
2. **Semaines A/B, jours fériés, exceptions** → V2.
3. **Demi-journées (matin/après-midi)** → prévoir dans le modèle de créneaux dès la V1
   (rien à coder en plus : ce n'est qu'une question de définitions de créneaux).
4. **Samedi** : beaucoup d'écoles camerounaises ont cours le samedi matin → la grille doit
   supporter 6 jours par défaut.

---

## 6. Recommandation pour Akademee

### V1 (périmètre minimal viable — « grille par classe »)
1. **Tables** : `timetable_periods`, `timetable_entries`, `timetable_unavailabilities`
   (+ table `rooms` si on veut gérer les salles dès la V1).
2. **Backend REST** (`/api/timetable`) :
   - CRUD des créneaux (définition de la semaine : jours, horaires, pauses, samedi inclus) ;
   - CRUD des entrées (cours) par classe ;
   - **contrôle anti-conflit côté serveur** (enseignant / classe / salle déjà occupés sur le
     même créneau) → renvoyer une erreur 409 avec le détail du conflit ;
   - endpoints de lecture : grille par classe, par enseignant, par salle, « aujourd'hui »
     (pour les dashboards élève/enseignant déjà existants).
3. **Frontend** :
   - Écran admin « Emploi du temps » : grille hebdo (jours × créneaux), **drag & drop** ou
     clic-pour-remplir, **coloration par matière** (réutiliser le pattern des couleurs des
     composants existants), conflits affichés en rouge immédiatement ;
   - vues par onglets : Classe / Enseignant / Salle ;
   - brancher les vrais `StudentSchedule` (aujourd'hui) et `TodaySchedule` (aujourd'hui) sur
     l'API — remplacer les données fictives ;
   - export/impression PDF de la grille d'une classe.
4. **Scopage par année académique** : cohérent avec le reste d'Akademee (comme le dashboard).

### V2 (différenciation)
- **Génération automatique** : réutiliser un moteur éprouvé — intégration de **FET** (C++,
  open source, export XML) ou d'une implémentation JS (ex. projets `timetable-generator` sur
  GitHub, encodage SAT/MaxSAT) plutôt que de réinventer un algorithme.
- **Remplacements** : absence d'un enseignant → suggestion du meilleur remplaçant disponible
  (aSc Substitutions), propagation aux vues + notification (SMS/notification in-app).
- **Groupes en parallèle** (spécialités, effectifs > capacité), **semaines A/B**,
  **exceptions** (jours fériés, sorties), **salles préférentielles** et **recherche de salle libre**.
- **Notifications** de changement d'emploi du temps (élève/parent/enseignant).

### Pourquoi cette stratégie
- Le **placement manuel + détection de conflits** couvre ~80% des besoins réels des écoles
  camerounaises (petites et moyennes structures, une cinquantaine d'enseignants max).
- La **génération automatique** est le vrai différenciateur (c'est ce que vendent aSc/EDT),
  mais c'est aussi le plus risqué à développer — d'où son report en V2 avec un moteur éprouvé
  (FET est gratuit et intègre déjà le mode « matin/après-midi »).
- Le modèle « grille par classe » reste compatible avec une évolution vers un générateur
  (les entrées sont les mêmes ; seul le mode de saisie change).

---

## 7. Sources

- Index Education — EDT : https://www.index-education.com/fr/logiciel-emploi-du-temps.php
- Skolengo — Logiciel emploi du temps : https://www.skolengo.com/fr/blog/quel-logiciel-emploi-du-temps-scolaire
- aSc TimeTables : https://www.asctimetables.com/
- Classter — Comparatif aSc / Untis / Lantiv : https://www.classter.com/blog/integrating-educational-technologies/comparing-timetable-software-for-schools-key-features-impact/
- DevOpsSchool — Top 10 School Timetabling Software : https://www.devopsschool.com/blog/top-10-school-timetabling-software-features-pros-cons-comparison/
- FET (open source) : https://lalescu.ro/liviu/fet/ + https://en.wikipedia.org/wiki/FET_(timetabling_software)
- Fedena : https://fedena.com/ + https://fedena.com/101-reasons
- Eduka Software (marché francophone) : https://www.edukasoftware.com/fr/modules/module-emploi-du-temps/
- Modèle SQL (référence) : https://www.sqlservercentral.com/forums/topic/table-structure-for-creating-timetable-for-a-school
