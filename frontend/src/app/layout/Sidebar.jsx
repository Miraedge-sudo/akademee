import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../core/hooks/useAuth";
import akademeeLogo from "../../assets/Logo.png";

// ── Educational System Types ──
const EDUCATIONAL_SYSTEMS = {
  ANGLOPHONE_GENERAL: "anglophone_general",
  FRANCOPHONE_GENERAL: "francophone_general",
  ANGLOPHONE_TECHNICAL: "anglophone_technical",
  FRANCOPHONE_TECHNICAL: "francophone_technical",
  UNIVERSITY: "university",
};

const SYSTEM_LABELS = {
  [EDUCATIONAL_SYSTEMS.ANGLOPHONE_GENERAL]: { en: "Anglophone General", fr: "Général Anglophone" },
  [EDUCATIONAL_SYSTEMS.FRANCOPHONE_GENERAL]: { en: "Francophone General", fr: "Général Francophone" },
  [EDUCATIONAL_SYSTEMS.ANGLOPHONE_TECHNICAL]: { en: "Anglophone Technical", fr: "Technique Anglophone" },
  [EDUCATIONAL_SYSTEMS.FRANCOPHONE_TECHNICAL]: { en: "Francophone Technical", fr: "Technique Francophone" },
  [EDUCATIONAL_SYSTEMS.UNIVERSITY]: { en: "University", fr: "Université" },
};

const SYSTEM_COLORS = {
  [EDUCATIONAL_SYSTEMS.ANGLOPHONE_GENERAL]: { bg: "bg-blue-500/20", text: "text-blue-300", dot: "bg-blue-400" },
  [EDUCATIONAL_SYSTEMS.FRANCOPHONE_GENERAL]: { bg: "bg-amber-500/20", text: "text-amber-300", dot: "bg-amber-400" },
  [EDUCATIONAL_SYSTEMS.ANGLOPHONE_TECHNICAL]: { bg: "bg-cyan-500/20", text: "text-cyan-300", dot: "bg-cyan-400" },
  [EDUCATIONAL_SYSTEMS.FRANCOPHONE_TECHNICAL]: { bg: "bg-purple-500/20", text: "text-purple-300", dot: "bg-purple-400" },
  [EDUCATIONAL_SYSTEMS.UNIVERSITY]: { bg: "bg-emerald-500/20", text: "text-emerald-300", dot: "bg-emerald-400" },
};

