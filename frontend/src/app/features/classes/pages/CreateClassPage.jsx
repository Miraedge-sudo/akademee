import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../core/hooks/useTheme";
import {
  FiCheck,
  FiChevronLeft,
  FiPlus,
  FiMinus,
  FiLoader,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getClassById, createClass, updateClass } from "../../../core/api/classService";
import { getUsers } from "../../../core/api/userManagementService";
import levelService from "../../../core/api/levelService";
import seriesService from "../../../core/api/seriesService";

export default function CreateClassPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const { primaryColor } = useTheme();
  const isFr = i18n.language === "fr";
  const pc = primaryColor || "#085041";
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [levels, setLevels] = useState([]);
  const [series, setSeries] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    levelId: "",
    seriesId: "",
    capacity: 40,
    classTeacherId: "",
  });

  const nameEdited = useRef(false);
  const prevAutoName = useRef("");

  // Load levels, series, and class data (if editing)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [levelsData, seriesData] = await Promise.all([
          levelService.list().catch(() => []),
          seriesService.list().catch(() => []),
        ]);
        setLevels(levelsData);
        setSeries(seriesData);

        try {
          const teachersData = await getUsers({ role: "TEACHER" });
          setTeachers(Array.isArray(teachersData) ? teachersData : (teachersData?.users || []));
        } catch (err) {
          console.warn("Could not load teachers:", err);
          setTeachers([]);
        }        if (isEditing) {
          const cls = await getClassById(id);
          setForm({
            name: cls.name || "",
            levelId: cls.levelId?.toString() || "",
            seriesId: cls.seriesId?.toString() || "",
            capacity: cls.capacity || 40,
            classTeacherId: cls.classTeacherId?.toString() || "",
          });
          nameEdited.current = true;
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isEditing]);

  const updateField = (field, value) => {
    if (field === "name") {
      nameEdited.current = true;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedLevel = levels.find((l) => String(l.id) === String(form.levelId));
  const selectedSeries = series.find((s) => String(s.id) === String(form.seriesId));

  // Auto-generate name from level + series
  const autoName = useMemo(() => {
    const lvl = selectedLevel?.name || "";
    const ser = selectedSeries?.name || "";
    if (!lvl && !ser) return "";
    const parts = [lvl, ser].filter(Boolean);
    return parts.join(" ");
  }, [selectedLevel, selectedSeries]);

  // Auto-fill name when level/series changes, but only if user hasn't manually edited it
  useEffect(() => {
    if (isEditing) return;
    if (!autoName) return;
    if (nameEdited.current) return;

    prevAutoName.current = autoName;
    setForm((prev) => ({ ...prev, name: autoName }));
  }, [autoName, isEditing]);

  const handleNameFocus = () => {
    // If the name matches the auto-generated suggestion, select all text for easy editing
    if (autoName && form.name === autoName) {
      nameEdited.current = false;
    }
  };

  const restoreAutoName = () => {
    if (autoName) {
      nameEdited.current = false;
      prevAutoName.current = autoName;
      setForm((prev) => ({ ...prev, name: autoName }));
    }
  };

  const showAutoSuggestion = autoName && form.name !== autoName && !isEditing;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(isFr ? "Le nom de la classe est requis" : "Class name is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        levelId: form.levelId || null,
        seriesId: form.seriesId || null,
        capacity: form.capacity,
        classTeacherId: form.classTeacherId || null,
      };

      if (isEditing) {
        await updateClass(id, payload);
        toast.success(isFr ? "Classe modifiée !" : "Class updated!");
      } else {
        await createClass({ ...payload, studentsCount: 0 });
        toast.success(isFr ? "Classe créée !" : "Class created!");
      }
      navigate("/dashboard/classes");
    } catch (err) {
      toast.error(isFr ? "Erreur lors de la sauvegarde" : "Error saving class");
    } finally {
      setSubmitting(false);
    }
  };

  const capacityPct = Math.min((form.capacity / 100) * 100, 100);
  const inputClass =
    "w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-all";
  const labelClass = "block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1.5";
  const hintClass = "text-[11px] text-surface-400 mt-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-6">
        <Link to="/dashboard/classes" className="hover:text-primary-600 transition-colors">
          {isFr ? "Classes" : "Classes"}
        </Link>
        <span>/</span>
        <span className="text-surface-800 dark:text-surface-100 font-medium">
          {isEditing
            ? (isFr ? "Modifier la classe" : "Edit class")
            : (isFr ? "Nouvelle classe" : "New class")}
        </span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: pc }} />
          <h1 className="font-display text-2xl font-bold text-surface-800 dark:text-surface-100">
            {isEditing
              ? (isFr ? "Modifier la classe" : "Edit class")
              : (isFr ? "Créer une nouvelle classe" : "Create a new class")}
          </h1>
        </div>
        <p className="text-sm text-surface-400 ml-3.5">
          {isFr
            ? "Donnez un nom à la classe et associez-lui optionnellement un niveau et une série."
            : "Name the class and optionally assign a level and series."}
        </p>
      </header>

      {/* Form */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-6 sm:p-7 border border-surface-200 dark:border-surface-700 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Class name */}
          <div>
            <label className={labelClass}>
              {isFr ? "Nom de la classe" : "Class name"} <span className="text-primary-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                onFocus={handleNameFocus}
                placeholder={isFr ? "Ex: Form 1A, 6ème B, Science" : "e.g. Form 1A, 6ème B, Science"}
                className={`${inputClass} ${showAutoSuggestion ? "border-primary-400 ring-1 ring-primary-200 dark:ring-primary-800" : ""}`}
              />
              {showAutoSuggestion && (
                <button
                  type="button"
                  onClick={restoreAutoName}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 h-7 rounded-md text-[11px] font-semibold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all whitespace-nowrap"
                  title={isFr ? "Restaurer le nom suggéré" : "Restore suggested name"}
                >
                  <FiPlus className="w-2.5 h-2.5 rotate-45" strokeWidth={3} />
                  {isFr ? `"${autoName}"` : `"${autoName}"`}
                </button>
              )}
            </div>
            <p className={hintClass}>
              {isFr
                ? showAutoSuggestion
                  ? `Suggestion : cliquez sur « ${autoName} » pour restaurer le nom auto-généré`
                  : "Le nom est auto-généré à partir du niveau et de la série sélectionnés"
                : showAutoSuggestion
                  ? `Suggestion: click "${autoName}" to restore the auto-generated name`
                  : "The name is auto-generated from the selected level and series"}
            </p>
          </div>

          {/* Level + Series row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Level */}
            <div>
              <label className={labelClass}>
                {isFr ? "Niveau" : "Level"}
                <span className="text-surface-300 font-normal ml-1">({isFr ? "optionnel" : "optional"})</span>
              </label>
              <select
                value={form.levelId}
                onChange={(e) => updateField("levelId", e.target.value)}
                className={inputClass}
              >
                <option value="">
                  {isFr ? "Aucun niveau" : "No level"}
                </option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Series */}
            <div>
              <label className={labelClass}>
                {isFr ? "Série / Filière" : "Series / Stream"}
                <span className="text-surface-300 font-normal ml-1">({isFr ? "optionnel" : "optional"})</span>
              </label>
              <select
                value={form.seriesId}
                onChange={(e) => updateField("seriesId", e.target.value)}
                className={inputClass}
              >
                <option value="">
                  {isFr ? "Aucune série" : "No series"}
                </option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
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
              value={form.classTeacherId}
              onChange={(e) => updateField("classTeacherId", e.target.value)}
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
            <p className={hintClass}>
              {isFr
                ? "Le professeur titulaire sera responsable de cette classe"
                : "The class teacher will be responsible for this class"}
            </p>
          </div>

          {/* Capacity */}
          <div>
            <label className={labelClass}>
              {isFr ? "Capacité maximale" : "Maximum capacity"}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateField("capacity", Math.max(1, form.capacity - 1))}
                className="w-9 h-9 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex-shrink-0"
              >
                <FiMinus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                  updateField("capacity", v);
                }}
                min={1}
                max={100}
                className={`${inputClass} w-24 text-center`}
              />
              <button
                type="button"
                onClick={() => updateField("capacity", Math.min(100, form.capacity + 1))}
                className="w-9 h-9 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex-shrink-0"
              >
                <FiPlus className="w-4 h-4" />
              </button>
              <div className="flex-1 h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${capacityPct}%`, backgroundColor: pc }}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {form.name && (
            <div
              className="p-4 rounded-xl border border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: pc }}
                >
                  {(form.name.match(/[A-Z]/g) || ["C"]).slice(-1)}
                </div>
                <div>
                  <div className="font-bold text-surface-800 dark:text-surface-100">
                    {form.name}
                  </div>
                  <div className="text-xs text-surface-400">
                    {selectedLevel?.name && selectedSeries?.name
                      ? `${selectedLevel.name} · ${selectedSeries.name}`
                      : selectedLevel?.name || selectedSeries?.name || (isFr ? "Aucun niveau/série" : "No level/series")}
                    {form.capacity > 0 && ` · ${form.capacity} ${isFr ? "places" : "seats"}`}
                    {form.classTeacherId && teachers.find((t) => t.id == form.classTeacherId) && (
                      <span> · {isFr ? "Titulaire" : "Teacher"}: {teachers.find((t) => t.id == form.classTeacherId).firstName}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <Link
              to="/dashboard/classes"
              className="h-11 px-5 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
            >
              <FiChevronLeft className="w-4 h-4" />
              {isFr ? "Annuler" : "Cancel"}
            </Link>
            <button
              type="submit"
              disabled={!form.name.trim() || submitting}
              className="flex-1 h-11 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: form.name.trim() ? pc : "#9BA59C",
              }}
            >
              {submitting ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <FiCheck className="w-4 h-4" />
              )}
              {submitting
                ? (isFr ? "Enregistrement..." : "Saving...")
                : isEditing
                  ? (isFr ? "Enregistrer" : "Save")
                  : (isFr ? "Créer la classe" : "Create class")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
