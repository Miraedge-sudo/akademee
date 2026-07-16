import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../../core/api/subjectService";
import {
  FiBook,
  FiSearch,
  FiPlus,
  FiX,
  FiCheck,
  FiTrash2,
  FiEdit2,
  FiHash,
  FiType,
  FiCode,
  FiChevronRight,
  FiGrid,
  FiList,
  FiArrowRight,
  FiStar,
} from "react-icons/fi";

// ── Color palette for subjects ──
const COLORS = [
  { bg: "#085041", light: "#E1F5EE", label: "Emerald" },
  { bg: "#3B82F6", light: "#EFF6FF", label: "Blue" },
  { bg: "#8B5CF6", light: "#F5F3FF", label: "Purple" },
  { bg: "#D97706", light: "#FEF3C7", label: "Amber-dark" },
  { bg: "#F59E0B", light: "#FEF3C7", label: "Amber" },
  { bg: "#EF4444", light: "#FEF2F2", label: "Red" },
  { bg: "#14B8A6", light: "#F0FDFA", label: "Teal" },
  { bg: "#6366F1", light: "#EEF2FF", label: "Indigo" },
  { bg: "#0EA5E9", light: "#F0F9FF", label: "Sky" },
  { bg: "#1D9E75", light: "#E8F8F3", label: "Forest" },
];

const getSubjectColor = (name) => {
  if (!name) return COLORS[0];
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
};

// ── Smart code generation from name ──
// Takes the first 3 letters of the name.
// If the name has only 2 letters, takes those 2.
const generateCode = (name) => {
  if (!name?.trim()) return "";
  const trimmed = name.trim();
  const length = Math.min(trimmed.length, 3);
  return trimmed.slice(0, length).toUpperCase();
};

