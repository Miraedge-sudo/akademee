import { useState, useEffect, useMemo, useCallback, useContext } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import { YearContext } from "../../../core/context/YearContext";
import { useTheme } from "../../../core/hooks/useTheme";
import { getClasses } from "../../../core/api/classService";
import YearSelector from "../../../components/ui/YearSelector";
import {
  FiBookOpen,
  FiPlus,
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiHome,
  FiUsers,
  FiBook,
  FiAlertTriangle,
  FiUser,
} from "react-icons/fi";

// ── Level metadata (from the design HTML) ──
const LEVEL_META = {
  "lower-secondary": {
    icon: "📗",
    title: "Lower Secondary",
    titleFr: "Premier cycle",
    description: "Form 1 · Form 2 · Form 3 · Form 4 · Form 5",
    descriptionFr: "Form 1 · Form 2 · Form 3 · Form 4 · Form 5",
    system: "Anglophone General",
  },
  "upper-secondary": {
    icon: "📘",
    title: "Upper Secondary",
    titleFr: "Second cycle",
    description: "Lower Sixth · Upper Sixth",
    descriptionFr: "Lower Sixth · Upper Sixth",
    system: "Anglophone General",
  },
  college: {
    icon: "📙",
    title: "Collège",
    titleFr: "Collège",
    description: "6ᵉ · 5ᵉ · 4ᵉ · 3ᵉ (Premier cycle)",
    descriptionFr: "6ᵉ · 5ᵉ · 4ᵉ · 3ᵉ (Premier cycle)",
    system: "Francophone General",
  },
  lycee: {
    icon: "📕",
    title: "Lycée",
    titleFr: "Lycée",
    description: "Seconde · Première · Terminale (Second cycle)",
    descriptionFr: "Seconde · Première · Terminale (Second cycle)",
    system: "Francophone General",
  },
  "tech-lower": {
    icon: "📗",
    title: "Technical Lower",
    titleFr: "Technique premier cycle",
    description: "Form 1–5 (Technical)",
    descriptionFr: "Form 1–5 (Technique)",
    system: "Anglophone Technical",
  },
  "tech-upper": {
    icon: "📘",
    title: "Technical Upper",
    titleFr: "Technique second cycle",
    description: "Lower & Upper Sixth (Technical)",
    descriptionFr: "Lower & Upper Sixth (Technique)",
    system: "Anglophone Technical",
  },
  "tech-college": {
    icon: "📙",
    title: "Collège Technique",
    titleFr: "Collège Technique",
    description: "6ᵉ · 5ᵉ · 4ᵉ · 3ᵉ (Lycée technique)",
    descriptionFr: "6ᵉ · 5ᵉ · 4ᵉ · 3ᵉ (Lycée technique)",
    system: "Francophone Technical",
  },
  "tech-lycee": {
    icon: "📕",
    title: "Lycée Technique",
    titleFr: "Lycée Technique",
    description: "Seconde · Première · Terminale (Lycée technique)",
    descriptionFr: "Seconde · Première · Terminale (Lycée technique)",
    system: "Francophone Technical",
  },
};

// ── Level color palette (matching the design HTML) ──
const LEVEL_COLORS = {
  "Form 1": "#6366F1",
  "Form 2": "#0EA5E9",
  "Form 3": "#14B8A6",
  "Form 4": "#F59E0B",
  "Form 5": "#EF4444",
  "Lower 6th": "#A855F7",
  "Upper 6th": "#085041",
  "6e": "#6366F1",
  "5e": "#0EA5E9",
  "4e": "#14B8A6",
  "3e": "#F59E0B",
  Seconde: "#A855F7",
  Première: "#EF4444",
  Terminale: "#085041",
};

function hexToRgba(hex, alpha = 1) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) {
    return `rgba(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}, ${alpha})`;
  }
  return `rgba(8, 80, 65, ${alpha})`;
}

function getLevelColor(className) {
  for (const [key, color] of Object.entries(LEVEL_COLORS)) {
    if (className?.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  return "#085041";
}

// ── Skeleton card component ──
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700" />
        <div className="w-16 h-5 rounded-full bg-surface-100 dark:bg-surface-700" />
      </div>
      <div className="h-4 w-3/4 bg-surface-100 dark:bg-surface-700 rounded mb-2" />
      <div className="h-3 w-1/2 bg-surface-100 dark:bg-surface-700 rounded mb-4" />
      <div className="h-2 w-full bg-surface-100 dark:bg-surface-700 rounded-full mb-3" />
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-700" />
        <div className="h-3 w-20 bg-surface-100 dark:bg-surface-700 rounded" />
      </div>
    </div>
  );
}

