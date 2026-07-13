import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTheme } from "../../../core/hooks/useTheme";
import {
  getClassById,
  getClassSubjects,
  deleteClass,
} from "../../../core/api/classService";
import {
  FiEdit2,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiTrash2,
  FiLoader,
  FiUsers,
  FiUserCheck,
  FiBook,
  FiUser,
  FiHome,
  FiXCircle,
  FiHelpCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";

function hexToRgba(hex, alpha = 1) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) {
    return `rgba(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}, ${alpha})`;
  }
  return `rgba(8, 80, 65, ${alpha})`;
}

function getLevelColor(name) {
  const colorMap = {
    "Form 1": "#6366F1",
    "Form 2": "#0EA5E9",
    "Form 3": "#14B8A6",
    "Form 4": "#F59E0B",
    "Form 5": "#EF4444",
    "Lower 6th": "#A855F7",
    "Upper 6th": "#085041",
  };
  for (const [key, color] of Object.entries(colorMap)) {
    if (name?.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#085041";
}

// ── Stat chip ──
function StatChip({ icon, value, label, animationDelay = "0s" }) {
  return (
    <div
      className="bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700 rounded-lg p-3 hover:-translate-y-0.5 hover:shadow-sm transition-all"
      style={{ animationDelay }}
    >
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xl font-extrabold text-surface-900 dark:text-surface-100 leading-tight mb-0.5">
        {value}
      </div>
      <div className="text-[11px] text-surface-400 font-medium">{label}</div>
    </div>
  );
}

// ── Empty State ──
function EmptyTab({ icon, title, subtitle, action }) {
  return (
    <div className="text-center py-14">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-100 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-surface-400 max-w-sm mx-auto mb-5">{subtitle}</p>
      {action}
    </div>
  );
}

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const isFr = lang === "fr";
  const pc = primaryColor || "#085041";

  const [cls, setCls] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("students");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    loadClass();
  }, [id]);

  const loadClass = async () => {
    setLoading(true);
    setError(null);
    try {
      const [classData, subjectsData] = await Promise.all([
        getClassById(id),
        getClassSubjects(id).catch(() => []),
      ]);
      setCls(classData);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : subjectsData?.subjects || []);
    } catch (err) {
      setError(err.response?.status === 404 ? "NOT_FOUND" : "ERROR");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(isFr ? "Supprimer cette classe ?" : "Delete this class?")) return;
    try {
      await deleteClass(id);
      toast.success(isFr ? "Classe supprimée" : "Class deleted");
      navigate("/dashboard/classes");
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Erreur" : "Error"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="w-8 h-8 animate-spin" style={{ color: pc }} />
      </div>
    );
  }

  if (error === "NOT_FOUND") {
    return (
      <div className="text-center py-20">
        <FiHelpCircle className="w-12 h-12 mx-auto mb-3 text-surface-300" />
        <h3 className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-2">
          {isFr ? "Classe introuvable" : "Class not found"}
        </h3>
        <Link
          to="/dashboard/classes"
          className="text-sm font-semibold hover:underline"
          style={{ color: pc }}
        >
          ← {isFr ? "Retour aux classes" : "Back to classes"}
        </Link>
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="text-center py-20">
        <FiXCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <h3 className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-2">
          {isFr ? "Erreur de chargement" : "Error loading class"}
        </h3>
        <button
          onClick={loadClass}
          className="text-sm font-semibold hover:underline"
          style={{ color: pc }}
        >
          {isFr ? "Réessayer" : "Retry"}
        </button>
      </div>
    );
  }

  const lvlColor = getLevelColor(cls.name);
  const enrolled = cls.studentCount || 0;
  const capacity = cls.capacity || 40;
  const pct = capacity > 0 ? Math.min(Math.round((enrolled / capacity) * 100), 100) : 0;
  const isFull = pct >= 90;
  const sectionInitial = (cls.name?.match(/[A-Z]/g) || ["A"]).slice(-1)[0];

  const tabs = [
    { key: "students", icon: <FiUserCheck className="w-4 h-4" />, label: isFr ? "Élèves" : "Students", count: enrolled },
    { key: "subjects", icon: <FiBook className="w-4 h-4" />, label: isFr ? "Matières" : "Subjects", count: subjects.length },
    { key: "teachers", icon: <FiUser className="w-4 h-4" />, label: isFr ? "Enseignants" : "Teachers" },
  ];

  // Note: enrolled students list must be fetched separately via the enrollment endpoint
  const filteredStudents = cls.students || [];

  return (
    <div className="max-w-[960px] mx-auto pb-12">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-5 animate-fadeIn">
        <Link to="/dashboard/classes" className="hover:text-primary-600 transition-colors">
          {isFr ? "Classes" : "Classes"}
        </Link>
        <span>/</span>
        <span className="text-surface-800 dark:text-surface-100 font-medium">{cls.name}</span>
      </nav>

      {/* ── Hero Card ── */}
      <div
        className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 shadow-md mb-6 animate-fadeIn"
        style={{ animationDelay: "0.05s" }}
      >
        {/* Hero top */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div
              className="w-[60px] h-[60px] rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{
                background: hexToRgba(lvlColor, 0.08),
                border: `1.5px solid ${hexToRgba(lvlColor, 0.2)}`,
                color: lvlColor,
              }}
            >
              {sectionInitial}
            </div>
            <div>
              <h1
                className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-1"
              >
                {cls.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-surface-400">
                  {cls.level || isFr ? "Niveau standard" : "Standard level"}
                </span>
                <span className="text-surface-200">·</span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: hexToRgba(pc, 0.06),
                    color: pc,
                  }}
                >
                  {cls.academicYearName || t("class.academicYearNotSet", "N/A")}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/dashboard/classes/${id}/edit`)}
              className="h-9 px-3.5 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-xs font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
              {isFr ? "Modifier" : "Edit"}
            </button>
            <button
              onClick={handleDelete}
              className="h-9 px-3.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              {isFr ? "Supprimer" : "Delete"}
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatChip icon={<FiUsers className="w-5 h-5" />} value={enrolled} label={isFr ? "Élèves" : "Students"} />
          <StatChip icon={<FiHome className="w-5 h-5" />} value={capacity} label={isFr ? "Capacité" : "Capacity"} />
          <StatChip icon={<FiBook className="w-5 h-5" />} value={subjects.length} label={isFr ? "Matières" : "Subjects"} />
          <StatChip
            icon={<FiUser className="w-5 h-5" />}
            value={cls.classTeacherId ? 1 : 0}
            label={isFr ? "Enseignants" : "Teachers"}
          />
        </div>

        {/* Capacity bar */}
        <div>
          <div className="flex justify-between text-xs text-surface-400 mb-1.5">
            <span>{isFr ? "Progression des inscriptions" : "Enrollment progress"}</span>
            <span className="font-semibold" style={{ color: isFull ? "#EF4444" : pc }}>
              {pct}%
            </span>
          </div>
          <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background: isFull
                  ? "linear-gradient(90deg, #EF4444, #F87171)"
                  : `linear-gradient(90deg, ${pc}, ${hexToRgba(pc, 0.5)})`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs Container ── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-md overflow-hidden animate-fadeIn">
        {/* Tab navigation */}
        <div className="flex border-b border-surface-200 dark:border-surface-700 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-primary-600 text-primary-700 dark:text-primary-400 font-bold"
                  : "border-transparent text-surface-400 hover:text-surface-600"
              }`}
              style={activeTab === tab.key ? { borderColor: pc, color: pc } : undefined}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: activeTab === tab.key ? hexToRgba(pc, 0.08) : "#EEF0EC",
                    color: activeTab === tab.key ? pc : "#9BA59C",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {/* ── Students Tab ── */}
          {activeTab === "students" && (
            <div>
              {filteredStudents.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 max-w-xs flex items-center gap-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-600 rounded-lg px-3 h-10">
                    <FiSearch className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder={isFr ? "Rechercher un élève..." : "Search student..."}
                      className="flex-1 border-none outline-none text-xs bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-400"
                    />
                  </div>
                </div>
              )}

              {filteredStudents.length === 0 ? (
                <EmptyTab
                  icon={<FiUsers className="w-8 h-8" />}
                  title={isFr ? "Aucun élève inscrit" : "No students enrolled"}
                  subtitle={
                    isFr
                      ? "Ajoutez des élèves à cette classe pour commencer."
                      : "Add students to this class to get started."
                  }
                  action={
                    <button
                      className="h-10 px-5 text-white text-xs font-semibold rounded-lg transition-all hover:shadow-md"
                      style={{ backgroundColor: pc }}
                    >
                      <FiPlus className="w-3.5 h-3.5 inline mr-1.5" />
                      {isFr ? "Ajouter un élève" : "Add student"}
                    </button>
                  }
                />
              ) : (
                <div className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-50 dark:bg-surface-900">
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-100 dark:border-surface-700">
                          {isFr ? "Élève" : "Student"}
                        </th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-100 dark:border-surface-700">
                          {isFr ? "Matricule" : "Matricule"}
                        </th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-100 dark:border-surface-700">
                          {isFr ? "Statut" : "Status"}
                        </th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-100 dark:border-surface-700">
                          {isFr ? "Frais" : "Fees"}
                        </th>
                        <th className="text-right py-2.5 px-4 border-b border-surface-100 dark:border-surface-700"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => {
                        const initials = ((s.firstName?.[0] || "") + (s.lastName?.[0] || "")).toUpperCase();
                        return (
                          <tr key={s.id} className="border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors">
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                  style={{
                                    background: hexToRgba(pc, 0.08),
                                    border: `1.5px solid ${hexToRgba(pc, 0.15)}`,
                                    color: pc,
                                  }}
                                >
                                  {initials}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-surface-800 dark:text-surface-100">
                                    {s.firstName} {s.lastName}
                                  </div>
                                  <div className="text-[10px] text-surface-400">{s.gender || ""}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-xs text-surface-500 font-mono">
                              {s.studentNumber || "—"}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  s.status === "active"
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                                    : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                                }`}
                              >
                                {s.status || "active"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  s.feeStatus === "paid"
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                    : s.feeStatus === "partial"
                                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                                      : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                }`}
                              >
                                {s.feeStatus || "unpaid"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <Link
                                to={`/dashboard/students/${s.id}`}
                                className="text-xs font-semibold hover:underline"
                                style={{ color: pc }}
                              >
                                {isFr ? "Voir" : "View"} →
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Subjects Tab ── */}
          {activeTab === "subjects" && (
            <div>
              {subjects.length === 0 ? (
                <EmptyTab
                  icon={<FiBook className="w-8 h-8" />}
                  title={isFr ? "Aucune matière" : "No subjects yet"}
                  subtitle={
                    isFr
                      ? "Ajoutez des matières avec coefficients pour définir le programme."
                      : "Add subjects with coefficients to define the curriculum."
                  }
                />
              ) : (
                <div className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-50 dark:bg-surface-900">
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-100 dark:border-surface-700">
                          {isFr ? "Matière" : "Subject"}
                        </th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-100 dark:border-surface-700">
                          {isFr ? "Code" : "Code"}
                        </th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-100 dark:border-surface-700">
                          Coefficient
                        </th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-100 dark:border-surface-700">
                          {isFr ? "Enseignant" : "Teacher"}
                        </th>
                        <th className="text-right py-2.5 px-4 border-b border-surface-100 dark:border-surface-700"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((s) => (
                        <tr key={s.id || s.subject_id} className="border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors">
                          <td className="py-2.5 px-4 text-xs font-semibold text-surface-800 dark:text-surface-100">
                            {s.name || s.subject_name}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-surface-400 font-mono">
                            {s.code || "—"}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="text-xs font-bold" style={{ color: pc }}>
                              ×{s.coefficient || 1}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-surface-500">
                            {s.teacherName || s.teacher_name || (s.teacher
                              ? `${s.teacher.firstName} ${s.teacher.lastName}`
                              : "—")}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              className="text-[10px] font-semibold hover:underline"
                              style={{ color: pc }}
                            >
                              {isFr ? "Modifier" : "Edit"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Teachers Tab ── */}
          {activeTab === "teachers" && (
            <div>
              {!cls.classTeacherId ? (
                <EmptyTab
                  icon={<FiUser className="w-8 h-8" />}
                  title={isFr ? "Aucun enseignant assigné" : "No teacher assigned"}
                  subtitle={
                    isFr
                      ? "Assignez un professeur principal pour gérer cette classe."
                      : "Assign a class teacher to manage this class."
                  }
                />
              ) : (
                <div className="flex flex-col gap-3">
                  <div
                    className="flex items-center gap-3.5 p-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:shadow-sm transition-shadow"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background: hexToRgba(pc, 0.08),
                        border: `1.5px solid ${hexToRgba(pc, 0.2)}`,
                        color: pc,
                      }}
                    >
                      {cls.teacherName
                        ? cls.teacherName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                        : "—"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                        {cls.teacherName || (isFr ? "Professeur principal" : "Class teacher")}
                      </div>
                      <div className="text-xs text-surface-400">
                        {cls.teacherEmail || ""}
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-1 rounded-full"
                      style={{
                        background: hexToRgba(pc, 0.08),
                        color: pc,
                        border: `1px solid ${hexToRgba(pc, 0.2)}`,
                      }}
                    >
                      {isFr ? "Professeur principal" : "Class teacher"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