// ── Animations CSS ──
const ANIM_STYLES = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes cardAppear {
  from { opacity: 0; transform: scale(0.95) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
`;

export default function SubjectsListPage() {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const [viewMode, setViewMode] = useState("grid");

  // ── Data ──
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Form ──
  const [formMode, setFormMode] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const nameInputRef = useRef(null);

  // ── Delete ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Filter ──
  const filteredSubjects = useMemo(() => {
    if (!searchQuery) return subjects;
    const q = searchQuery.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code || "").toLowerCase().includes(q)
    );
  }, [subjects, searchQuery]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = subjects.length;
    const withCodes = subjects.filter((s) => s.code).length;
    return { total, withCodes };
  }, [subjects]);

  // ── Load ──
  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSubjects();
      setSubjects(
        Array.isArray(data) ? data : data?.subjects || data?.rows || []
      );
    } catch (err) {
      console.error("Failed to load subjects:", err);
      setError(isFr ? "Erreur de chargement" : "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [isFr]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  // ── Auto-generate code from name (create mode only, NOT if manually edited) ──
  useEffect(() => {
    if (formMode !== "create") return;
    if (!formName.trim()) return;
    if (codeManuallyEdited) return;

    const generated = generateCode(formName);
    if (!generated || generated === formCode) return;

    setFormCode(generated);
  }, [formName, formMode, codeManuallyEdited]);

  // ── Focus name input on form open ──
  useEffect(() => {
    if (formMode) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [formMode]);

  // ── Form helpers ──
  const resetForm = () => {
    setFormName("");
    setFormCode("");
    setCodeManuallyEdited(false);
    setFormErrors({});
    setEditingSubject(null);
  };

  const openCreateForm = () => {
    resetForm();
    setFormMode("create");
  };

  const openEditForm = (subject) => {
    setFormName(subject.name || "");
    setFormCode(subject.code || "");
    setCodeManuallyEdited(true);
    setFormErrors({});
    setEditingSubject(subject);
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode(null);
    resetForm();
  };

  const validateForm = () => {
    const errs = {};
    if (!formName.trim())
      errs.name = isFr ? "Le nom est requis" : "Name is required";
    if (formCode.trim() && formCode.trim().length < 2)
      errs.code = isFr ? "Code trop court (min. 2)" : "Code too short (min. 2)";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase() || undefined,
      };
      if (editingSubject) {
        await updateSubject(editingSubject.id, payload);
        toast.success(isFr ? "Matière mise à jour ✨" : "Subject updated ✨");
      } else {
        await createSubject(payload);
        toast.success(isFr ? "Matière créée ✨" : "Subject created ✨");
      }
      closeForm();
      loadSubjects();
    } catch (err) {
      const msg =
        err?.response?.data?.message || (isFr ? "Erreur" : "Failed to save");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSubject(deleteTarget.id);
      toast.success(isFr ? "Matière supprimée" : "Subject deleted");
      setDeleteTarget(null);
      loadSubjects();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || (isFr ? "Erreur" : "Error")
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <>
        <style>{ANIM_STYLES}</style>
        <div className="max-w-[960px] mx-auto pb-16">
          <div className="animate-pulse space-y-6">
            <div className="h-9 bg-surface-100 dark:bg-surface-700 rounded-xl w-48" />
            <div className="h-24 bg-surface-100 dark:bg-surface-700 rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-surface-100 dark:bg-surface-700 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <>
        <style>{ANIM_STYLES}</style>
        <div className="max-w-[960px] mx-auto pb-16 text-center py-24">
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-5 animate-[scaleIn_0.4s_ease]">
            <FiBook className="w-9 h-9 text-red-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-surface-800 dark:text-surface-100 mb-2">
            {isFr ? "Erreur de chargement" : "Loading error"}
          </h2>
          <p className="text-sm text-surface-400 mb-8 max-w-sm mx-auto">{error}</p>
          <button
            onClick={loadSubjects}
            className="h-11 px-6 rounded-xl bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-sm font-bold hover:-translate-y-0.5 transition-all shadow-lg"
          >
            {isFr ? "Réessayer" : "Retry"}
          </button>
        </div>
      </>
    );
  }

  // ═══════════════════ RENDER ═══════════════════
  return (
    <>
      <style>{ANIM_STYLES}</style>
      <div className="max-w-[960px] mx-auto pb-16">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6 animate-[fadeUp_0.5s_cubic-bezier(.16,1,.3,1)]">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-primary-900 dark:bg-primary-700 flex items-center justify-center shadow-md">
                <FiBook className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-[28px] font-bold text-surface-900 dark:text-surface-100 leading-tight">
                  {isFr ? "Matières" : "Subjects"}
                </h1>
                <p className="text-[13px] text-surface-400">
                  {subjects.length}{" "}
                  {isFr
                    ? `matière${subjects.length > 1 ? "s" : ""}`
                    : `subject${subjects.length > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={openCreateForm}
            className="h-10 px-4 rounded-xl bg-primary-900 dark:bg-primary-600 text-white text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            style={{ boxShadow: "0 4px 16px rgba(8,80,65,0.25)" }}
          >
            <FiPlus className="w-4 h-4" strokeWidth={2.5} />
            {isFr ? "Nouvelle matière" : "New subject"}
          </button>
        </div>

        {/* ═══ STATS ROW ═══ */}
        <div className="grid grid-cols-3 gap-3 mb-6 animate-[fadeUp_0.5s_cubic-bezier(.16,1,.3,1)]">
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1">
              {isFr ? "Total" : "Total"}
            </p>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1">
              {isFr ? "Avec code" : "With code"}
            </p>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {stats.withCodes}
              <span className="text-sm font-medium text-surface-400 ml-1">/ {stats.total}</span>
            </p>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1">
              {isFr ? "Assignées" : "Assigned"}
            </p>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {subjects.filter((s) => s.teacherCount || s.classCount).length}
              <span className="text-sm font-medium text-surface-400 ml-1">/ {stats.total}</span>
            </p>
          </div>
        </div>

        {/* ═══ SEARCH + VIEW TOGGLE ═══ */}
        <div className="flex items-center gap-3 mb-5 animate-[fadeUp_0.5s_cubic-bezier(.16,1,.3,1)]">
          <div className="flex-1 flex items-center gap-2.5 bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl px-4 h-11 shadow-sm transition-all duration-200 focus-within:border-primary-400 focus-within:shadow-[0_0_0_3.5px_rgba(8,80,65,.08)]">
            <FiSearch className="w-4 h-4 text-surface-400 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isFr ? "Rechercher une matière..." : "Search subjects..."}
              className="flex-1 border-none outline-none text-sm bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="w-5 h-5 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center hover:bg-surface-200 transition-colors"
              >
                <FiX className="w-3 h-3 text-surface-400" />
              </button>
            )}
          </div>
          <div className="flex bg-surface-100 dark:bg-surface-700 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-surface-600 shadow-sm text-surface-800 dark:text-surface-100"
                  : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              }`}
            >
              <FiGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-surface-600 shadow-sm text-surface-800 dark:text-surface-100"
                  : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              }`}
            >
              <FiList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ═══ EMPTY STATE ═══ */}
        {filteredSubjects.length === 0 && (
          <div className="text-center py-20 animate-[fadeUp_0.5s_cubic-bezier(.16,1,.3,1)]">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <FiBook className="w-10 h-10 text-primary-600/60 dark:text-primary-400/40" />
            </div>
            <h3 className="font-display text-2xl font-bold text-surface-800 dark:text-surface-100 mb-2">
              {searchQuery
                ? isFr ? "Aucun résultat" : "No results"
                : isFr ? "Aucune matière encore" : "No subjects yet"}
            </h3>
            <p className="text-sm text-surface-400 mb-8 max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? isFr
                  ? `Aucune matière ne correspond à "${searchQuery}"`
                  : `No subjects match "${searchQuery}"`
                : isFr
                  ? "Ajoutez votre première matière pour commencer à structurer votre programme académique."
                  : "Add your first subject to start structuring your academic program."}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreateForm}
                className="h-12 px-7 rounded-xl bg-primary-900 dark:bg-primary-600 text-white text-sm font-bold flex items-center gap-2.5 mx-auto shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                style={{ boxShadow: "0 4px 16px rgba(8,80,65,0.25)" }}
              >
                <FiPlus className="w-4 h-4" strokeWidth={2.5} />
                {isFr ? "Ajouter une matière" : "Add a subject"}
              </button>
            )}
          </div>
        )}

        {/* ═══ GRID VIEW ═══ */}
        {viewMode === "grid" && filteredSubjects.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSubjects.map((s, idx) => {
              const color = getSubjectColor(s.name);
              return (
                <div
                  key={s.id}
                  onClick={() => openEditForm(s)}
                  className="group relative bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1"
                  style={{
                    animation: `cardAppear 0.35s cubic-bezier(.16,1,.3,1) ${idx * 40}ms both`,
                  }}
                >
                  <div
                    className="absolute top-0 left-4 right-4 h-1 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: color.bg }}
                  />
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-extrabold text-white mb-3 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-[-3deg]"
                    style={{ backgroundColor: color.bg }}
                  >
                    {(s.code || s.name[0] || "?").toUpperCase().slice(0, 2)}
                  </div>
                  <h3 className="text-[15px] font-bold text-surface-800 dark:text-surface-100 mb-0.5 leading-snug line-clamp-2">
                    {s.name}
                  </h3>
                  {s.code && (
                    <span
                      className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md mt-1.5"
                      style={{ backgroundColor: color.light, color: color.bg }}
                    >
                      {s.code}
                    </span>
                  )}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditForm(s); }}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-surface-700 border border-surface-100 dark:border-surface-600 flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                    >
                      <FiEdit2 className="w-3 h-3 text-surface-500" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-surface-700 border border-surface-100 dark:border-surface-600 flex items-center justify-center hover:scale-110 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm"
                    >
                      <FiTrash2 className="w-3 h-3 text-surface-500 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ LIST VIEW ═══ */}
        {viewMode === "list" && filteredSubjects.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 shadow-sm overflow-hidden animate-[fadeUp_0.4s_ease]">
            <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
              {filteredSubjects.map((s, idx) => {
                const color = getSubjectColor(s.name);
                return (
                  <div
                    key={s.id}
                    onClick={() => openEditForm(s)}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-700/30 cursor-pointer transition-colors group"
                    style={{ animation: `fadeIn 0.3s ease ${idx * 25}ms both` }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: color.bg }}
                    >
                      {(s.code || s.name[0] || "?").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-surface-800 dark:text-surface-100 truncate">{s.name}</p>
                      {s.code && <p className="text-[11px] font-mono text-surface-400">{s.code}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditForm(s); }}
                        className="w-8 h-8 rounded-lg border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <FiEdit2 className="w-3.5 h-3.5 text-surface-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                        className="w-8 h-8 rounded-lg border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-110 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        <FiTrash2 className="w-3.5 h-3.5 text-surface-400 hover:text-red-500" />
                      </button>
                    </div>
                    <FiChevronRight className="w-4 h-4 text-surface-300 group-hover:text-surface-500 transition-colors flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ FORM MODAL ═══ */}
        {formMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: "fadeIn 0.2s ease both" }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
            <div
              className="relative bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden"
              style={{ animation: "scaleIn 0.35s cubic-bezier(.34,1.56,.64,1) both" }}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">
                    {formMode === "create"
                      ? isFr ? "Ajouter une matière" : "Add subject"
                      : isFr ? "Modifier la matière" : "Edit subject"}
                  </h2>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {isFr
                      ? "Le coefficient se configure lors de l'assignation à une classe."
                      : "Coefficient is set when assigning to a class."}
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="w-8 h-8 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                >
                  <FiX className="w-4 h-4 text-surface-500" />
                </button>
              </div>

              <div className="px-6 pb-6 space-y-4">
                {/* Name input */}
                <div>
                  <label className="block text-[12.5px] font-bold text-surface-700 dark:text-surface-300 mb-1.5">
                    {isFr ? "Nom de la matière" : "Subject name"} <span className="text-primary-600">*</span>
                  </label>
                  <div className="relative">
                    <FiType className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      ref={nameInputRef}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      placeholder={isFr ? "Ex: Mathématiques" : "e.g. Mathematics"}
                      className={`w-full h-[48px] pl-10 pr-4 border-[1.5px] rounded-xl text-sm text-surface-800 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-[0_0_0_3.5px_rgba(8,80,65,.08)] placeholder:text-surface-300 dark:placeholder:text-surface-500 ${
                        formErrors.name
                          ? "!border-red-400 !shadow-[0_0_0_3.5px_rgba(239,68,68,.08)]"
                          : "border-surface-200 dark:border-surface-600"
                      }`}
                    />
                  </div>
                  {formErrors.name && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <FiX className="w-3 h-3" /> {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Live preview card */}
                {formName.trim() && formCode && (
                  <div
                    className="p-4 rounded-2xl border flex items-center gap-4 animate-[fadeUp_0.3s_cubic-bezier(.16,1,.3,1)]"
                    style={{
                      backgroundColor: getSubjectColor(formName).light,
                      borderColor: getSubjectColor(formName).bg + "20",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shadow-sm"
                      style={{ backgroundColor: getSubjectColor(formName).bg }}
                    >
                      {formCode || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-surface-800 dark:text-surface-100">{formName}</p>
                      <p className="text-[11px] font-mono text-surface-500">{formCode}</p>
                    </div>
                  </div>
                )}

                {/* Code input */}
                <div>
                  <label className="block text-[12.5px] font-bold text-surface-700 dark:text-surface-300 mb-1.5">
                    {isFr ? "Code abrégé" : "Short code"}
                    <span className="text-surface-300 font-normal ml-1">
                      ({isFr ? "optionnel, auto-généré" : "optional, auto"})
                    </span>
                  </label>
                  <div className="relative">
                    <FiHash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      value={formCode}
                      onChange={(e) => {
                        setFormCode(e.target.value.toUpperCase());
                        setCodeManuallyEdited(true);
                      }}
                      placeholder={isFr ? "Ex: MATH" : "e.g. MATH"}
                      maxLength={6}
                      className={`w-full h-[48px] pl-10 pr-12 border-[1.5px] rounded-xl text-sm text-surface-800 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-[0_0_0_3.5px_rgba(8,80,65,.08)] placeholder:text-surface-300 dark:placeholder:text-surface-500 font-mono font-bold tracking-wider ${
                        formErrors.code ? "!border-red-400" : "border-surface-200 dark:border-surface-600"
                      }`}
                    />
                    {!codeManuallyEdited && formCode && formMode === "create" && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-semibold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full border border-primary-200 dark:border-primary-800 animate-[fadeIn_0.3s_ease]">
                        <FiStar className="w-2.5 h-2.5" /> Auto
                      </div>
                    )}
                  </div>
                  {formErrors.code && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <FiX className="w-3 h-3" /> {formErrors.code}
                    </p>
                  )}
                  {!formErrors.code && (
                    <p className="text-[11px] text-surface-400 mt-1.5 flex items-center gap-1">
                      <FiCode className="w-3 h-3" />
                      {isFr
                        ? "Généré depuis le nom. Modifiez-le à tout moment."
                        : "Auto-generated from name. Edit anytime."}
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-[50px] rounded-xl bg-primary-900 dark:bg-primary-600 text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg disabled:opacity-55 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0 hover:shadow-xl duration-200"
                    style={{ boxShadow: "0 4px 16px rgba(8,80,65,0.25)" }}
                  >
                    {saving ? (
                      <div className="w-4.5 h-4.5 rounded-full border-2.5 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <FiCheck className="w-4.5 h-4.5" strokeWidth={2.5} />
                    )}
                    {saving
                      ? isFr ? "Enregistrement..." : "Saving..."
                      : formMode === "edit"
                        ? isFr ? "Mettre à jour" : "Update"
                        : isFr ? "Créer la matière" : "Create subject"}
                  </button>
                  <button
                    onClick={closeForm}
                    className="w-full h-[50px] rounded-xl border-2 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FiArrowRight className="w-4 h-4" />
                    {isFr ? "Annuler" : "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ DELETE MODAL ═══ */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: "fadeIn 0.2s ease both" }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <div
              className="relative bg-white dark:bg-surface-800 rounded-3xl shadow-2xl p-7 max-w-[400px] w-full"
              style={{ animation: "scaleIn 0.35s cubic-bezier(.34,1.56,.64,1) both" }}
            >
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-100 text-center mb-2">
                {isFr ? "Confirmer la suppression" : "Confirm deletion"}
              </h3>
              <p className="text-sm text-surface-500 text-center mb-7 leading-relaxed">
                {isFr
                  ? `Êtes-vous sûr de vouloir supprimer définitivement "${deleteTarget.name}" ? Cette action est irréversible.`
                  : `Are you sure you want to permanently delete "${deleteTarget.name}"? This action cannot be undone.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 h-11 rounded-xl border-2 border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  {isFr ? "Annuler" : "Cancel"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-55 hover:bg-red-600 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  {deleting && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                  {isFr ? "Supprimer" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