// ── Stat Card ──
function StatCard({ icon, value, label, color }) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-2xl font-extrabold leading-tight mb-0.5" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-surface-400 font-medium">{label}</div>
    </div>
  );
}

// ── Level Group (accordion) ──
function LevelGroup({ levelKey, meta, classes, collapsed, onToggle, pc, lang }) {
  const isFr = lang === "fr";
  const levelLabel = isFr ? meta.titleFr : meta.title;
  const levelDesc = isFr ? meta.descriptionFr : meta.description;

  return (
    <div className={`mb-7 ${collapsed ? "collapsed" : ""}`}>
      {/* Level header */}
      <div
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer mb-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors select-none"
        onClick={onToggle}
      >
        <FiChevronDown
          className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
        <span className="text-xs font-bold text-surface-800 dark:text-surface-100 flex-1 uppercase tracking-wider">
          {levelLabel}
        </span>
        {meta.system && (
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: hexToRgba(pc, 0.08),
              color: pc,
              border: `1px solid ${hexToRgba(pc, 0.2)}`,
            }}
          >
            {meta.system}
          </span>
        )}
        <span
          className="text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{
            background: hexToRgba(pc, 0.08),
            color: pc,
            border: `1px solid ${hexToRgba(pc, 0.2)}`,
          }}
        >
          {classes.length} classe{classes.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Cards grid */}
      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {classes.map((cls) => {
            const lvlColor = getLevelColor(cls.name);
            const pct = cls.capacity > 0
              ? Math.min(Math.round(((cls.studentCount || 0) / cls.capacity) * 100), 100)
              : 0;
            const isFull = pct >= 90;

            return (
              <Link
                key={cls.id}
                to={`/dashboard/classes/${cls.id}`}
                className="group block bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 relative overflow-hidden"
                style={{ borderColor: collapsed ? undefined : lvlColor + "30" }}
              >
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </div>

                {/* Card header */}
                <div className="flex items-start justify-between mb-3.5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{
                      background: hexToRgba(lvlColor, 0.08),
                      border: `1.5px solid ${hexToRgba(lvlColor, 0.2)}`,
                      color: lvlColor,
                    }}
                  >
                    {(cls.name?.match(/[A-Z]/g) || ["A"]).slice(-1)}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                      isFull
                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                        : ""
                    }`}
                    style={
                      !isFull
                        ? {
                            background: hexToRgba(pc, 0.08),
                            color: pc,
                            border: `1px solid ${hexToRgba(pc, 0.2)}`,
                          }
                        : undefined
                    }
                  >
                    {cls.studentCount || 0} / {cls.capacity || "—"}
                  </span>
                </div>

                {/* Class name */}
                <h3 className="font-bold text-base text-surface-800 dark:text-surface-100 mb-1">
                  {cls.name}
                </h3>
                {/* Level / Details */}
                <p className="text-xs text-surface-400 mb-4">
                  {levelDesc}
                </p>

                {/* Capacity bar */}
                <div className="mb-3.5">
                  <div className="flex justify-between text-[10px] text-surface-400 mb-1">
                    <span>{isFr ? "Capacité" : "Capacity"}</span>
                    <span
                      className={`font-semibold ${isFull ? "text-red-500" : ""}`}
                      style={!isFull ? { color: lvlColor } : undefined}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: isFull
                          ? "linear-gradient(90deg, #EF4444, #F87171)"
                          : `linear-gradient(90deg, ${lvlColor}, ${hexToRgba(lvlColor, 0.6)})`,
                      }}
                    />
                  </div>
                </div>

                {/* Teacher info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{
                        background: hexToRgba(lvlColor, 0.08),
                        border: `1.5px solid ${hexToRgba(lvlColor, 0.2)}`,
                        color: lvlColor,
                      }}
                    >
                      {cls.classTeacherId ? <FiUser className="w-3.5 h-3.5" /> : "—"}
                    </div>
                    <span className="text-xs text-surface-500">
                      {cls.teacherName || (isFr ? "Aucun titulaire" : "No teacher")}
                    </span>
                  </div>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 group-hover:scale-110 transition-transform"
                  >
                    <FiChevronRight className="w-3.5 h-3.5 text-surface-500" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Empty state ──
function EmptyState({ onCreate, isFr }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
        <FiBookOpen className="w-8 h-8 text-surface-400" />
      </div>
      <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
        {isFr ? "Aucune classe" : "No classes yet"}
      </h3>
      <p className="text-sm text-surface-400 max-w-md mb-5">
        {isFr
          ? "Créez votre première classe pour commencer à organiser vos élèves."
          : "Create your first class to start organising students."}
      </p>
      {onCreate && (
        <button
          onClick={onCreate}
          className="flex items-center gap-2 h-11 px-5 text-white text-sm font-semibold rounded-lg transition-all hover:shadow-lg active:scale-98"
          style={{ backgroundColor: "var(--primary-color, #085041)" }}
        >
          <FiPlus className="w-4 h-4" />
          {isFr ? "Créer une classe" : "Create class"}
        </button>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ──
export default function ClassesChildrenSection() {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const pc = primaryColor || "#085041";

  const classSlug = location.pathname.replace("/dashboard/classes/", "");
  const meta = LEVEL_META[classSlug] || null;

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedLevels, setCollapsedLevels] = useState({});
  const { selectedYearId, setSelectedYearId } = useContext(YearContext);

  const loadClasses = useCallback(async (yearId) => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (yearId) params.academicYearId = yearId;
      const result = await getClasses(params);
      setClasses(result.classes || []);
    } catch (err) {
      console.error("Error loading classes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses(selectedYearId);
  }, [selectedYearId, loadClasses]);

  // Group classes by level
  const groupedClasses = useMemo(() => {
    const groups = {};
    classes.forEach((cls) => {
      const name = cls.name || "";
      let level = "Other";

      // Detect level from class name
      if (/form\s*[1-5]/i.test(name)) level = "Form 1–5";
      else if (/lower\s*6th|lower\s*sixth/i.test(name)) level = "Lower Sixth";
      else if (/upper\s*6th|upper\s*sixth/i.test(name)) level = "Upper Sixth";
      else if (/6e|6ᵉ/.test(name)) level = "6e";
      else if (/5e|5ᵉ/.test(name)) level = "5e";
      else if (/4e|4ᵉ/.test(name)) level = "4e";
      else if (/3e|3ᵉ/.test(name)) level = "3e";
      else if (/seconde/i.test(name)) level = "Seconde";
      else if (/première|premiere/i.test(name)) level = "Première";
      else if (/terminale/i.test(name)) level = "Terminale";
      else level = name.split(/[\s-]/)[0] || "Other";

      if (!groups[level]) groups[level] = [];
      groups[level].push(cls);
    });
    return groups;
  }, [classes]);

  // Stats
  const stats = useMemo(() => {
    const totalStudents = classes.reduce((s, c) => s + (c.studentCount || 0), 0);
    const totalClasses = classes.length;
    const levelCount = Object.keys(groupedClasses).length;
    const almostFull = classes.filter((c) => {
      const pct = c.capacity > 0
        ? ((c.studentCount || 0) / c.capacity) * 100
        : 0;
      return pct >= 90;
    }).length;
    return { totalStudents, totalClasses, levelCount, almostFull };
  }, [classes, groupedClasses]);

  // Filter classes by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedClasses;
    const q = searchQuery.toLowerCase();
    const filtered = {};
    Object.entries(groupedClasses).forEach(([level, clsList]) => {
      const matched = clsList.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          level.toLowerCase().includes(q)
      );
      if (matched.length > 0) filtered[level] = matched;
    });
    return filtered;
  }, [groupedClasses, searchQuery]);

  const totalFiltered = Object.values(filteredGroups).reduce(
    (s, arr) => s + arr.length,
    0
  );

  const toggleLevel = (level) => {
    setCollapsedLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  const handleCreate = () => {
    navigate("/dashboard/classes/new");
  };

  const totalClasses = classes.length;
  const isFr = lang === "fr";

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7 animate-fadeIn">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: pc }}
            />
            <h1 className="font-display text-2xl font-bold text-surface-800 dark:text-surface-100">
              {meta
                ? isFr
                  ? meta.titleFr
                  : meta.title
                : isFr
                  ? "Toutes les classes"
                  : "Classes"}
            </h1>
          </div>
          <p className="text-sm text-surface-400 ml-3.5">
            {totalClasses > 0
              ? isFr
                ? `${totalClasses} classe${totalClasses > 1 ? "s" : ""} · ${stats.totalStudents} élève${stats.totalStudents > 1 ? "s" : ""}`
                : `${totalClasses} class${totalClasses > 1 ? "es" : ""} · ${stats.totalStudents} student${stats.totalStudents > 1 ? "s" : ""}`
              : isFr
                ? "Gérer les niveaux et les classes"
                : "Manage class levels and sections"}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 h-11 px-5 text-white text-sm font-semibold rounded-lg transition-all hover:shadow-lg active:scale-[0.98]"
          style={{ backgroundColor: pc }}
        >
          <FiPlus className="w-4 h-4" />
          {isFr ? "Nouvelle classe" : "New class"}
        </button>
      </div>

      {/* ── Stats Strip ── */}
      {!loading && totalClasses > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7 animate-fadeIn" style={{ animationDelay: "0.05s" }}>
          <StatCard icon={<FiHome className="w-5 h-5" />} value={stats.totalClasses} label={isFr ? "Total classes" : "Total classes"} color={pc} />
          <StatCard icon={<FiUsers className="w-5 h-5" />} value={stats.totalStudents} label={isFr ? "Total élèves" : "Total students"} color="#1D9E75" />
          <StatCard icon={<FiBook className="w-5 h-5" />} value={stats.levelCount} label={isFr ? "Niveaux actifs" : "Levels active"} color="#0EA5E9" />
          <StatCard icon={<FiAlertTriangle className="w-5 h-5" />} value={stats.almostFull} label={isFr ? "Presque pleines" : "Almost full"} color="#EF4444" />
        </div>
      )}

      {/* ── Filters ── */}
      {!loading && totalClasses > 0 && (
        <div className="flex items-center gap-3 mb-7 animate-fadeIn flex-wrap" style={{ animationDelay: "0.1s" }}>
          <div className="w-56">
            <YearSelector value={selectedYearId} onChange={setSelectedYearId} />
          </div>
          <div className="flex-1 min-w-[200px] max-w-sm flex items-center gap-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-3.5 h-11 shadow-sm focus-within:border-primary-600 transition-colors"
            style={{ "--tw-ring-color": pc }}>
            <FiSearch className="w-4 h-4 text-surface-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isFr ? "Rechercher par classe ou niveau..." : "Search by class or level..."}
              className="flex-1 border-none outline-none text-sm bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-400"
            />
          </div>
          <span className="text-xs text-surface-400 whitespace-nowrap">
            {totalFiltered} résultat{totalFiltered > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && totalClasses === 0 && (
        <EmptyState onCreate={handleCreate} isFr={isFr} />
      )}

      {/* ── Class Groups ── */}
      {!loading && totalClasses > 0 && (
        <div>
          {Object.entries(filteredGroups).length === 0 && searchQuery.trim() ? (
            <div className="text-center py-12">
              <p className="text-sm text-surface-400">
                {isFr
                  ? `Aucune classe trouvée pour "${searchQuery}"`
                  : `No classes found for "${searchQuery}"`}
              </p>
            </div>
          ) : (
            Object.entries(filteredGroups).map(([level, clsList]) => (
              <LevelGroup
                key={level}
                levelKey={level}
                meta={{
                  title: level,
                  titleFr: level,
                  description: `${clsList.length} class${clsList.length > 1 ? "es" : ""}`,
                  descriptionFr: `${clsList.length} classe${clsList.length > 1 ? "s" : ""}`,
                  system: "",
                }}
                classes={clsList}
                collapsed={collapsedLevels[level] ?? false}
                onToggle={() => toggleLevel(level)}
                pc={pc}
                lang={lang}
              />
            ))
          )}
        </div>
      )}

      {/* ── Mobile FAB ── */}
      {!loading && totalClasses > 0 && (
        <button
          onClick={handleCreate}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full text-white shadow-lg z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          style={{ backgroundColor: pc }}
        >
          <FiPlus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