// ── System-specific navigation items ──
const SYSTEM_SPECIFIC_ITEMS = {
  [EDUCATIONAL_SYSTEMS.ANGLOPHONE_GENERAL]: [
    {
      group: "exams",
      label: "GCE Examinations",
      labelFr: "Examens GCE",
      items: [
        {
          key: "gceOLevel",
          path: "/dashboard/exams/gce-o-level",
          icon: "exam",
          description: "Forms 1–5 (FSLC to O-Level)",
          descriptionFr: "Classes 1–5 (FSLC à O-Level)",
        },
        {
          key: "gceALevel",
          path: "/dashboard/exams/gce-a-level",
          icon: "exam",
          description: "Lower & Upper Sixth (A-Level)",
          descriptionFr: "Lower & Upper Sixth (A-Level)",
        },
      ],
    },
    {
      group: "series",
      label: "Series & Specialties",
      labelFr: "Séries & Spécialités",
      items: [
        {
          key: "artsSeries",
          path: "/dashboard/series/arts",
          icon: "book",
          description: "A1 (Lit., Fr., Hist.) – A8 (Arts & Culture)",
          descriptionFr: "A1 (Litt., Fr., Hist.) – A8 (Arts & Culture)",
        },
        {
          key: "scienceSeries",
          path: "/dashboard/series/science",
          icon: "flask",
          description: "S1 (Math, Chem, Phys) – S4 (Bio, Chem, Geo)",
          descriptionFr: "S1 (Math, Chim, Phys) – S4 (Bio, Chim, Géo)",
        },
      ],
    },
    {
      group: "classes",
      label: "Class Levels",
      labelFr: "Niveaux",
      items: [
        {
          key: "lowerSecondary",
          path: "/dashboard/classes/lower-secondary",
          icon: "classes",
          description: "Form 1 · Form 2 · Form 3 · Form 4 · Form 5",
          descriptionFr: "Form 1 · Form 2 · Form 3 · Form 4 · Form 5",
        },
        {
          key: "upperSecondary",
          path: "/dashboard/classes/upper-secondary",
          icon: "classes",
          description: "Lower Sixth · Upper Sixth",
          descriptionFr: "Lower Sixth · Upper Sixth",
        },
      ],
    },
    {
      group: "results",
      label: "Results & Records",
      labelFr: "Résultats & Relevés",
      items: [
        {
          key: "gceResults",
          path: "/dashboard/exams/gce-results",
          icon: "barchart",
        },
        {
          key: "gradeSheets",
          path: "/dashboard/grades/anglophone",
          icon: "file",
        },
      ],
    },
  ],
  [EDUCATIONAL_SYSTEMS.FRANCOPHONE_GENERAL]: [
    {
      group: "exams",
      label: "Examens Officiels",
      labelFr: "Examens Officiels",
      items: [
        {
          key: "bepc",
          path: "/dashboard/exams/bepc",
          icon: "exam",
          description: "Brevet d'Études du Premier Cycle",
          descriptionFr: "Brevet d'Études du Premier Cycle",
        },
        {
          key: "probatoire",
          path: "/dashboard/exams/probatoire",
          icon: "exam",
          description: "Examen probatoire (2ⁿᵈ cycle, 2ᵉ année)",
          descriptionFr: "Examen probatoire (2ⁿᵈ cycle, 2ᵉ année)",
        },
        {
          key: "baccalaureat",
          path: "/dashboard/exams/baccalaureat",
          icon: "exam",
          description: "Baccalauréat Général (séries A–E, TI)",
          descriptionFr: "Baccalauréat Général (séries A–E, TI)",
        },
      ],
    },
    {
      group: "series",
      label: "Séries Baccalaureat",
      labelFr: "Séries Baccalaureat",
      items: [
        {
          key: "literarySeries",
          path: "/dashboard/series/literary",
          icon: "book",
          description: "A (Lettres), A1–A5 (Langues, Philo)",
          descriptionFr: "A (Lettres), A1–A5 (Langues, Philo)",
        },
        {
          key: "scientificSeries",
          path: "/dashboard/series/scientific",
          icon: "flask",
          description: "C (Math-Phys), D (Math-SVT), E (Math-Tech)",
          descriptionFr: "C (Math-Phys), D (Math-SVT), E (Math-Tech)",
        },
        {
          key: "economicSeries",
          path: "/dashboard/series/economic",
          icon: "trending",
          description: "B (Sciences Économiques et Sociales)",
          descriptionFr: "B (Sciences Économiques et Sociales)",
        },
        {
          key: "techSeries",
          path: "/dashboard/series/technical",
          icon: "cpu",
          description: "TI (Technologies de l'Information)",
          descriptionFr: "TI (Technologies de l'Information)",
        },
      ],
    },
    {
      group: "classes",
      label: "Niveaux",
      labelFr: "Niveaux",
      items: [
        {
          key: "college",
          path: "/dashboard/classes/college",
          icon: "classes",
          description: "6ᵉ · 5ᵉ · 4ᵉ · 3ᵉ (Premier cycle)",
          descriptionFr: "6ᵉ · 5ᵉ · 4ᵉ · 3ᵉ (Premier cycle)",
        },
        {
          key: "lycee",
          path: "/dashboard/classes/lycee",
          icon: "classes",
          description: "Seconde · Première · Terminale (Second cycle)",
          descriptionFr: "Seconde · Première · Terminale (Second cycle)",
        },
      ],
    },
    {
      group: "results",
      label: "Résultats & Relevés",
      labelFr: "Résultats & Relevés",
      items: [
        {
          key: "examResults",
          path: "/dashboard/exams/francophone-results",
          icon: "barchart",
        },
        {
          key: "bulletins",
          path: "/dashboard/grades/francophone",
          icon: "file",
        },
      ],
    },
  ],
  [EDUCATIONAL_SYSTEMS.ANGLOPHONE_TECHNICAL]: [
    {
      group: "exams",
      label: "TVEE Examinations",
      labelFr: "Examens TVEE",
      items: [
        {
          key: "tveeIl",
          path: "/dashboard/exams/tvee-il",
          icon: "exam",
          description: "TVEE Intermediate Level (Form 5)",
          descriptionFr: "TVEE Niveau Intermédiaire (Form 5)",
        },
        {
          key: "tveeAl",
          path: "/dashboard/exams/tvee-al",
          icon: "exam",
          description: "TVEE Advanced Level (Upper Sixth)",
          descriptionFr: "TVEE Niveau Avancé (Upper Sixth)",
        },
      ],
    },
    {
      group: "specialties",
      label: "Technical Specialties",
      labelFr: "Spécialités Techniques",
      items: [
        {
          key: "industrial",
          path: "/dashboard/series/industrial",
          icon: "cpu",
          description: "Woodwork, Mechanics, Electrical, Electronics",
          descriptionFr: "Menuiserie, Mécanique, Électrique, Électronique",
        },
        {
          key: "commercial",
          path: "/dashboard/series/commercial",
          icon: "briefcase",
          description: "Accounting, Secretarial, Management",
          descriptionFr: "Comptabilité, Secrétariat, Gestion",
        },
      ],
    },
    {
      group: "classes",
      label: "Class Levels",
      labelFr: "Niveaux",
      items: [
        {
          key: "techLower",
          path: "/dashboard/classes/tech-lower",
          icon: "classes",
          description: "Form 1–5 (Technical)",
          descriptionFr: "Form 1–5 (Technique)",
        },
        {
          key: "techUpper",
          path: "/dashboard/classes/tech-upper",
          icon: "classes",
          description: "Lower & Upper Sixth (Technical)",
          descriptionFr: "Lower & Upper Sixth (Technique)",
        },
      ],
    },
    {
      group: "results",
      label: "Results & Records",
      labelFr: "Résultats & Relevés",
      items: [
        {
          key: "tveeResults",
          path: "/dashboard/exams/tvee-results",
          icon: "barchart",
        },
        {
          key: "techGradeSheets",
          path: "/dashboard/grades/anglophone",
          icon: "file",
        },
      ],
    },
  ],
  [EDUCATIONAL_SYSTEMS.FRANCOPHONE_TECHNICAL]: [
    {
      group: "exams",
      label: "Examens Techniques",
      labelFr: "Examens Techniques",
      items: [
        {
          key: "cap",
          path: "/dashboard/exams/cap",
          icon: "exam",
          description: "Certificat d'Aptitude Professionnelle",
          descriptionFr: "Certificat d'Aptitude Professionnelle",
        },
        {
          key: "probatoireTechnique",
          path: "/dashboard/exams/probatoire-technique",
          icon: "exam",
          description: "Probatoire Technique (2ᵉ année)",
          descriptionFr: "Probatoire Technique (2ᵉ année)",
        },
        {
          key: "bacTechnique",
          path: "/dashboard/exams/bac-technique",
          icon: "exam",
          description: "Baccalauréat Technique / Brevet de Technicien",
          descriptionFr: "Baccalauréat Technique / Brevet de Technicien",
        },
      ],
    },
    {
      group: "filières",
      label: "Filières Techniques",
      labelFr: "Filières Techniques",
      items: [
        {
          key: "industrielFiliere",
          path: "/dashboard/series/industriel",
          icon: "cpu",
          description: "TI — Techniques Industrielles",
          descriptionFr: "TI — Techniques Industrielles",
        },
        {
          key: "tertiaireFiliere",
          path: "/dashboard/series/tertiaire",
          icon: "briefcase",
          description: "STT — Sciences et Technologies du Tertiaire",
          descriptionFr: "STT — Sciences et Technologies du Tertiaire",
        },
      ],
    },
    {
      group: "classes",
      label: "Niveaux",
      labelFr: "Niveaux",
      items: [
        {
          key: "techCollege",
          path: "/dashboard/classes/tech-college",
          icon: "classes",
          description: "6ᵉ · 5ᵉ · 4ᵉ · 3ᵉ (Lycée technique)",
          descriptionFr: "6ᵉ · 5ᵉ · 4ᵉ · 3ᵉ (Lycée technique)",
        },
        {
          key: "techLycee",
          path: "/dashboard/classes/tech-lycee",
          icon: "classes",
          description: "Seconde · Première · Terminale (Lycée technique)",
          descriptionFr: "Seconde · Première · Terminale (Lycée technique)",
        },
      ],
    },
    {
      group: "results",
      label: "Résultats & Relevés",
      labelFr: "Résultats & Relevés",
      items: [
        {
          key: "techExamResults",
          path: "/dashboard/exams/tech-results",
          icon: "barchart",
        },
        {
          key: "techBulletins",
          path: "/dashboard/grades/francophone",
          icon: "file",
        },
      ],
    },
  ],
  [EDUCATIONAL_SYSTEMS.UNIVERSITY]: [
    {
      group: "programs",
      label: "LMD Programs",
      labelFr: "Programmes LMD",
      items: [
        {
          key: "licence",
          path: "/dashboard/programs/licence",
          icon: "graduation",
          description: "Licence (Bac+3) · Bachelor",
          descriptionFr: "Licence (Bac+3) · Bachelor",
        },
        {
          key: "master",
          path: "/dashboard/programs/master",
          icon: "graduation",
          description: "Master (Bac+5)",
          descriptionFr: "Master (Bac+5)",
        },
        {
          key: "doctorate",
          path: "/dashboard/programs/doctorate",
          icon: "graduation",
          description: "Doctorat (Bac+8) · PhD",
          descriptionFr: "Doctorat (Bac+8) · PhD",
        },
      ],
    },
    {
      group: "faculties",
      label: "Faculties & Departments",
      labelFr: "Facultés & Départements",
      items: [
        {
          key: "faculties",
          path: "/dashboard/faculties",
          icon: "building",
          description: "Sciences, Arts, Health, Engineering",
          descriptionFr: "Sciences, Arts, Santé, Ingénierie",
        },
        {
          key: "departments",
          path: "/dashboard/departments",
          icon: "layers",
          description: "Departmental management",
          descriptionFr: "Gestion des départements",
        },
      ],
    },
    {
      group: "research",
      label: "Research & Publications",
      labelFr: "Recherche & Publications",
      items: [
        {
          key: "researchProjects",
          path: "/dashboard/research",
          icon: "search",
          description: "Research projects & grants",
          descriptionFr: "Projets de recherche & subventions",
        },
        {
          key: "publications",
          path: "/dashboard/publications",
          icon: "file",
          description: "Journals, papers & theses",
          descriptionFr: "Revues, articles & thèses",
        },
      ],
    },
    {
      group: "admissions",
      label: "Admissions",
      labelFr: "Admissions",
      items: [
        {
          key: "applications",
          path: "/dashboard/admissions/applications",
          icon: "users",
        },
        {
          key: "enrollment",
          path: "/dashboard/admissions/enrollment",
          icon: "barchart",
        },
      ],
    },
  ],
};

