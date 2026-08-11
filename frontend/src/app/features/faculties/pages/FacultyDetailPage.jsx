import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiGitBranch,
  FiHome,
  FiMail,
  FiPhone,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import universityService from "../../../core/api/universityService";
import Select from "../../../components/ui/Select";

const PAGE_SIZE = 10;

const CYCLE_LABELS = {
  LICENCE: { en: "Licence", fr: "Licence" },
  MASTER: { en: "Master", fr: "Master" },
  DOCTORATE: { en: "Doctorate", fr: "Doctorat" },
};

const CYCLE_BADGE = {
  LICENCE: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  MASTER: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  DOCTORATE: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
};

const CYCLE_BAR = {
  LICENCE: "bg-blue-500",
  MASTER: "bg-violet-500",
  DOCTORATE: "bg-amber-500",
};

const LANGUAGE_LABELS = {
  FR: "Français",
  EN: "English",
  BILINGUAL: "Bilingue",
};

const EMPTY_CYCLE_COUNTS = { LICENCE: 0, MASTER: 0, DOCTORATE: 0 };

// ── Stat chip ──
function StatChip({ icon, value, label }) {
  return (
    <div className="bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700 rounded-xl p-4 flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[22px] font-extrabold text-surface-900 dark:text-surface-100 leading-tight">
          {value}
        </div>
        <div className="text-[11px] text-surface-400 font-medium truncate">{label}</div>
      </div>
    </div>
  );
}

