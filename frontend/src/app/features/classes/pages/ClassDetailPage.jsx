import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../core/hooks/useTheme";
import {
  FiEdit2,
  FiPlus,
  FiChevronLeft,
  FiSave,
  FiX,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiBook,
  FiUser,
  FiHome,
  FiLoader,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getClassById, updateClass, deleteClass } from "../../../core/api/classService";
import { getStudents } from "../../../core/api/studentService";
import { getUsers } from "../../../core/api/userManagementService";
import { getSubjectTeacherAssignments } from "../../../core/api/subjectService";

// ── Static levels & series (will move to backend later) ──
const EDUCATION_LEVELS = [
  { id: 1, name: "Form 1" }, { id: 2, name: "Form 2" },
  { id: 3, name: "Form 3" }, { id: 4, name: "Form 4" },
  { id: 5, name: "Form 5" }, { id: 6, name: "Lower 6th" },
  { id: 7, name: "Upper 6th" },
  { id: 8, name: "6ème" }, { id: 9, name: "5ème" },
  { id: 10, name: "4ème" }, { id: 11, name: "3ème" },
  { id: 12, name: "Seconde" }, { id: 13, name: "Première" },
  { id: 14, name: "Terminale" },
];

const EDUCATION_SERIES = [
  { id: 1, name: "General" }, { id: 2, name: "Science" },
  { id: 3, name: "Arts" }, { id: 4, name: "Commercial" },
  { id: 5, name: "A4" }, { id: 6, name: "B" },
  { id: 7, name: "C" }, { id: 8, name: "D" },
  { id: 9, name: "E" }, { id: 10, name: "F1" },
  { id: 11, name: "F2" }, { id: 12, name: "G" },
];

function hexToRgba(hex, alpha = 1) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) {
    return `rgba(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}, ${alpha})`;
  }
  return `rgba(8, 80, 65, ${alpha})`;
}