// ── Base nav config per role ──
const BASE_NAV_CONFIG = {
  ADMIN: [
    {
      group: "overview",
      items: [{ key: "dashboard", path: "/dashboard", icon: "grid" }],
    },
    {
      group: "academic",
      items: [
        {
          key: "students",
          path: "/dashboard/students",
          icon: "users",
          badge: 248,
        },
        { key: "classes", path: "/dashboard/classes", icon: "classes" },
        { key: "subjects", path: "/dashboard/subjects", icon: "subjects" },
        { key: "teachers", path: "/dashboard/teachers", icon: "teacher" },
      ],
    },
    {
      group: "grades",
      items: [
        { key: "gradeReports", path: "/dashboard/grades", icon: "barchart" },
        { key: "reportCards", path: "/dashboard/report-cards", icon: "file" },
        { key: "attendance", path: "/dashboard/attendance", icon: "calendar" },
      ],
    },
    {
      group: "finance",
      items: [
        {
          key: "finance",
          path: "/dashboard/finance",
          icon: "dollar",
          badge: 3,
        },
      ],
    },
    {
      group: "system",
      items: [
        { key: "settings", path: "/dashboard/settings", icon: "settings" },
      ],
    },
  ],
  TEACHER: [
    {
      group: "overview",
      items: [{ key: "dashboard", path: "/dashboard", icon: "grid" }],
    },
    {
      group: "academic",
      items: [
        { key: "myClasses", path: "/dashboard/my-classes", icon: "classes" },
        { key: "gradeEntry", path: "/dashboard/grade-entry", icon: "barchart" },
        { key: "attendance", path: "/dashboard/attendance", icon: "calendar" },
      ],
    },
  ],
  STUDENT: [
    {
      group: "overview",
      items: [{ key: "dashboard", path: "/dashboard", icon: "grid" }],
    },
    {
      group: "academic",
      items: [
        { key: "myGrades", path: "/dashboard/my-grades", icon: "barchart" },
        {
          key: "myAttendance",
          path: "/dashboard/my-attendance",
          icon: "calendar",
        },
        { key: "myFees", path: "/dashboard/my-fees", icon: "dollar" },
      ],
    },
  ],
};