export default function FacultyDetailPage() {
  const { id } = useParams();
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";

  const [faculty, setFaculty] = useState(null);
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [loading, setLoading] = useState(true);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cycleFilter, setCycleFilter] = useState("");
  const [page, setPage] = useState(1);

  // ── Load programs for a given page/cycle (called from handlers & initial load) ──
  const fetchPrograms = useCallback(
    async (targetPage, targetCycle) => {
      setProgramsLoading(true);
      try {
        const result = await universityService.faculties.getPrograms(id, {
          page: targetPage,
          limit: PAGE_SIZE,
          cycle: targetCycle,
        });
        setPrograms(result.items || []);
        setPagination(
          result.pagination || { page: targetPage, limit: PAGE_SIZE, total: 0 }
        );
      } catch {
        setPrograms([]);
        setPagination((p) => ({ ...p, total: 0 }));
        toast.error(isFr ? "Erreur de chargement des programmes" : "Failed to load programs");
      } finally {
        setProgramsLoading(false);
      }
    },
    [id, isFr]
  );

  // ── Faculty + stats + departments + first programs page (loaded once) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [facultyData, statsData, departmentsData] = await Promise.all([
          universityService.faculties.get(id),
          universityService.faculties.getStats(id).catch(() => null),
          universityService.departments
            .list({ limit: 100, faculty_id: id })
            .then((r) => r.items)
            .catch(() => []),
        ]);
        if (cancelled) return;
        if (!facultyData) {
          setError("NOT_FOUND");
          return;
        }
        setFaculty(facultyData);
        setStats(statsData);
        setDepartments(departmentsData);

        await fetchPrograms(1, "");
        if (cancelled) return;
        setPage(1);
      } catch (err) {
        if (!cancelled) setError(err?.response?.status === 404 ? "NOT_FOUND" : "ERROR");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, fetchPrograms]);

  // ── Cycle filter change ──
  const handleCycleChange = (value) => {
    setCycleFilter(value);
    setPage(1);
    fetchPrograms(1, value);
  };

  // ── Pagination change ──
  const changePage = (next) => {
    setPage(next);
    fetchPrograms(next, cycleFilter);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-9 h-9 rounded-full border-[3px] border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  // ── Not found / Error ──
  if (error === "NOT_FOUND" || !faculty) {
    return (
      <div className="text-center py-20">
        <FiHome className="w-12 h-12 mx-auto text-surface-300 mb-3" />
        <h3 className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-2">
          {isFr ? "Faculté introuvable" : "Faculty not found"}
        </h3>
        <Link
          to="/dashboard/faculties"
          className="text-sm font-semibold text-primary-600 hover:underline inline-flex items-center gap-1.5"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          {isFr ? "Retour aux facultés" : "Back to faculties"}
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h3 className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-2">
          {isFr ? "Erreur de chargement" : "Error loading faculty"}
        </h3>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-semibold text-primary-600 hover:underline"
        >
          {isFr ? "Réessayer" : "Retry"}
        </button>
      </div>
    );
  }

  const cycleCounts = { ...EMPTY_CYCLE_COUNTS, ...(stats?.programsByCycle || {}) };
  const cycleTotal = cycleCounts.LICENCE + cycleCounts.MASTER + cycleCounts.DOCTORATE;
  const totalPages = Math.max(1, Math.ceil(pagination.total / PAGE_SIZE));
  const cycleOptions = [
    { value: "", label: isFr ? "Tous les cycles" : "All cycles" },
    ...Object.keys(CYCLE_LABELS).map((c) => ({
      value: c,
      label: CYCLE_LABELS[c][isFr ? "fr" : "en"],
    })),
  ];

  const statsChips = [
    { icon: <FiUsers className="w-4 h-4 text-primary-600 dark:text-primary-400" />, value: stats?.departmentsCount ?? departments.length, label: isFr ? "Départements" : "Departments" },
    { icon: <FiAward className="w-4 h-4 text-primary-600 dark:text-primary-400" />, value: stats?.programsCount ?? pagination.total, label: isFr ? "Programmes" : "Programs" },
    { icon: <FiGitBranch className="w-4 h-4 text-primary-600 dark:text-primary-400" />, value: stats?.activeResearchProjects ?? 0, label: isFr ? "Projets de recherche actifs" : "Active research projects" },
    { icon: <FiFileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />, value: stats?.publicationsCount ?? 0, label: isFr ? "Publications" : "Publications" },
    { icon: <FiCalendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />, value: stats?.publicationsThisYear ?? 0, label: isFr ? "Publications cette année" : "Publications this year" },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-5">
        <Link to="/dashboard/faculties" className="hover:text-primary-600 transition-colors">
          {isFr ? "Facultés" : "Faculties"}
        </Link>
        <span>/</span>
        <span className="text-surface-800 dark:text-surface-100 font-medium">{faculty.name}</span>
      </nav>

      {/* ── Hero card ── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-6 sm:p-7 border border-surface-200 dark:border-surface-700 shadow-md mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-[60px] h-[60px] rounded-xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 flex items-center justify-center text-xl font-bold text-primary-700 dark:text-primary-300 shrink-0">
              {(faculty.name?.[0] || "F").toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-surface-800 dark:text-surface-100">
                  {faculty.name}
                </h1>
                <span className="inline-flex px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-[11px] font-bold text-primary-700 dark:text-primary-300">
                  {faculty.code}
                </span>
                {faculty.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    <FiCheckCircle className="w-3 h-3" /> {isFr ? "Active" : "Active"}
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-100 dark:bg-surface-700 text-surface-500">
                    {isFr ? "Inactive" : "Inactive"}
                  </span>
                )}
              </div>
              {faculty.nameFr && (
                <p className="text-sm text-surface-400 mt-1">{faculty.nameFr}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[12.5px] text-surface-500 dark:text-surface-400">
                {faculty.deanName && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiUsers className="w-3.5 h-3.5 text-surface-400" />
                    {faculty.deanName}
                  </span>
                )}
                {faculty.building && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiHome className="w-3.5 h-3.5 text-surface-400" />
                    {faculty.building}
                  </span>
                )}
                {faculty.establishedYear && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5 text-surface-400" />
                    {isFr ? "Depuis" : "Since"} {faculty.establishedYear}
                  </span>
                )}
                {faculty.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiMail className="w-3.5 h-3.5 text-surface-400" />
                    {faculty.email}
                  </span>
                )}
                {faculty.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiPhone className="w-3.5 h-3.5 text-surface-400" />
                    {faculty.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            to="/dashboard/faculties"
            className="h-9 px-3.5 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-xs font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            {isFr ? "Retour" : "Back"}
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
          {statsChips.map((chip) => (
            <StatChip key={chip.label} icon={chip.icon} value={chip.value} label={chip.label} />
          ))}
        </div>

        {/* Cycle distribution */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide">
              {isFr ? "Programmes par cycle" : "Programs by cycle"}
            </p>
            <span className="text-xs text-surface-400">
              {cycleTotal} {isFr ? "programme(s)" : "program(s)"}
            </span>
          </div>
          <div className="space-y-2.5">
            {["LICENCE", "MASTER", "DOCTORATE"].map((cycle) => {
              const count = cycleCounts[cycle] || 0;
              const pct = cycleTotal > 0 ? Math.round((count / cycleTotal) * 100) : 0;
              return (
                <div key={cycle} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[12px] font-semibold text-surface-600 dark:text-surface-300">
                    {CYCLE_LABELS[cycle][isFr ? "fr" : "en"]}
                  </span>
                  <div className="flex-1 h-2.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${CYCLE_BAR[cycle]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[12px] font-bold text-surface-700 dark:text-surface-200">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Programs ── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-md overflow-hidden mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
              <FiAward className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-surface-800 dark:text-surface-100">
                {isFr ? "Programmes LMD" : "LMD Programs"}
              </h2>
              <p className="text-xs text-surface-400">
                {isFr
                  ? `${pagination.total} programme(s) dans cette faculté`
                  : `${pagination.total} program(s) in this faculty`}
              </p>
            </div>
          </div>
          <div className="sm:w-48">
            <Select
              options={cycleOptions}
              value={cycleFilter}
              onChange={(e) => handleCycleChange(e.target.value)}
            />
          </div>
        </div>

        {programsLoading ? (
          <div className="flex justify-center py-14">
            <div className="w-8 h-8 rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-[64px] h-[64px] rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-3">
              <FiAward className="w-7 h-7 text-surface-400" />
            </div>
            <p className="text-sm font-semibold text-surface-500">
              {cycleFilter
                ? (isFr ? "Aucun programme pour ce cycle" : "No programs for this cycle")
                : (isFr ? "Aucun programme enregistré" : "No programs yet")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
                  <th className="px-5 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Nom</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Cycle</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Département</th>
                  <th className="px-5 py-3 text-center text-[11px] font-bold tracking-wider uppercase text-surface-400">Durée</th>
                  <th className="px-5 py-3 text-center text-[11px] font-bold tracking-wider uppercase text-surface-400">Crédits</th>
                  <th className="px-5 py-3 text-center text-[11px] font-bold tracking-wider uppercase text-surface-400">Langue</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program) => (
                  <tr
                    key={program.id}
                    className="border-t border-surface-50 dark:border-surface-700/50 hover:bg-surface-50/50 dark:hover:bg-surface-700/20 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="text-[14px] font-semibold text-surface-800 dark:text-surface-100">
                        {program.name}
                      </p>
                      <span className="inline-flex mt-1 px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-[11px] font-bold text-primary-700 dark:text-primary-300">
                        {program.code}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${CYCLE_BADGE[program.cycle] || ""}`}>
                        {CYCLE_LABELS[program.cycle]?.[isFr ? "fr" : "en"] || program.cycle}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[13px] text-surface-600 dark:text-surface-300">
                        {program.departmentName || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-[13px] font-bold text-surface-700 dark:text-surface-200">
                        {program.durationYears} {isFr ? "ans" : "yrs"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-[13px] text-surface-700 dark:text-surface-200">
                        {program.creditsTotal ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-[13px] text-surface-600 dark:text-surface-300">
                        {LANGUAGE_LABELS[program.language] || program.language || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Programs pagination */}
        {!programsLoading && pagination.total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-surface-100 dark:border-surface-700">
            <p className="text-xs text-surface-400">
              {isFr ? `Page ${page} sur ${totalPages}` : `Page ${page} of ${totalPages}`}
              {" · "}
              {pagination.total} {isFr ? "résultat(s)" : "result(s)"}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => changePage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-600 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-default transition-colors"
              >
                <FiChevronLeft className="w-4 h-4 text-surface-500" />
              </button>
              <button
                onClick={() => changePage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-600 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-default transition-colors"
              >
                <FiChevronRight className="w-4 h-4 text-surface-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Departments ── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-md overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
          <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
            <FiUsers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-surface-800 dark:text-surface-100">
              {isFr ? "Départements" : "Departments"}
            </h2>
            <p className="text-xs text-surface-400">
              {isFr
                ? `${departments.length} département(s) rattaché(s)`
                : `${departments.length} department(s) attached`}
            </p>
          </div>
        </div>

        {departments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-[64px] h-[64px] rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-3">
              <FiUsers className="w-7 h-7 text-surface-400" />
            </div>
            <p className="text-sm font-semibold text-surface-500">
              {isFr ? "Aucun département rattaché" : "No departments yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
                  <th className="px-5 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Nom</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Code</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Chef</th>
                  <th className="px-5 py-3 text-center text-[11px] font-bold tracking-wider uppercase text-surface-400">Programmes</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr
                    key={department.id}
                    className="border-t border-surface-50 dark:border-surface-700/50 hover:bg-surface-50/50 dark:hover:bg-surface-700/20 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="text-[14px] font-semibold text-surface-800 dark:text-surface-100">
                        {department.name}
                      </p>
                      {department.nameFr && (
                        <p className="text-xs text-surface-400 mt-0.5">{department.nameFr}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-700 text-[11px] font-bold text-surface-600 dark:text-surface-300">
                        {department.code}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[13px] text-surface-600 dark:text-surface-300">
                        {department.headName || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-[13px] font-bold text-surface-700 dark:text-surface-200">
                        {department.programsCount ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