function getLevelColor(name) {
  const colorMap = {
    "Form 1": "#6366F1", "Form 2": "#0EA5E9", "Form 3": "#14B8A6",
    "Form 4": "#F59E0B", "Form 5": "#EF4444",
    "Lower 6th": "#A855F7", "Upper 6th": "#085041",
    "6ème": "#6366F1", "5ème": "#0EA5E9", "4ème": "#14B8A6",
    "3ème": "#F59E0B", "Seconde": "#A855F7", "Première": "#EF4444",
    "Terminale": "#085041",
  };
  for (const [key, color] of Object.entries(colorMap)) {
    if (name?.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#085041";
}

// ── Stat chip ──
function StatChip({ icon, value, label }) {
  return (
    <div className="bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700 rounded-xl p-3.5">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xl font-extrabold text-surface-900 dark:text-surface-100 leading-tight mb-0.5">{value}</div>
      <div className="text-[11px] text-surface-400 font-medium">{label}</div>
    </div>
  );
}

// ── Empty tab state ──
function EmptyTab({ icon, title, subtitle, action }) {
  return (
    <div className="text-center py-14">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-100 mb-1.5">{title}</h3>
      <p className="text-sm text-surface-400 max-w-sm mx-auto mb-5">{subtitle}</p>
      {action}
    </div>
  );
}

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("common");
  const { primaryColor } = useTheme();
  const isFr = i18n.language === "fr";
  const pc = primaryColor || "#085041";

  const [cls, setCls] = useState(null);
  const [levels, setLevels] = useState([]);
  const [series, setSeries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [studentSearch, setStudentSearch] = useState("");

  // ── Edit form state ──
  const [editForm, setEditForm] = useState({ name: "", levelId: "", seriesId: "", capacity: 40, classTeacherId: "" });
  const [isEditing, setIsEditing] = useState(false);

  // ── Load data from real API ──
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [classData, studentsData, teachersData, assignmentsData] = await Promise.all([
          getClassById(id),
          getStudents(),
          getUsers({ role: "TEACHER" }),
          getSubjectTeacherAssignments(),
        ]);

        if (!classData) { setError("NOT_FOUND"); setLoading(false); return; }

        setCls(classData);
        setLevels(EDUCATION_LEVELS);
        setSeries(EDUCATION_SERIES);

        // Handle students — might be array or { students: [...] }
        let allStudents = Array.isArray(studentsData) ? studentsData : (studentsData?.students || []);
        // Filter students by classId OR className (fallback)
        const classStudents = allStudents.filter((s) =>
          s.classId === classData.id ||
          s.classId === id ||
          (s.className && classData.name && s.className === classData.name)
        );
        setStudents(classStudents);

        // Handle teachers — might be array or { users: [...] }
        let allTeachers = Array.isArray(teachersData) ? teachersData : (teachersData?.users || []);
        setTeachers(allTeachers);

        // Handle assignments — might be array or { data: [...] }
        let allAssignments = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData?.data || []);
        // Filter assignments for this class
        const classAssignments = allAssignments.filter((a) => a.classId === classData.id || a.classId === id);
        const assignedTeacherIds = classAssignments.map((a) => a.teacherId);
        const classTeachers = allTeachers.filter((t) => assignedTeacherIds.includes(t.id));

        // Set classTeacherId from first assignment or from class data
        const classTeacher = classTeachers[0] || null;
        setCls((prev) => ({
          ...prev,
          classTeacherId: prev.classTeacherId || classTeacher?.id || null,
          assignedTeachers: classTeachers,
          students: classStudents,
        }));

        setEditForm({
          name: classData.name || "",
          levelId: classData.levelId?.toString() || "",
          seriesId: classData.seriesId?.toString() || "",
          capacity: classData.capacity || 40,
          classTeacherId: classData.classTeacherId?.toString() || classTeacher?.id?.toString() || "",
        });
      } catch (err) {
        console.error("Error:", err);
        setError("ERROR");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // ── Save edit ──
  const handleSave = async () => {
    if (!editForm.name.trim()) {
      toast.error(isFr ? "Le nom est requis" : "Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        levelId: editForm.levelId ? Number(editForm.levelId) : null,
        seriesId: editForm.seriesId ? Number(editForm.seriesId) : null,
        capacity: editForm.capacity,
        classTeacherId: editForm.classTeacherId || null,
      };
      const updated = await updateClass(id, payload);
      setCls((prev) => ({ ...prev, ...updated }));
      setIsEditing(false);
      toast.success(isFr ? "Modifications enregistrées" : "Changes saved");
    } catch (err) {
      toast.error(isFr ? "Erreur" : "Error saving");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete class ──
  const handleDelete = async () => {
    if (!window.confirm(isFr ? "Supprimer cette classe ? Cette action est irréversible." : "Delete this class? This action cannot be undone.")) return;
    try {
      await deleteClass(id);
      toast.success(isFr ? "Classe supprimée" : "Class deleted");
      navigate("/dashboard/classes");
    } catch {
      toast.error(isFr ? "Erreur" : "Error");
    }
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
  if (error === "NOT_FOUND" || !cls) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">😕</div>
        <h3 className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-2">
          {isFr ? "Classe introuvable" : "Class not found"}
        </h3>
        <Link to="/dashboard/classes" className="text-sm font-semibold hover:underline" style={{ color: pc }}>
          ← {isFr ? "Retour aux classes" : "Back to classes"}
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-2">
          {isFr ? "Erreur de chargement" : "Error loading class"}
        </h3>
        <button onClick={() => window.location.reload()} className="text-sm font-semibold hover:underline" style={{ color: pc }}>
          {isFr ? "Réessayer" : "Retry"}
        </button>
      </div>
    );
  }

  const lvlColor = getLevelColor(cls.name);
  const enrolled = students.length;
  const capacity = cls.capacity || 40;
  const pct = capacity > 0 ? Math.min(Math.round((enrolled / capacity) * 100), 100) : 0;
  const isFull = pct >= 90;
  const sectionInitial = (cls.name?.match(/[A-Z]/g) || [cls.name?.[0] || "A"]).slice(-1)[0];

  const selectedLevel = levels.find((l) => l.id === Number(editForm.levelId));
  const selectedSeries = series.find((s) => s.id === Number(editForm.seriesId));
  const assignedTeachers = cls.assignedTeachers || [];

  const tabs = [
    { key: "general", icon: <FiEdit2 className="w-4 h-4" />, label: isFr ? "Général" : "General" },
    { key: "teachers", icon: <FiUsers className="w-4 h-4" />, label: isFr ? "Enseignants" : "Teachers", count: assignedTeachers.length },
    { key: "students", icon: <FiUser className="w-4 h-4" />, label: isFr ? "Élèves" : "Students", count: enrolled },
  ];

  const filteredStudents = studentSearch.trim()
    ? students.filter((s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.studentNumber || "").toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students;

  const inputClass = "w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-all";
  const labelClass = "block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1.5";

  return (
    <div className="max-w-[960px] mx-auto pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-5">
        <Link to="/dashboard/classes" className="hover:text-primary-600 transition-colors">
          {isFr ? "Classes" : "Classes"}
        </Link>
        <span>/</span>
        <span className="text-surface-800 dark:text-surface-100 font-medium">{cls.name}</span>
      </nav>

      {/* ── Hero Card ── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-6 sm:p-7 border border-surface-200 dark:border-surface-700 shadow-md mb-6">
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
              <h1 className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-1">
                {cls.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-surface-400">
                  {selectedLevel?.name || (isFr ? "Niveau standard" : "Standard level")}
                </span>
                {selectedSeries && (
                  <>
                    <span className="text-surface-300 dark:text-surface-600">·</span>
                    <span className="text-xs text-surface-400">{selectedSeries.name}</span>
                  </>
                )}
                <span className="text-surface-300 dark:text-surface-600">·</span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: hexToRgba(pc, 0.06), color: pc }}
                >
                  {cls.capacity || "—"} {isFr ? "places" : "seats"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="h-9 px-3.5 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-xs font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
                {isFr ? "Modifier" : "Edit"}
              </button>
            ) : null}
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
          <StatChip icon={<FiBook className="w-5 h-5" />} value={assignedTeachers.length} label={isFr ? "Enseignants" : "Teachers"} />
          <StatChip icon={<FiUser className="w-5 h-5" />} value={cls.classTeacherId ? 1 : 0} label={isFr ? "Titulaire" : "Class teacher"} />
        </div>

        {/* Capacity bar */}
        <div>
          <div className="flex justify-between text-xs text-surface-400 mb-1.5">
            <span>{isFr ? "Progression des inscriptions" : "Enrollment progress"}</span>
            <span className="font-semibold" style={{ color: isFull ? "#EF4444" : pc }}>
              {pct}% {isFr ? "plein" : "full"}
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
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-md overflow-hidden">
        {/* Tab navigation */}
        <div className="flex border-b border-surface-200 dark:border-surface-700 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-primary-600 text-primary-700 dark:text-primary-400 font-bold"
                  : "border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              }`}
              style={activeTab === tab.key ? { borderColor: pc, color: pc } : undefined}
            >
              {tab.icon}
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
          {/* ═══════ GENERAL TAB ═══════ */}
          {activeTab === "general" && (
            <div>
              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>{isFr ? "Nom de la classe" : "Class name"}</label>
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{cls.name}</p>
                  </div>
                  <div>
                    <label className={labelClass}>{isFr ? "Niveau" : "Level"}</label>
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                      {selectedLevel?.name || (isFr ? "Aucun" : "None")}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>{isFr ? "Série / Filière" : "Series / Stream"}</label>
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                      {selectedSeries?.name || (isFr ? "Aucune" : "None")}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>{isFr ? "Capacité" : "Capacity"}</label>
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{cls.capacity || 40} {isFr ? "places" : "seats"}</p>
                  </div>
                  <div>
                    <label className={labelClass}>{isFr ? "Professeur titulaire" : "Class teacher"}</label>
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                      {assignedTeachers.find((t) => t.id === cls.classTeacherId)
                        ? `${assignedTeachers.find((t) => t.id === cls.classTeacherId).firstName} ${assignedTeachers.find((t) => t.id === cls.classTeacherId).lastName}`
                        : assignedTeachers[0]
                          ? `${assignedTeachers[0].firstName} ${assignedTeachers[0].lastName}`
                          : isFr ? "Non assigné" : "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>{isFr ? "Élèves inscrits" : "Enrolled students"}</label>
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{enrolled} / {capacity}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{isFr ? "Nom" : "Name"} <span className="text-primary-600">*</span></label>
                      <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>{isFr ? "Capacité" : "Capacity"}</label>
                      <input type="number" value={editForm.capacity} onChange={(e) => setEditForm((f) => ({ ...f, capacity: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) }))} min={1} max={100} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{isFr ? "Niveau" : "Level"}</label>
                      <select value={editForm.levelId} onChange={(e) => setEditForm((f) => ({ ...f, levelId: e.target.value }))} className={inputClass}>
                        <option value="">{isFr ? "Aucun" : "None"}</option>
                        {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>{isFr ? "Série" : "Series"}</label>
                      <select value={editForm.seriesId} onChange={(e) => setEditForm((f) => ({ ...f, seriesId: e.target.value }))} className={inputClass}>
                        <option value="">{isFr ? "Aucune" : "None"}</option>
                        {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Class Teacher */}
                  <div>
                    <label className={labelClass}>
                      {isFr ? "Professeur titulaire" : "Class teacher"}
                      <span className="text-surface-300 font-normal ml-1">({isFr ? "optionnel" : "optional"})</span>
                    </label>
                    <select
                      value={editForm.classTeacherId}
                      onChange={(e) => setEditForm((f) => ({ ...f, classTeacherId: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="">
                        {isFr ? "Aucun professeur titulaire" : "No class teacher"}
                      </option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName}
                          {t.email ? ` — ${t.email}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setIsEditing(false); setEditForm({ name: cls.name, levelId: cls.levelId?.toString() || "", seriesId: cls.seriesId?.toString() || "", capacity: cls.capacity || 40, classTeacherId: cls.classTeacherId?.toString() || "" }); }}
                      className="h-10 px-4 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5">
                      <FiX className="w-3.5 h-3.5" /> {isFr ? "Annuler" : "Cancel"}
                    </button>
                    <button onClick={handleSave} disabled={submitting}
                      className="h-10 px-5 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-all disabled:opacity-60"
                      style={{ backgroundColor: pc }}>
                      {submitting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-3.5 h-3.5" />}
                      {isFr ? "Enregistrer" : "Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════ TEACHERS TAB ═══════ */}
          {activeTab === "teachers" && (
            <div>
              {assignedTeachers.length === 0 ? (
                <EmptyTab
                  icon={<FiUsers className="w-8 h-8" />}
                  title={isFr ? "Aucun enseignant assigné" : "No teachers assigned"}
                  subtitle={isFr ? "Assignez des enseignants à cette classe." : "Assign teachers to this class."}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {assignedTeachers.map((t, idx) => {
                    const initials = ((t.firstName?.[0] || "") + (t.lastName?.[0] || "")).toUpperCase();
                    const isMain = t.id === cls.classTeacherId || idx === 0;
                    return (
                      <div key={t.id}
                        className="flex items-center gap-3.5 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:shadow-sm transition-shadow"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: hexToRgba(pc, 0.08), border: `1.5px solid ${hexToRgba(pc, 0.2)}`, color: pc }}>
                          {initials}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                            {t.firstName} {t.lastName}
                          </div>
                          <div className="text-xs text-surface-400">{t.email} · {t.specialty || ""}</div>
                        </div>
                        {isMain && (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: hexToRgba(pc, 0.08), color: pc, border: `1px solid ${hexToRgba(pc, 0.2)}` }}>
                            {isFr ? "Titulaire" : "Class teacher"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════ STUDENTS TAB ═══════ */}
          {activeTab === "students" && (
            <div>
              {students.length > 0 && (
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

              {students.length === 0 ? (
                <EmptyTab
                  icon={<FiUser className="w-8 h-8" />}
                  title={isFr ? "Aucun élève inscrit" : "No students enrolled"}
                  subtitle={isFr ? "Ajoutez des élèves à cette classe." : "Add students to this class."}
                  action={
                    <button className="h-10 px-5 text-white text-xs font-semibold rounded-lg transition-all hover:shadow-md" style={{ backgroundColor: pc }}>
                      <FiPlus className="w-3.5 h-3.5 inline mr-1.5" />
                      {isFr ? "Ajouter un élève" : "Add student"}
                    </button>
                  }
                />
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-surface-400">
                    {isFr ? `Aucun résultat pour "${studentSearch}"` : `No results for "${studentSearch}"`}
                  </p>
                </div>
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
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                  style={{ background: hexToRgba(pc, 0.08), border: `1.5px solid ${hexToRgba(pc, 0.15)}`, color: pc }}>
                                  {initials}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-surface-800 dark:text-surface-100">{s.firstName} {s.lastName}</div>
                                  <div className="text-[10px] text-surface-400">{s.gender === "M" ? (isFr ? "Masculin" : "Male") : s.gender === "F" ? (isFr ? "Féminin" : "Female") : ""}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-xs text-surface-500 font-mono">{s.studentNumber || "—"}</td>
                            <td className="py-2.5 px-4">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                s.status === "active"
                                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                                  : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                              }`}>
                                {s.status === "active" ? (isFr ? "Actif" : "Active") : (isFr ? "Inactif" : "Inactive")}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                s.feeStatus === "paid"
                                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                  : s.feeStatus === "partial"
                                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                                    : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                              }`}>
                                {s.feeStatus === "paid" ? (isFr ? "Payé" : "Paid") : s.feeStatus === "partial" ? (isFr ? "Partiel" : "Partial") : (isFr ? "Impayé" : "Unpaid")}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="text-xs font-semibold hover:underline cursor-pointer" style={{ color: pc }}
                                onClick={() => navigate(`/dashboard/users?student=${s.id}`)}>
                                {isFr ? "Voir" : "View"} →
                              </span>
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
        </div>
      </div>
    </div>
  );
}
