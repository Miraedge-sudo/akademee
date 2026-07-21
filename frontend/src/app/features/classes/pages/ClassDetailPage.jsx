import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../core/hooks/useTheme";
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiPlus,
  FiSave,
  FiX,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiBook,
  FiUser,
  FiHome,
  FiLoader,
  FiAlertCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getClassById, updateClass, deleteClass } from "../../../core/api/classService";
import { getStudents } from "../../../core/api/studentService";
import {
  getClassTeachers,
  assignClassTeacher,
  removeClassTeacher,
  getAvailableTeachers,
  getSubjects,
  assignTeacherToSubject,
  removeTeacherAssignment,
  getTeacherSubjects,
} from "../../../core/api/subjectService";
import { getClassSubjectsByClass, removeSubjectFromClass, bulkAssignSubjects } from "../../../core/api/classSubjectService";
import levelService from "../../../core/api/levelService";
import seriesService from "../../../core/api/seriesService";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

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
  const [assignModal, setAssignModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classTeacherAssignments, setClassTeacherAssignments] = useState([]);

  // ── Class-subject assignment state (Subjects tab) ──
  const [classSubjectAssignments, setClassSubjectAssignments] = useState([]);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [selectedSubjectsForAdd, setSelectedSubjectsForAdd] = useState(new Set());
  const [subjectCoefficients, setSubjectCoefficients] = useState({});
  const [savingClassSubjects, setSavingClassSubjects] = useState(false);
  const [editCoeffAssignmentId, setEditCoeffAssignmentId] = useState(null);
  const [editCoeffValue, setEditCoeffValue] = useState(1);
  const [savingCoeff, setSavingCoeff] = useState(false);

  // ── Teacher subject assignment state ──
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [classSubjectsForTeacher, setClassSubjectsForTeacher] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(new Set());
  const [existingSubjectAssignments, setExistingSubjectAssignments] = useState([]);
  const [savingSubjects, setSavingSubjects] = useState(false);
  const [teacherSubjectsMap, setTeacherSubjectsMap] = useState({});

  // ── Confirm dialog states ──
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);
  const [removeSubjectConfirm, setRemoveSubjectConfirm] = useState({ open: false, assignmentId: null, subjectName: "" });
  const [removeTeacherConfirm, setRemoveTeacherConfirm] = useState({ open: false, teacherId: null, teacherName: "" });

  // ── Edit form state ──
  const [editForm, setEditForm] = useState({ name: "", levelId: "", seriesId: "", capacity: 40, classTeacherId: "" });
  const [isEditing, setIsEditing] = useState(false);

  // ── Load data from real API ──
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [classData, studentsData, teachersData, assignmentsData, subjectsData, classSubjectData] = await Promise.all([
          getClassById(id),
          getStudents(),
          getAvailableTeachers(),
          getClassTeachers(id),
          getSubjects().catch(() => []),
          getClassSubjectsByClass(id).catch(() => []),
        ]);

        if (!classData) { setError("NOT_FOUND"); setLoading(false); return; }

        setCls(classData);

        const [levelsData, seriesData] = await Promise.all([
          levelService.list().catch(() => []),
          seriesService.list().catch(() => []),
        ]);
        setLevels(levelsData);
        setSeries(seriesData);

        // Handle students — might be array or { students: [...] }
        let allStudents = Array.isArray(studentsData) ? studentsData : (studentsData?.students || []);
        // Filter students by classId OR className (fallback)
        const classStudents = allStudents.filter((s) =>
          s.classId === classData.id ||
          s.classId === id ||
          (s.className && classData.name && s.className === classData.name)
        );
        setStudents(classStudents);

        // Handle teachers — getAvailableTeachers returns an array directly
        const allTeachers = Array.isArray(teachersData) ? teachersData : (teachersData?.data || teachersData?.teachers || []);
        setTeachers(allTeachers);

        // Handle class-teacher assignments from the new API
        const allAssignments = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData?.data || []);
        setClassTeacherAssignments(allAssignments);
        const classTeachers = allAssignments.map((a) => ({
          id: a.teacherId,
          firstName: a.teacherFirstName,
          lastName: a.teacherLastName,
          email: a.teacherEmail,
          isMain: a.isMain,
        }));

        // Set classTeacherId from assignment marked as main, or first assignment
        const mainTeacher = classTeachers.find((t) => t.isMain) || classTeachers[0] || null;
        setCls((prev) => ({
          ...prev,
          classTeacherId: prev.classTeacherId || mainTeacher?.id || null,
          assignedTeachers: classTeachers,
          students: classStudents,
        }));

        // Handle subjects
        const subjectsList = Array.isArray(subjectsData) ? subjectsData : (subjectsData?.subjects || subjectsData?.data || []);
        setSubjects(subjectsList);

        // Handle class-subject assignments (Subjects tab)
        const classSubjData = Array.isArray(classSubjectData) ? classSubjectData : (classSubjectData?.data || classSubjectData?.assignments || []);
        setClassSubjectAssignments(classSubjData);

        // Load subject assignments for each assigned teacher
        if (classTeachers.length > 0) {
          try {
            const teacherSubjResults = await Promise.all(
              classTeachers.map((t) =>
                getTeacherSubjects(t.id)
                  .then((data) => ({
                    teacherId: t.id,
                    subjects: Array.isArray(data) ? data : (data?.data || []),
                  }))
                  .catch(() => ({ teacherId: t.id, subjects: [] }))
              )
            );
            const map = {};
            teacherSubjResults.forEach(({ teacherId, subjects }) => {
              // Only include subjects assigned to THIS class
              map[teacherId] = subjects.filter((s) => s.classId === id);
            });
            setTeacherSubjectsMap(map);
          } catch {
            // ignore
          }
        }

        setEditForm({
          name: classData.name || "",
          levelId: classData.levelId?.toString() || "",
          seriesId: classData.seriesId?.toString() || "",
          capacity: classData.capacity || 40,
          classTeacherId: classData.classTeacherId?.toString() || mainTeacher?.id?.toString() || "",
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
        levelId: editForm.levelId || null,
        seriesId: editForm.seriesId || null,
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

  // ── Open subject selection for a teacher ──
  const openSubjectSelection = async (teacher) => {
    setSelectedTeacher(teacher);
    setSavingSubjects(false);
    try {
      // Load subjects assigned to this class
      const [classSubjData, teacherSubjData] = await Promise.all([
        getClassSubjectsByClass(id),
        getTeacherSubjects(teacher.id).catch(() => []),
      ]);
      const classSubjects = Array.isArray(classSubjData) ? classSubjData : (classSubjData?.data || classSubjData?.assignments || []);
      const teacherSubjects = Array.isArray(teacherSubjData) ? teacherSubjData : (teacherSubjData?.data || []);

      setClassSubjectsForTeacher(classSubjects);
      setExistingSubjectAssignments(teacherSubjects);

      // Pre-select subjects this teacher already teaches in this class
      const taughtInClass = teacherSubjects
        .filter((a) => a.classId === id)
        .map((a) => a.subjectId);
      setSelectedSubjectIds(new Set(taughtInClass));
    } catch {
      setClassSubjectsForTeacher([]);
      setExistingSubjectAssignments([]);
      setSelectedSubjectIds(new Set());
    }
  };

  // ── Toggle a subject checkbox ──
  const toggleSubject = (subjectId) => {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  // ── Confirm subject assignments for teacher ──
  const handleConfirmSubjects = async () => {
    if (!selectedTeacher) return;
    setSavingSubjects(true);
    try {
      // 1. Assign teacher to class (if not already)
      const isAssigned = assignedTeachers.some((a) => a.id === selectedTeacher.id);
      if (!isAssigned) {
        await assignClassTeacher(id, { teacherId: selectedTeacher.id });
      }

      // 2. For each selected subject, assign teacher to subject
      const existingMap = {};
      existingSubjectAssignments
        .filter((a) => a.classId === id)
        .forEach((a) => { existingMap[a.subjectId] = a; });

      const promises = [];
      for (const subjectId of selectedSubjectIds) {
        if (!existingMap[subjectId]) {
          promises.push(
            assignTeacherToSubject({
              subjectId,
              teacherId: selectedTeacher.id,
              classId: id,
            })
          );
        }
      }
      // Remove unselected subjects that were previously assigned
      for (const [subjId, assignment] of Object.entries(existingMap)) {
        if (!selectedSubjectIds.has(subjId) && assignment.id) {
          promises.push(removeTeacherAssignment(assignment.id));
        }
      }

      await Promise.all(promises);
      toast.success(isFr ? "Matières assignées avec succès" : "Subjects assigned");
      setSelectedTeacher(null);
      window.location.reload();
    } catch (err) {
      const msg = err?.response?.data?.message || (isFr ? "Erreur" : "Error");
      toast.error(msg);
    } finally {
      setSavingSubjects(false);
    }
  };

  // ── Toggle subject selection in Add Subject modal ──
  const toggleSubjectForAdd = (subjectId) => {
    setSelectedSubjectsForAdd((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
    // Init default coefficient if not set
    setSubjectCoefficients((prev) => {
      if (prev[subjectId] === undefined) {
        return { ...prev, [subjectId]: 1 };
      }
      return prev;
    });
  };

  // ── Update coefficient for a subject in the add modal ──
  const handleCoefficientChange = (subjectId, value) => {
    const coeff = Math.max(1, Math.min(20, parseInt(value) || 1));
    setSubjectCoefficients((prev) => ({ ...prev, [subjectId]: coeff }));
  };

  // ── Confirm adding subjects to class (bulk) ──
  const handleAddSubjects = async () => {
    if (selectedSubjectsForAdd.size === 0) {
      toast.error(isFr ? "Sélectionnez au moins une matière" : "Select at least one subject");
      return;
    }
    setSavingClassSubjects(true);
    try {
      // Build array of { subjectId, coefficient } for the bulk endpoint
      const subjects = Array.from(selectedSubjectsForAdd).map((subjectId) => ({
        subjectId,
        coefficient: subjectCoefficients[subjectId] || 1,
      }));

      await bulkAssignSubjects(id, subjects);
      toast.success(isFr ? "Matières ajoutées avec succès" : "Subjects added");
      setShowAddSubjectModal(false);
      setSelectedSubjectsForAdd(new Set());
      setSubjectCoefficients({});
      // Reload class subjects with a single fresh fetch
      const fresh = await getClassSubjectsByClass(id).catch(() => []);
      const data = Array.isArray(fresh) ? fresh : (fresh?.data || fresh?.assignments || []);
      setClassSubjectAssignments(data);
    } catch (err) {
      const msg = err?.response?.data?.message || (isFr ? "Erreur" : "Error");
      toast.error(msg);
    } finally {
      setSavingClassSubjects(false);
    }
  };

  // ── Start editing a subject's coefficient ──
  const startEditCoeff = (assignmentId, currentCoeff) => {
    setEditCoeffAssignmentId(assignmentId);
    setEditCoeffValue(currentCoeff || 1);
  };

  // ── Cancel coefficient editing ──
  const cancelEditCoeff = () => {
    setEditCoeffAssignmentId(null);
    setEditCoeffValue(1);
  };

  // ── Save updated coefficient ──
  const saveCoeff = async () => {
    if (!editCoeffAssignmentId || savingCoeff) return;
    const assignment = classSubjectAssignments.find((a) => a.id === editCoeffAssignmentId);
    if (!assignment) return;
    const coeff = Math.max(1, Math.min(20, parseInt(editCoeffValue) || 1));
    setSavingCoeff(true);
    try {
      await bulkAssignSubjects(id, [{ subjectId: assignment.subjectId, coefficient: coeff }]);
      toast.success(isFr ? "Coefficient mis à jour" : "Coefficient updated");
      setClassSubjectAssignments((prev) =>
        prev.map((a) => (a.id === editCoeffAssignmentId ? { ...a, coefficient: coeff } : a))
      );
      setEditCoeffAssignmentId(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || (isFr ? "Erreur" : "Error"));
    } finally {
      setSavingCoeff(false);
    }
  };

  // ── Delete class ──
  const handleDelete = async () => {
    setDeleteConfirmLoading(true);
    try {
      await deleteClass(id);
      toast.success(isFr ? "Classe supprimée" : "Class deleted");
      setDeleteConfirmOpen(false);
      navigate("/dashboard/classes");
    } catch {
      toast.error(isFr ? "Erreur" : "Error");
      setDeleteConfirmLoading(false);
    }
  };

  // ── Remove subject from class (via ConfirmDialog) ──
  const handleRemoveSubject = async (assignmentId, subjectName) => {
    setRemoveSubjectConfirm({ open: true, assignmentId, subjectName });
  };

  const handleConfirmRemoveSubject = async () => {
    const { assignmentId } = removeSubjectConfirm;
    try {
      await removeSubjectFromClass(assignmentId);
      toast.success(isFr ? "Matière retirée" : "Subject removed");
      setClassSubjectAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err) {
      toast.error(isFr ? "Erreur" : "Error");
    }
    setRemoveSubjectConfirm({ open: false, assignmentId: null, subjectName: "" });
  };

  // ── Remove teacher from class ──
  const handleRemoveTeacherClick = (teacherId, teacherName) => {
    setRemoveTeacherConfirm({ open: true, teacherId, teacherName });
  };

  const handleConfirmRemoveTeacher = async () => {
    const { teacherId } = removeTeacherConfirm;
    if (!teacherId) return;
    try {
      await removeClassTeacher(id, teacherId);
      toast.success(isFr ? "Enseignant retiré de la classe" : "Teacher removed from class");
      // Remove from local state immediately
      setCls((prev) => ({
        ...prev,
        assignedTeachers: (prev.assignedTeachers || []).filter((t) => t.id !== teacherId),
        classTeacherId: prev.classTeacherId === teacherId ? null : prev.classTeacherId,
      }));
      setClassTeacherAssignments((prev) => prev.filter((a) => a.teacherId !== teacherId));
      setTeacherSubjectsMap((prev) => {
        const next = { ...prev };
        delete next[teacherId];
        return next;
      });
    } catch (err) {
      const msg = err?.response?.data?.message || (isFr ? "Erreur lors du retrait" : "Error removing teacher");
      toast.error(msg);
    }
    setRemoveTeacherConfirm({ open: false, teacherId: null, teacherName: "" });
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
        <FiAlertCircle className="w-12 h-12 mx-auto text-surface-400 mb-3" />
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
        <FiAlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
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
  const enrolled = cls.studentCount ?? students.length;
  const capacity = cls.capacity || 40;
  const pct = capacity > 0 ? Math.min(Math.round((enrolled / capacity) * 100), 100) : 0;
  const isFull = pct >= 90;
  const sectionInitial = (cls.name?.match(/[A-Z]/g) || [cls.name?.[0] || "A"]).slice(-1)[0];

  const selectedLevel = levels.find((l) => String(l.id) === String(editForm.levelId));
  const selectedSeries = series.find((s) => String(s.id) === String(editForm.seriesId));
  const assignedTeachers = cls.assignedTeachers || [];

  const classSubjects = classSubjectAssignments;

  const tabs = [
    { key: "general", icon: <FiEdit2 className="w-4 h-4" />, label: isFr ? "Général" : "General" },
    { key: "teachers", icon: <FiUsers className="w-4 h-4" />, label: isFr ? "Enseignants" : "Teachers", count: assignedTeachers.length },
    { key: "students", icon: <FiUser className="w-4 h-4" />, label: isFr ? "Élèves" : "Students", count: enrolled },
    { key: "subjects", icon: <FiBook className="w-4 h-4" />, label: isFr ? "Matières" : "Subjects", count: classSubjects.length },
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
              onClick={() => setDeleteConfirmOpen(true)}
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
                      {(() => {
                        // First check class_teachers (teacher assignments table)
                        const main = assignedTeachers.find((t) => t.isMain) || assignedTeachers[0];
                        if (main) return `${main.firstName || ""} ${main.lastName || ""}`.trim();
                        // Fallback: check legacy class_teacher_id field on classes table
                        if (cls.classTeacherId) {
                          return cls.teacherName || `${cls.teacherFirstName || ""} ${cls.teacherLastName || ""}`.trim() || (isFr ? "Assigné" : "Assigned");
                        }
                        return isFr ? "Non assigné" : "Not assigned";
                      })()}
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
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-surface-500">
                  {isFr
                    ? `${assignedTeachers.length} enseignant${assignedTeachers.length !== 1 ? "s" : ""} assigné${assignedTeachers.length !== 1 ? "s" : ""}`
                    : `${assignedTeachers.length} teacher${assignedTeachers.length !== 1 ? "s" : ""} assigned`}
                </p>
                <button
                  onClick={() => setAssignModal(true)}
                  className="h-9 px-4 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 transition-all hover:shadow-md"
                  style={{ backgroundColor: pc }}
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  {isFr ? "Ajouter un enseignant" : "Add teacher"}
                </button>
              </div>

              {assignedTeachers.length === 0 ? (
                <EmptyTab
                  icon={<FiUsers className="w-8 h-8" />}
                  title={isFr ? "Aucun enseignant assigné" : "No teachers assigned"}
                  subtitle={isFr ? "Cliquez sur 'Ajouter un enseignant' pour commencer." : "Click 'Add teacher' to get started."}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {assignedTeachers.map((t, idx) => {
                    const initials = ((t.firstName?.[0] || "") + (t.lastName?.[0] || "")).toUpperCase();
                    const isMain = t.id === cls.classTeacherId || idx === 0;
                    const teacherSubj = teacherSubjectsMap[t.id] || [];
                    return (
                      <button key={t.id}
                        onClick={() => { setAssignModal(true); openSubjectSelection(t); }}
                        className="w-full flex items-center gap-3.5 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: hexToRgba(pc, 0.08), border: `1.5px solid ${hexToRgba(pc, 0.2)}`, color: pc }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                            {t.firstName} {t.lastName}
                          </div>
                          <div className="text-xs text-surface-400 truncate">
                            {t.email}
                          </div>
                          {teacherSubj.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                              {teacherSubj.map((s) => (
                                <span key={s.id || s.subjectId}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: hexToRgba(pc, 0.06), color: pc, border: `1px solid ${hexToRgba(pc, 0.15)}` }}
                                >
                                  {s.subjectName}
                                </span>
                              ))}
                              <FiEdit2 className="w-2.5 h-2.5 text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          ) : (
                            <span className="text-[11px] text-surface-400 flex items-center gap-1 mt-1">
                              {isFr ? "Aucune matière assignée" : "No subjects assigned"}
                              <FiEdit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          )}
                        </div>
                        {isMain && (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                            style={{ background: hexToRgba(pc, 0.08), color: pc, border: `1px solid ${hexToRgba(pc, 0.2)}` }}>
                            {isFr ? "Titulaire" : "Class teacher"}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTeacherClick(t.id, `${t.firstName} ${t.lastName}`);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex-shrink-0"
                          title={isFr ? "Retirer cet enseignant" : "Remove teacher"}
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                        <FiChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Assign Teacher Modal ── */}
              {assignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setAssignModal(false); setSelectedTeacher(null); }} />
                  <div className="relative w-full max-w-[520px] bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden">

                    {/* ═══ STEP 2: Subject Selection ═══ */}
                    {selectedTeacher ? (
                      <>
                        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100 dark:border-surface-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                              <FiBook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h2 className="font-display text-lg font-bold text-surface-800 dark:text-surface-100">
                                {isFr ? "Choisir les matières" : "Select subjects"}
                              </h2>
                              <p className="text-xs text-surface-400">
                                {selectedTeacher.firstName} {selectedTeacher.lastName}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => setSelectedTeacher(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                            <FiX className="w-4 h-4 text-surface-400" />
                          </button>
                        </div>

                        <div className="p-6 max-h-[400px] overflow-y-auto">
                          {classSubjectsForTeacher.length === 0 ? (
                            <div className="text-center py-10">
                              <FiBook className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                              <p className="text-sm font-semibold text-surface-500">
                                {isFr
                                  ? "Aucune matière assignée à cette classe"
                                  : "No subjects assigned to this class"}
                              </p>
                              <p className="text-xs text-surface-400 mt-1">
                                {isFr
                                  ? "Ajoutez d'abord des matières dans l'onglet Matières."
                                  : "Add subjects first in the Subjects tab."}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {classSubjectsForTeacher.map((cs) => {
                                const subjId = cs.subjectId;
                                const isSelected = selectedSubjectIds.has(subjId);
                                return (
                                  <button
                                    key={cs.id}
                                    onClick={() => toggleSubject(subjId)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                      isSelected
                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                                        : "bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 hover:border-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                    }`}
                                  >
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                      isSelected
                                        ? "bg-blue-600 border-blue-600"
                                        : "border-surface-300 dark:border-surface-500"
                                    }`}>
                                      {isSelected && <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[14px] font-bold text-surface-800 dark:text-surface-100 truncate">
                                        {cs.subjectName}
                                      </div>
                                      {cs.coefficient && (
                                        <div className="text-[11px] text-surface-400">
                                          {isFr ? "Coefficient" : "Coeff"}: {cs.coefficient}
                                        </div>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-700 flex-shrink-0">
                                        {isFr ? "Assigné" : "Assigned"}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                          <button
                            onClick={() => setSelectedTeacher(null)}
                            className="h-[44px] px-4 rounded-xl border-2 border-surface-200 dark:border-surface-600 text-sm font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all flex items-center gap-2"
                          >
                            <FiChevronLeft className="w-4 h-4" />
                            {isFr ? "Retour" : "Back"}
                          </button>
                          <button
                            onClick={handleConfirmSubjects}
                            disabled={savingSubjects || classSubjectsForTeacher.length === 0}
                            className="h-[44px] px-6 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-55 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
                          >
                            {savingSubjects ? (
                              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            ) : (
                              <FiCheck className="w-4 h-4" />
                            )}
                            {savingSubjects
                              ? isFr ? "Enregistrement..." : "Saving..."
                              : isFr ? "Confirmer" : "Confirm"}
                          </button>
                        </div>
                      </>
                    ) : (
                      /* ═══ STEP 1: Teacher List ═══ */
                      <>
                        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100 dark:border-surface-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                              <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h2 className="font-display text-lg font-bold text-surface-800 dark:text-surface-100">
                                {isFr ? "Assigner un enseignant" : "Assign Teacher"}
                              </h2>
                              <p className="text-xs text-surface-400">
                                {isFr
                                  ? "Cliquez sur un enseignant pour choisir ses matières"
                                  : "Click a teacher to choose their subjects"}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => setAssignModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                            <FiX className="w-4 h-4 text-surface-400" />
                          </button>
                        </div>

                        <div className="p-6 max-h-[400px] overflow-y-auto">
                          {teachers.length === 0 ? (
                            <div className="text-center py-10">
                              <FiUsers className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                              <p className="text-sm font-semibold text-surface-500">{isFr ? "Aucun enseignant disponible" : "No teachers available"}</p>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {teachers.map((t) => {
                                const isAssigned = assignedTeachers.some((a) => a.id === t.id);
                                return (
                                  <button
                                    key={t.id}
                                    onClick={() => openSubjectSelection(t)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                      isAssigned
                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                                        : "bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 hover:border-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                    }`}
                                  >
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                      isAssigned
                                        ? "bg-blue-600 border-blue-600"
                                        : "border-surface-300 dark:border-surface-500"
                                    }`}>
                                      {isAssigned && <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[14px] font-bold text-surface-800 dark:text-surface-100 truncate">{t.firstName} {t.lastName}</div>
                                      <div className="text-[11px] text-surface-400">{t.email}</div>
                                    </div>
                                    <FiChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                          <button onClick={() => setAssignModal(false)} className="h-[44px] px-5 rounded-xl border-2 border-surface-200 dark:border-surface-600 text-sm font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all">
                            {isFr ? "Fermer" : "Close"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════ SUBJECTS TAB ═══════ */}
          {activeTab === "subjects" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-surface-500">
                  {isFr
                    ? `${classSubjects.length} matière${classSubjects.length !== 1 ? "s" : ""} dans cette classe`
                    : `${classSubjects.length} subject${classSubjects.length !== 1 ? "s" : ""} in this class`}
                </p>
                <button
                  onClick={() => setShowAddSubjectModal(true)}
                  className="h-9 px-4 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 transition-all hover:shadow-md"
                  style={{ backgroundColor: pc }}
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  {isFr ? "Ajouter une matière" : "Add subject"}
                </button>
              </div>

              {classSubjects.length === 0 ? (
                <EmptyTab
                  icon={<FiBook className="w-8 h-8" />}
                  title={isFr ? "Aucune matière assignée" : "No subjects assigned"}
                  subtitle={isFr ? "Cliquez sur 'Ajouter une matière' pour commencer." : "Click 'Add subject' to get started."}
                  action={
                    <button
                      onClick={() => setShowAddSubjectModal(true)}
                      className="h-10 px-5 text-white text-xs font-semibold rounded-lg transition-all hover:shadow-md"
                      style={{ backgroundColor: pc }}
                    >
                      <FiPlus className="w-3.5 h-3.5 inline mr-1.5" />
                      {isFr ? "Ajouter une matière" : "Add subject"}
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classSubjects.map((subj) => (
                    <div key={subj.id}
                      className="flex items-center gap-3 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:shadow-sm transition-shadow group"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: hexToRgba(pc, 0.08), border: `1.5px solid ${hexToRgba(pc, 0.2)}`, color: pc }}>
                        {(subj.subjectName || subj.name || subj.code || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-surface-800 dark:text-surface-100 truncate">
                          {subj.subjectName || subj.name || subj.code || "—"}
                        </div>
                        {editCoeffAssignmentId === subj.id ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={editCoeffValue}
                              onChange={(e) => setEditCoeffValue(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                              className="w-12 h-7 rounded-md border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-xs font-semibold text-surface-800 dark:text-surface-100 text-center outline-none focus:border-blue-500 transition-all"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Enter") saveCoeff(); if (e.key === "Escape") cancelEditCoeff(); }}
                            />
                            <button onClick={saveCoeff} disabled={savingCoeff}
                              className="w-6 h-6 flex items-center justify-center rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                              {savingCoeff ? (
                                <div className="w-2.5 h-2.5 rounded-full border-[2px] border-white/40 border-t-white animate-spin" />
                              ) : (
                                <FiCheck className="w-3 h-3" strokeWidth={3} />
                              )}
                            </button>
                            <button onClick={cancelEditCoeff} disabled={savingCoeff}
                              className="w-6 h-6 flex items-center justify-center rounded bg-surface-200 dark:bg-surface-600 text-surface-500 hover:bg-surface-300 dark:hover:bg-surface-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditCoeff(subj.id, subj.coefficient)}
                            className="text-[11px] text-surface-400 hover:text-primary-600 transition-colors flex items-center gap-1 group/coeff"
                          >
                            {subj.coefficient > 0 ? (
                              <>{isFr ? "Coefficient" : "Coeff"}: {subj.coefficient}</>
                            ) : (
                              <>{isFr ? "Ajouter un coefficient" : "Add coefficient"}</>
                            )}
                            <FiEdit2 className="w-2.5 h-2.5 opacity-0 group-hover/coeff:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveSubject(subj.id, subj.subjectName || subj.name || "")}
                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                        title={isFr ? "Retirer" : "Remove"}
                      >
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Add Subject Modal ── */}
              {showAddSubjectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowAddSubjectModal(false); setSelectedSubjectsForAdd(new Set()); setSubjectCoefficients({}); }} />
                  <div className="relative w-full max-w-[520px] bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden">

                    <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100 dark:border-surface-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hexToRgba(pc, 0.08) }}>
                          <FiBook className="w-5 h-5" style={{ color: pc }} />
                        </div>
                        <div>
                          <h2 className="font-display text-lg font-bold text-surface-800 dark:text-surface-100">
                            {isFr ? "Ajouter des matières" : "Add subjects"}
                          </h2>
                          <p className="text-xs text-surface-400">
                            {isFr
                              ? `Cochez les matières à assigner à ${cls.name}`
                              : `Select subjects to assign to ${cls.name}`}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => { setShowAddSubjectModal(false); setSelectedSubjectsForAdd(new Set()); setSubjectCoefficients({}); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                        <FiX className="w-4 h-4 text-surface-400" />
                      </button>
                    </div>

                    <div className="p-6 max-h-[420px] overflow-y-auto">
                      {subjects.length === 0 ? (
                        <div className="text-center py-10">
                          <FiBook className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-surface-500">
                            {isFr ? "Aucune matière disponible" : "No subjects available"}
                          </p>
                          <p className="text-xs text-surface-400 mt-1">
                            {isFr
                              ? "Créez d'abord des matières dans la section Subjects."
                              : "Create subjects first in the Subjects section."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {subjects.map((sbj) => {
                            // Skip subjects already assigned to this class
                            const isAlreadyAssigned = classSubjects.some((cs) => cs.subjectId === sbj.id || cs.id === sbj.id);
                            if (isAlreadyAssigned) return null;
                            const isSelected = selectedSubjectsForAdd.has(sbj.id);
                            const coeffValue = subjectCoefficients[sbj.id] ?? "";
                            return (
                              <div
                                key={sbj.id}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                                  isSelected
                                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                                    : "bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 hover:border-blue-200"
                                }`}
                              >
                                <button
                                  onClick={() => toggleSubjectForAdd(sbj.id)}
                                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                    isSelected
                                      ? "bg-blue-600 border-blue-600"
                                      : "border-surface-300 dark:border-surface-500"
                                  }`}
                                >
                                  {isSelected && <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[14px] font-bold text-surface-800 dark:text-surface-100 truncate">
                                    {sbj.name}
                                  </div>
                                  {sbj.code && (
                                    <div className="text-[11px] text-surface-400">{sbj.code}</div>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <label className="text-xs text-surface-500">
                                      {isFr ? "Coef." : "Coeff."}
                                    </label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={20}
                                      value={coeffValue}
                                      onChange={(e) => handleCoefficientChange(sbj.id, e.target.value)}
                                      className="w-14 h-9 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm font-semibold text-surface-800 dark:text-surface-100 text-center outline-none focus:border-blue-500 transition-all"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                      <button
                        onClick={() => { setShowAddSubjectModal(false); setSelectedSubjectsForAdd(new Set()); setSubjectCoefficients({}); }}
                        className="h-[44px] px-5 rounded-xl border-2 border-surface-200 dark:border-surface-600 text-sm font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all"
                      >
                        {isFr ? "Annuler" : "Cancel"}
                      </button>
                      <button
                        onClick={handleAddSubjects}
                        disabled={savingClassSubjects || selectedSubjectsForAdd.size === 0}
                        className="h-[44px] px-6 rounded-xl text-white text-sm font-bold flex items-center gap-2 disabled:opacity-55 transition-all hover:-translate-y-0.5"
                        style={{ backgroundColor: pc }}
                      >
                        {savingClassSubjects ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <FiPlus className="w-4 h-4" />
                        )}
                        {savingClassSubjects
                          ? isFr ? "Ajout..." : "Adding..."
                          : isFr
                            ? `Ajouter (${selectedSubjectsForAdd.size})`
                            : `Add (${selectedSubjectsForAdd.size})`}
                      </button>
                    </div>
                  </div>
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

      {/* ── Confirm Delete Class Dialog ── */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        title={isFr ? "Supprimer la classe" : "Delete class"}
        message={isFr ? `Êtes-vous sûr de vouloir supprimer ${cls?.name} ? Cette action est irréversible.` : `Are you sure you want to delete ${cls?.name}? This action cannot be undone.`}
        confirmLabel={isFr ? "Supprimer" : "Delete"}
        cancelLabel={isFr ? "Annuler" : "Cancel"}
        loading={deleteConfirmLoading}
      />

      {/* ── Confirm Remove Subject Dialog ── */}
      <ConfirmDialog
        isOpen={removeSubjectConfirm.open}
        onClose={() => setRemoveSubjectConfirm({ open: false, assignmentId: null, subjectName: "" })}
        onConfirm={handleConfirmRemoveSubject}
        variant="warning"
        title={isFr ? "Retirer la matière" : "Remove subject"}
        message={isFr
          ? `Voulez-vous retirer "${removeSubjectConfirm.subjectName}" de cette classe ?`
          : `Remove "${removeSubjectConfirm.subjectName}" from this class?`}
        confirmLabel={isFr ? "Retirer" : "Remove"}
        cancelLabel={isFr ? "Annuler" : "Cancel"}
      />

      {/* ── Confirm Remove Teacher Dialog ── */}
      <ConfirmDialog
        isOpen={removeTeacherConfirm.open}
        onClose={() => setRemoveTeacherConfirm({ open: false, teacherId: null, teacherName: "" })}
        onConfirm={handleConfirmRemoveTeacher}
        variant="warning"
        title={isFr ? "Retirer l'enseignant" : "Remove teacher"}
        message={isFr
          ? `Voulez-vous retirer "${removeTeacherConfirm.teacherName}" de ${cls?.name} ? Il ne pourra plus voir cette classe ni ses matières.`
          : `Remove "${removeTeacherConfirm.teacherName}" from ${cls?.name}? They will no longer have access to this class or its subjects.`}
        confirmLabel={isFr ? "Retirer" : "Remove"}
        cancelLabel={isFr ? "Annuler" : "Cancel"}
      />
    </div>
  );
}