// ── Get filtered nav config based on educational systems ──
function getNavConfig(role, educationalSystems = []) {
  const baseConfig = BASE_NAV_CONFIG[role] || BASE_NAV_CONFIG.ADMIN;

  if (!educationalSystems || educationalSystems.length === 0) {
    return baseConfig;
  }

  // Add system-specific items for each selected system with separators
  const systemSpecificGroups = [];
  educationalSystems.forEach((system, idx) => {
    const systemItems = SYSTEM_SPECIFIC_ITEMS[system];
    if (systemItems) {
      // Add a divider label before each system's groups (except the first)
      if (idx > 0) {
        systemSpecificGroups.push({ group: `_divider_${system}`, divider: true });
      }
      systemSpecificGroups.push(...systemItems);
    }
  });

  // Insert system-specific items after "academic" group, before "grades"
  const academicGroupIndex = baseConfig.findIndex(
    (g) => g.group === "academic",
  );
  const gradesGroupIndex = baseConfig.findIndex((g) => g.group === "grades");

  if (academicGroupIndex !== -1 && gradesGroupIndex !== -1) {
    const newConfig = [...baseConfig];
    newConfig.splice(academicGroupIndex + 1, 0, ...systemSpecificGroups);
    return newConfig;
  }

  // If groups not found, just append at the end
  return [...baseConfig, ...systemSpecificGroups];
}

