/**
 * SubjectOfferingsPage — Admin interface for subject offerings & assessment components.
 *
 * Features:
 *  - List subject offerings filtered by class level + period
 *  - Create new subject offering (subject, class level, period, coefficient, credits)
 *  - Expand rows to view assessment components
 *  - Add assessment components (CC, EXAM, TP, PRACTICAL, THEORY, RESIT) with weight %
 *
 * Route: /dashboard/subject-offerings
 * Backend: /api/v1/subject-offerings, /api/v1/assessment-components
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTheme } from "../../../core/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { getClasses } from "../../../core/api/classService";
import { getSubjects } from "../../../core/api/subjectService";
import periodService from "../../../core/api/periodService";
import {
  listEducationSystems,
  createSubjectOffering,
  listSubjectOfferings,
  createAssessmentComponent,
  listAssessmentComponents,
} from "../../../core/api/gradingService";
import toast from "react-hot-toast";
import {
  FiBook,
  FiPlus,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiPercent,
  FiAward,
} from "react-icons/fi";
import TableSkeleton from "../../../components/ui/TableSkeleton";

// ── Component types ──
const COMPONENT_TYPES = [
  { value: "CONTINUOUS_ASSESSMENT", labelEn: "Continuous Assessment", labelFr: "Contrôle Continu" },
  { value: "EXAM", labelEn: "Exam", labelFr: "Examen" },
  { value: "PRACTICAL", labelEn: "Practical", labelFr: "Pratique" },
  { value: "THEORY", labelEn: "Theory", labelFr: "Théorie" },
  { value: "CC", labelEn: "CC", labelFr: "CC" },
  { value: "TP", labelEn: "TP", labelFr: "TP" },
  { value: "RESIT", labelEn: "Resit", labelFr: "Rattrapage" },
];

// ── Modal ──
function ModalBackdrop({ open, onClose, title, subtitle, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-surface-100 dark:border-surface-700">
        <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700">
          <div>
            <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100">{title}</h3>
            {subtitle && <p className="text-[12px] text-surface-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
            <FiX size={16} className="text-surface-400" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ExpandableSection({ title, icon: Icon, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
          {Icon && <Icon size={16} className="text-surface-500" />}
        </div>
        <span className="text-[14px] font-bold text-surface-900 dark:text-surface-100 flex-1 text-left">{title}</span>
        {open ? <FiChevronUp size={16} className="text-surface-400" /> : <FiChevronDown size={16} className="text-surface-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function SubjectOfferingsPage() {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const pc = primaryColor || "#085041";
  const isFr = i18n.language === "fr";

  // ── Data ──
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [components, setComponents] = useState({}); // keyed by offeringId
  const [expandedOffering, setExpandedOffering] = useState(null);

  // ── Filters ──
  const [filterClassId, setFilterClassId] = useState("");
  const [filterPeriodId, setFilterPeriodId] = useState("");

  // ── Modals ──
  const [newOfferingOpen, setNewOfferingOpen] = useState(false);
  const [newComponentOpen, setNewComponentOpen] = useState(null); // offeringId

  // ── Forms ──
  const [offeringForm, setOfferingForm] = useState({
    subjectId: "",
    classLevelId: "",
    periodStructureId: "",
    coefficient: 1,
    credits: 0,
    isElective: false,
  });
  const [componentForm, setComponentForm] = useState({
    subjectOfferingId: "",
    type: "CONTINUOUS_ASSESSMENT",
    weightPercent: 40,
    maxScore: 20,
  });
  const [saving, setSaving] = useState(false);

  // ── Load supporting data ──
  const loadInitial = useCallback(async () => {
    try {
      const [classesData, periodsData, subjectsData] = await Promise.all([
        getClasses().catch(() => []),
        periodService.list().catch(() => []),
        getSubjects().catch(() => []),
      ]);
      setClasses(Array.isArray(classesData) ? classesData : classesData?.classes || []);
      setPeriods(Array.isArray(periodsData) ? periodsData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : subjectsData?.subjects || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // ── Load offerings ──
  const loadOfferings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterClassId) params.classLevelId = filterClassId;
      if (filterPeriodId) params.periodStructureId = filterPeriodId;
      const data = await listSubjectOfferings(params);
      setOfferings(Array.isArray(data) ? data : []);
    } catch {
      setOfferings([]);
    }
    setLoading(false);
  }, [filterClassId, filterPeriodId]);

  useEffect(() => { loadOfferings(); }, [loadOfferings]);

  // ── Load components for an offering ──
  const loadComponents = async (offeringId) => {
    try {
      const data = await listAssessmentComponents(offeringId);
      setComponents((prev) => ({ ...prev, [offeringId]: Array.isArray(data) ? data : [] }));
    } catch {
      setComponents((prev) => ({ ...prev, [offeringId]: [] }));
    }
  };

  // ── Resolve names ──
  const className = (id) => classes.find((c) => c.id === id)?.name || id?.slice(0, 8) || "?";
  const periodName = (id) => periods.find((p) => p.id === id)?.name || id?.slice(0, 8) || "?";
  const subjectName = (id) => {
    const sub = subjects.find((s) => s.subjectId === id || s.id === id);
    return sub ? (isFr ? sub.name_fr || sub.name : sub.name_en || sub.name) : id?.slice(0, 8) || "?";
  };

  // ── Create offering ──
  const handleCreateOffering = async () => {
    if (!offeringForm.subjectId || !offeringForm.classLevelId || !offeringForm.periodStructureId) {
      toast.error(isFr ? "Veuillez remplir tous les champs obligatoires" : "Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      await createSubjectOffering(offeringForm);
      toast.success(isFr ? "Offre de matière créée !" : "Subject offering created!");
      setNewOfferingOpen(false);
      setOfferingForm({ subjectId: "", classLevelId: "", periodStructureId: "", coefficient: 1, credits: 0, isElective: false });
      loadOfferings();
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec de la création" : "Creation failed"));
    }
    setSaving(false);
  };

  // ── Create component ──
  const handleCreateComponent = async (offeringId) => {
    if (!componentForm.type || componentForm.weightPercent <= 0) {
      toast.error(isFr ? "Veuillez définir le type et le poids" : "Please set the type and weight");
      return;
    }
    setSaving(true);
    try {
      await createAssessmentComponent({
        subjectOfferingId: offeringId,
        type: componentForm.type,
        weightPercent: componentForm.weightPercent,
        maxScore: componentForm.maxScore,
      });
      toast.success(isFr ? "Composante ajoutée !" : "Component added!");
      setNewComponentOpen(null);
      setComponentForm({ subjectOfferingId: "", type: "CONTINUOUS_ASSESSMENT", weightPercent: 40, maxScore: 20 });
      loadComponents(offeringId);
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec de l'ajout" : "Failed to add"));
    }
    setSaving(false);
  };

  // ── Total weight % for an offering ──
  const totalWeight = (offeringId) => {
    const comps = components[offeringId] || [];
    return comps.reduce((sum, c) => sum + Number(c.weight_percent || 0), 0);
  };

  // ── Render ──
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <style>{`
        @keyframes soFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .so-fade { animation: soFadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="so-fade relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <FiBook size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight">
                {isFr ? "Offres de matières" : "Subject Offerings"}
              </h1>
              <p className="text-white/70 text-sm">
                {isFr
                  ? "Liez les matières aux classes avec coefficients et définissez les composantes d'évaluation"
                  : "Link subjects to classes with coefficients and define assessment components"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters + Action ── */}
      <div className="so-fade bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm p-4" style={{ animationDelay: "0.04s" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => setNewOfferingOpen(true)}
            className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md flex items-center gap-1.5"
            style={{ background: pc }}
          >
            <FiPlus size={13} />
            {isFr ? "Nouvelle offre" : "New Offering"}
          </button>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Class filter */}
            <div className="relative">
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="h-9 pl-3 pr-8 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-lg text-[12px] text-surface-700 dark:text-surface-200 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
              >
                <option value="">{isFr ? "Toutes les classes" : "All classes"}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <FiChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>

            {/* Period filter */}
            <div className="relative">
              <select
                value={filterPeriodId}
                onChange={(e) => setFilterPeriodId(e.target.value)}
                className="h-9 pl-3 pr-8 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-lg text-[12px] text-surface-700 dark:text-surface-200 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
              >
                <option value="">{isFr ? "Toutes les périodes" : "All periods"}</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <FiChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Offerings Table ── */}
      <div className="so-fade" style={{ animationDelay: "0.06s" }}>
        <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-3 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-100 dark:border-surface-700 text-[11px] font-semibold tracking-wider uppercase text-surface-400">
            <div className="col-span-3">{isFr ? "Matière" : "Subject"}</div>
            <div className="col-span-2">{isFr ? "Classe" : "Class"}</div>
            <div className="col-span-2">{isFr ? "Période" : "Period"}</div>
            <div className="col-span-1 text-center">Coeff</div>
            <div className="col-span-1 text-center">{isFr ? "Crédits" : "Credits"}</div>
            <div className="col-span-1 text-center">{isFr ? "Type" : "Type"}</div>
            <div className="col-span-2 text-right">{isFr ? "Composantes" : "Components"}</div>
          </div>

          {loading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : offerings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-4 border-2 border-dashed border-surface-200 dark:border-surface-600">
                <FiBook size={28} className="text-surface-300" />
              </div>
              <h3 className="text-base font-semibold text-surface-700 dark:text-surface-200 mb-1">
                {isFr ? "Aucune offre de matière" : "No subject offerings yet"}
              </h3>
              <p className="text-sm text-surface-400 max-w-sm">
                {isFr
                  ? "Créez une offre pour lier une matière à une classe avec son coefficient."
                  : "Create an offering to link a subject to a class with its coefficient."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
              {offerings.map((off, idx) => {
                const isExpanded = expandedOffering === off.subject_offering_id;
                const comps = components[off.subject_offering_id];
                const weight = totalWeight(off.subject_offering_id);

                return (
                  <div key={off.subject_offering_id}>
                    {/* Main row */}
                    <div
                      className="so-fade grid grid-cols-1 sm:grid-cols-12 gap-2 px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors items-center cursor-pointer"
                      style={{ animationDelay: `${0.08 + idx * 0.03}s` }}
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedOffering(null);
                        } else {
                          setExpandedOffering(off.subject_offering_id);
                          if (!components[off.subject_offering_id]) {
                            loadComponents(off.subject_offering_id);
                          }
                        }
                      }}
                    >
                      <div className="sm:col-span-3 flex items-center gap-2 min-w-0">
                        <FiBook size={14} className="text-surface-400 flex-shrink-0" />
                        <span className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 truncate">
                          {subjectName(off.subject_id)}
                        </span>
                      </div>
                      <div className="sm:col-span-2 text-[13px] text-surface-600 dark:text-surface-300">{className(off.class_level_id)}</div>
                      <div className="sm:col-span-2 text-[13px] text-surface-600 dark:text-surface-300">{periodName(off.period_structure_id)}</div>
                      <div className="sm:col-span-1 text-center text-[14px] font-extrabold text-surface-800 dark:text-surface-100">{off.coefficient}</div>
                      <div className="sm:col-span-1 text-center text-[12px] text-surface-500">{off.credits || 0}</div>
                      <div className="sm:col-span-1 text-center">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          off.is_elective
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        }`}>
                          {off.is_elective
                            ? (isFr ? "Option" : "Elective")
                            : (isFr ? "Oblig." : "Req.")}
                        </span>
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-end gap-2">
                        {comps ? (
                          <span className={`text-[11px] font-bold ${weight === 100 ? "text-green-600" : "text-amber-500"}`}>
                            {weight}%
                          </span>
                        ) : null}
                        <button
                          onClick={(e) => { e.stopPropagation(); setNewComponentOpen(off.subject_offering_id); setComponentForm({ ...componentForm, subjectOfferingId: off.subject_offering_id }); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-surface-400 hover:text-primary-600"
                          title={isFr ? "Ajouter une composante" : "Add component"}
                        >
                          <FiPlus size={12} />
                        </button>
                        {isExpanded ? <FiChevronUp size={14} className="text-surface-400" /> : <FiChevronDown size={14} className="text-surface-400" />}
                      </div>
                    </div>

                    {/* Expanded components */}
                    {isExpanded && (
                      <div className="px-5 sm:px-10 pb-4 border-t border-surface-100 dark:border-surface-700 pt-3 bg-surface-50/50 dark:bg-surface-900/20">
                        {!comps ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : comps.length === 0 ? (
                          <p className="text-[12px] text-surface-400 text-center py-3">
                            {isFr
                              ? "Aucune composante d'évaluation. Cliquez sur + pour en ajouter."
                              : "No assessment components. Click + to add one."}
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="grid grid-cols-4 gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase text-surface-400">
                              <div>{isFr ? "Type" : "Type"}</div>
                              <div>{isFr ? "Poids %" : "Weight %"}</div>
                              <div>{isFr ? "Note max" : "Max score"}</div>
                              <div></div>
                            </div>
                            {comps.map((c) => (
                              <div key={c.assessment_component_id} className="grid grid-cols-4 gap-2 px-3 py-2 rounded-lg bg-white dark:bg-surface-800 text-[12px] items-center">
                                <div className="font-semibold text-surface-800 dark:text-surface-200">
                                  {COMPONENT_TYPES.find((t) => t.value === c.type) ? (isFr
                                    ? COMPONENT_TYPES.find((t) => t.value === c.type).labelFr
                                    : COMPONENT_TYPES.find((t) => t.value === c.type).labelEn
                                  ) : c.type}
                                </div>
                                <div className="text-surface-500 font-mono">{c.weight_percent}%</div>
                                <div className="text-surface-500 font-mono">/{c.max_score}</div>
                                <div></div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Status bar */}
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{
                          background: weight === 100 ? "rgba(29,158,117,0.06)" : "rgba(245,158,11,0.06)",
                          border: `1px solid ${weight === 100 ? "rgba(29,158,117,0.15)" : "rgba(245,158,11,0.15)"}`,
                        }}>
                          <FiPercent size={12} className={weight === 100 ? "text-green-600" : "text-amber-500"} />
                          <span className="text-[11px] font-medium" style={{ color: weight === 100 ? "#1D9E75" : "#F59E0B" }}>
                            {isFr
                              ? `Poids total : ${weight}% ${weight === 100 ? "(✓ complet)" : "(devrait être 100%)"}`
                              : `Total weight: ${weight}% ${weight === 100 ? "(✓ complete)" : "(should be 100%)"}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* MODAL: New Subject Offering */}
      {/* ════════════════════════════════════════ */}
      <ModalBackdrop
        open={newOfferingOpen}
        onClose={() => setNewOfferingOpen(false)}
        title={isFr ? "Nouvelle offre de matière" : "New Subject Offering"}
        subtitle={isFr ? "Liez une matière à une classe avec un coefficient" : "Link a subject to a class with a coefficient"}
      >
        <div className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Matière *" : "Subject *"}</label>
            <div className="relative">
              <select
                value={offeringForm.subjectId}
                onChange={(e) => setOfferingForm({ ...offeringForm, subjectId: e.target.value })}
                className="w-full h-10 pl-3 pr-8 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
              >
                <option value="">{isFr ? "Choisir une matière..." : "Choose a subject..."}</option>
                {subjects.map((s) => (
                  <option key={s.subjectId || s.id} value={s.subjectId || s.id}>
                    {s.code ? `${s.code} — ` : ""}{isFr ? s.name_fr || s.name : s.name_en || s.name}
                  </option>
                ))}
              </select>
              <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>

          {/* Class + Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Classe *" : "Class *"}</label>
              <div className="relative">
                <select
                  value={offeringForm.classLevelId}
                  onChange={(e) => setOfferingForm({ ...offeringForm, classLevelId: e.target.value })}
                  className="w-full h-10 pl-3 pr-8 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
                >
                  <option value="">{isFr ? "Choisir..." : "Choose..."}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Période *" : "Period *"}</label>
              <div className="relative">
                <select
                  value={offeringForm.periodStructureId}
                  onChange={(e) => setOfferingForm({ ...offeringForm, periodStructureId: e.target.value })}
                  className="w-full h-10 pl-3 pr-8 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
                >
                  <option value="">{isFr ? "Choisir..." : "Choose..."}</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Coefficient + Credits + Elective */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Coefficient" : "Coefficient"}</label>
              <input
                type="number"
                min="1"
                max="10"
                value={offeringForm.coefficient}
                onChange={(e) => setOfferingForm({ ...offeringForm, coefficient: Number(e.target.value) })}
                className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Crédits" : "Credits"}</label>
              <input
                type="number"
                min="0"
                max="10"
                value={offeringForm.credits}
                onChange={(e) => setOfferingForm({ ...offeringForm, credits: Number(e.target.value) })}
                className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Option ?" : "Elective?"}</label>
              <div className="relative">
                <select
                  value={offeringForm.isElective ? "yes" : "no"}
                  onChange={(e) => setOfferingForm({ ...offeringForm, isElective: e.target.value === "yes" })}
                  className="w-full h-10 pl-3 pr-8 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
                >
                  <option value="no">{isFr ? "Obligatoire" : "Required"}</option>
                  <option value="yes">{isFr ? "Optionnelle" : "Elective"}</option>
                </select>
                <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setNewOfferingOpen(false)} className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              {isFr ? "Annuler" : "Cancel"}
            </button>
            <button
              onClick={handleCreateOffering}
              disabled={saving || !offeringForm.subjectId || !offeringForm.classLevelId || !offeringForm.periodStructureId}
              className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{ background: pc }}
            >
              {saving ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isFr ? "Création..." : "Creating..."}</>
              ) : (
                <>{isFr ? "Créer l'offre" : "Create Offering"}</>
              )}
            </button>
          </div>
        </div>
      </ModalBackdrop>

      {/* ════════════════════════════════════════ */}
      {/* MODAL: New Assessment Component */}
      {/* ════════════════════════════════════════ */}
      <ModalBackdrop
        open={!!newComponentOpen}
        onClose={() => setNewComponentOpen(null)}
        title={isFr ? "Ajouter une composante" : "Add Assessment Component"}
        subtitle={isFr ? "Définissez le type et le poids de l'évaluation" : "Define the assessment type and weight"}
      >
        <div className="space-y-4">
          {/* Component type */}
          <div>
            <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Type *" : "Type *"}</label>
            <div className="relative">
              <select
                value={componentForm.type}
                onChange={(e) => setComponentForm({ ...componentForm, type: e.target.value })}
                className="w-full h-10 pl-3 pr-8 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
              >
                {COMPONENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {isFr ? t.labelFr : t.labelEn}
                  </option>
                ))}
              </select>
              <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>

          {/* Weight + Max score */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Poids %" : "Weight %"}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={componentForm.weightPercent}
                onChange={(e) => setComponentForm({ ...componentForm, weightPercent: Number(e.target.value) })}
                className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Note max" : "Max score"}</label>
              <input
                type="number"
                min="1"
                max="40"
                value={componentForm.maxScore}
                onChange={(e) => setComponentForm({ ...componentForm, maxScore: Number(e.target.value) })}
                className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <FiAward size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-blue-700 dark:text-blue-300">
              {isFr
                ? "Exemple : CC à 40% + Examen à 60% = 100%. Le poids total doit être de 100% pour le calcul de la moyenne."
                : "Example: CA at 40% + Exam at 60% = 100%. Total weight must be 100% for average calculation."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setNewComponentOpen(null)} className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              {isFr ? "Annuler" : "Cancel"}
            </button>
            <button
              onClick={() => handleCreateComponent(newComponentOpen)}
              disabled={saving || componentForm.weightPercent <= 0 || componentForm.maxScore <= 0}
              className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{ background: pc }}
            >
              {saving ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isFr ? "Ajout..." : "Adding..."}</>
              ) : (
                <>{isFr ? "Ajouter la composante" : "Add Component"}</>
              )}
            </button>
          </div>
        </div>
      </ModalBackdrop>
    </div>
  );
}