// ── Icon set ──
const ICONS = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  classes: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  subjects: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  teacher: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  barchart: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  dollar: (
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  // New icons for educational systems
  exam: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="12" y1="6" x2="12" y2="18" />
    </>
  ),
  flask: (
    <>
      <path d="M10 2v7.31" />
      <path d="M14 2v7.31" />
      <path d="M8.5 2h7" />
      <path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
    </>
  ),
  trending: (
    <>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </>
  ),
  cpu: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </>
  ),
  wrench: (
    <>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  graduation: (
    <>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </>
  ),
  layers: (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
};

function NavIcon({ name, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {ICONS[name]}
    </svg>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.roles?.[0] || "ADMIN";
  const educationalSystems = user?.school?.educationalSystems || [];
  const navGroups = getNavConfig(role, educationalSystems);

  const initials = (user?.schoolName || "SC")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const userInitials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <>
      {/* Mobile overlay — always rendered for fade animation */}
      <div
        className={`fixed inset-0 z-[150] lg:hidden bg-black/45 transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={`
          bg-primary-900 dark:bg-surface-950 flex flex-col flex-shrink-0 h-screen
          transition-all duration-300 ease-out overflow-hidden
          fixed lg:sticky top-0 left-0 z-[200]
          ${collapsed ? "lg:w-16" : "lg:w-60"}
          w-60
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-2.5 h-14 border-b border-white/[0.07] flex-shrink-0 overflow-hidden ${collapsed ? "lg:justify-center lg:px-0" : "px-4"}`}
        >
          <img
            src={akademeeLogo}
            alt="Akademee"
            className="w-8 h-8 object-contain flex-shrink-0"
          />
          <span
            className={`font-display text-lg text-primary-100 whitespace-nowrap transition-opacity ${collapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100"}`}
          >
            Akademee
          </span>
        </div>

        {/* School badge */}
        <div
          className={`m-2.5 bg-white/[0.07] rounded-md flex items-center gap-2.5 flex-shrink-0 transition-[padding] overflow-hidden ${collapsed ? "lg:p-2.5 lg:justify-center" : "p-2.5"}`}
        >
          <div className="w-8 h-8 rounded-sm bg-primary-700 flex items-center justify-center text-[12px] font-semibold text-primary-100 flex-shrink-0">
            {initials}
          </div>
          <div
            className={`overflow-hidden transition-opacity ${collapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100"}`}
          >
            <div className="text-[13px] font-semibold text-primary-100 whitespace-nowrap overflow-hidden text-ellipsis">
              {user?.schoolName || "School"}
            </div>
            <div className="text-[11px] text-primary-400 whitespace-nowrap">
              {user?.subdomain ? `${user.subdomain}.akademee.cm` : ""}
            </div>
          </div>
        </div>

        {/* System badges */}
        {educationalSystems.length > 0 && !collapsed && (
          <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b border-white/[0.07]">
            {educationalSystems.map((sys) => {
              const colors = SYSTEM_COLORS[sys];
              const labels = SYSTEM_LABELS[sys];
              if (!colors || !labels) return null;
              return (
                <span
                  key={sys}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                  {labels.en}
                </span>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-none">
          {navGroups.map((group) => {
            // Skip dividers when collapsed
            if (group.divider && collapsed) return null;

            // Render a divider/spacer between system sections
            if (group.divider) {
              return (
                <div key={group.group} className="px-5 pt-4 pb-1">
                  <div className="h-px bg-white/[0.06]" />
                </div>
              );
            }

            return (
              <div key={group.group}>
                <div
                  className={`flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase text-primary-400/60 px-5 pt-3 pb-1 whitespace-nowrap transition-opacity ${collapsed ? "lg:opacity-0 lg:hidden" : "opacity-100"}`}
                >
                  {t(`nav.group.${group.group}`, group.group)}
                </div>

                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={`
                        group relative flex items-center gap-2.5 min-h-[36px] mx-2 px-3 rounded-md
                        text-[13px] whitespace-nowrap overflow-hidden transition-colors
                        ${
                          isActive
                            ? "bg-primary-600 text-white font-medium"
                            : "text-primary-200 hover:bg-white/[0.08] hover:text-white"
                        }
                        ${collapsed ? "lg:justify-center lg:px-0" : ""}
                      `}
                    >
                      <NavIcon
                        name={item.icon}
                        className="w-[16px] h-[16px] flex-shrink-0 opacity-80"
                      />
                      <span
                        className={`flex flex-col transition-opacity min-w-0 ${collapsed ? "lg:opacity-0 lg:hidden" : "opacity-100"}`}
                      >
                        <span className="text-[13px] leading-tight truncate">
                          {t(`nav.${item.key}`, item.key)}
                        </span>
                        {item.description && (
                          <span className="text-[10px] text-primary-400/60 leading-tight truncate">
                            {i18n.language === "fr" && item.descriptionFr ? item.descriptionFr : item.description}
                          </span>
                        )}
                      </span>
                      {item.badge != null && (
                        <span
                          className={`ml-auto bg-primary-400 text-primary-950 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 transition-opacity ${collapsed ? "lg:opacity-0 lg:hidden" : "opacity-100"}`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip when collapsed (desktop only) */}
                      {collapsed && (
                        <span className="hidden lg:group-hover:block absolute left-[60px] top-1/2 -translate-y-1/2 bg-surface-900 text-white text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap z-[200] shadow-lg">
                          {t(`nav.${item.key}`, item.key)}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer — user */}
        <div className="border-t border-white/[0.07] p-2 flex-shrink-0">
          <div
            className={`flex items-center gap-2.5 h-12 px-3 rounded-md ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
          >
            <div className="w-[30px] h-[30px] rounded-full bg-primary-700 flex items-center justify-center text-[12px] font-semibold text-primary-100 flex-shrink-0">
              {userInitials || "U"}
            </div>
            <div
              className={`overflow-hidden transition-opacity ${collapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100"}`}
            >
              <div className="text-[13px] font-medium text-primary-100 whitespace-nowrap overflow-hidden text-ellipsis">
                {(user?.firstName || "") + " " + (user?.lastName || "") ||
                  user?.email ||
                  "User"}
              </div>
              <div className="text-[11px] text-primary-400 whitespace-nowrap">
                {t(`roles.${role}`, role)}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
