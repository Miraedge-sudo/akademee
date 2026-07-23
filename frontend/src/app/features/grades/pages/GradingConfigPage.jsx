/**
 * GradingConfigPage — Admin configuration for grading scales and mention thresholds.
 *
 * Features:
 *  - View & create grading scales (name, min/max values)
 *  - Manage grading scale versions (pass mark, rounding rule, precision)
 *  - View & create mention threshold sets linked to education systems
 *  - Add mention thresholds (min/max values with labels in FR/EN)
 *
 * Route: /dashboard/grading-config
 * Backend: /api/v1/grading-scales, /api/v1/mention-threshold-sets
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTheme } from "../../../core/hooks/useTheme";
import { useTranslation } from "react-i18next";
import {
  listGradingScales,
  createGradingScale,
  createGradingScaleVersion,
  listGradingScaleVersions,
  listEducationSystems,
  createMentionThresholdSet,
  createMentionThreshold,
  listMentionThresholds,
} from "../../../core/api/gradingService";
import toast from "react-hot-toast";
import {
  FiSettings,
  FiPlus,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiStar,
  FiLayers,
  FiAward,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";
import ConfigSkeleton from "../../../components/ui/ConfigSkeleton";

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

export default function GradingConfigPage() {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const pc = primaryColor || "#085041";
  const isFr = i18n.language === "fr";

  // ── Data ──
  const [educationSystems, setEducationSystems] = useState([]);
  const [gradingScales, setGradingScales] = useState([]);
  const [scaleVersions, setScaleVersions] = useState({});
  // Track created mention threshold sets with their real threshold_set_id
  const [thresholdSets, setThresholdSets] = useState([]);
  const [mentionThresholds, setMentionThresholds] = useState({});
  const [expandedScaleId, setExpandedScaleId] = useState(null);
  const [expandedMentionSetId, setExpandedMentionSetId] = useState(null);

  // ── Modals ──
  const [newScaleOpen, setNewScaleOpen] = useState(false);
  const [newVersionOpen, setNewVersionOpen] = useState(null); // scaleId
  const [newMentionSetOpen, setNewMentionSetOpen] = useState(false);
  const [newThresholdOpen, setNewThresholdOpen] = useState(null); // setId

  // ── Forms ──
  const [scaleForm, setScaleForm] = useState({ name: "", minValue: 0, maxValue: 20 });
  const [versionForm, setVersionForm] = useState({ passMark: 10, roundingRule: "round_half_up", decimalPrecision: 2 });
  const [mentionSetForm, setMentionSetForm] = useState({ educationSystemId: "", gradingScaleId: "" });
  const [thresholdForm, setThresholdForm] = useState({ minValue: 0, maxValue: 20, mentionLabelFr: "", mentionLabelEn: "" });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Load data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [systems, scales] = await Promise.all([
        listEducationSystems().catch(() => []),
        listGradingScales().catch(() => []),
      ]);
      setEducationSystems(Array.isArray(systems) ? systems : []);
      setGradingScales(Array.isArray(scales) ? scales : []);
    } catch {
      toast.error(isFr ? "Échec du chargement" : "Failed to load");
    }
    setLoading(false);
  }, [isFr]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Load versions for a scale ──
  const loadVersions = async (scaleId) => {
    try {
      const data = await listGradingScaleVersions(scaleId);
      setScaleVersions((prev) => ({ ...prev, [scaleId]: Array.isArray(data) ? data : [] }));
    } catch {
      setScaleVersions((prev) => ({ ...prev, [scaleId]: [] }));
    }
  };

  // ── Load thresholds for a set ──
  const loadThresholds = async (setId) => {
    try {
      const data = await listMentionThresholds(setId);
      setMentionThresholds((prev) => ({ ...prev, [setId]: Array.isArray(data) ? data : [] }));
    } catch {
      setMentionThresholds((prev) => ({ ...prev, [setId]: [] }));
    }
  };

  // ── Create Grading Scale ──
  const handleCreateScale = async () => {
    if (!scaleForm.name.trim()) {
      toast.error(isFr ? "Le nom est requis" : "Name is required");
      return;
    }
    setSaving(true);
    try {
      await createGradingScale(scaleForm);
      toast.success(isFr ? "Barème créé !" : "Grading scale created!");
      setNewScaleOpen(false);
      setScaleForm({ name: "", minValue: 0, maxValue: 20 });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec de la création" : "Creation failed"));
    }
    setSaving(false);
  };

  // ── Create Grading Scale Version ──
  const handleCreateVersion = async (scaleId) => {
    setSaving(true);
    try {
      await createGradingScaleVersion(scaleId, versionForm);
      toast.success(isFr ? "Version créée !" : "Version created!");
      setNewVersionOpen(null);
      setVersionForm({ passMark: 10, roundingRule: "round_half_up", decimalPrecision: 2 });
      loadVersions(scaleId);
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec de la création" : "Creation failed"));
    }
    setSaving(false);
  };

  // ── Create Mention Threshold Set ──
  const handleCreateMentionSet = async () => {
    if (!mentionSetForm.educationSystemId || !mentionSetForm.gradingScaleId) {
      toast.error(isFr ? "Veuillez sélectionner un système et un barème" : "Select a system and a scale");
      return;
    }
    setSaving(true);
    try {
      const created = await createMentionThresholdSet(mentionSetForm);
      // Store the created set with its real threshold_set_id
      if (created) {
        setThresholdSets((prev) => {
          // Avoid duplicates
          if (prev.find((s) => s.threshold_set_id === created.threshold_set_id)) return prev;
          return [...prev, created];
        });
      }
      toast.success(isFr ? "Ensemble de mentions créé !" : "Threshold set created!");
      setNewMentionSetOpen(false);
      setMentionSetForm({ educationSystemId: "", gradingScaleId: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec de la création" : "Creation failed"));
    }
    setSaving(false);
  };

  // ── Create Mention Threshold ──
  const handleCreateThreshold = async (setId) => {
    if (!thresholdForm.mentionLabelFr.trim() || !thresholdForm.mentionLabelEn.trim()) {
      toast.error(isFr ? "Les libellés sont requis" : "Labels are required");
      return;
    }
    setSaving(true);
    try {
      await createMentionThreshold(setId, thresholdForm);
      toast.success(isFr ? "Seuil ajouté !" : "Threshold added!");
      setNewThresholdOpen(null);
      setThresholdForm({ minValue: 0, maxValue: 20, mentionLabelFr: "", mentionLabelEn: "" });
      loadThresholds(setId);
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec de l'ajout" : "Failed to add"));
    }
    setSaving(false);
  };

  // ── Rounding rule labels ──
  const ROUNDING_LABELS = {
    round_half_up: isFr ? "Arrondi standard" : "Round Half Up",
    round_half_even: isFr ? "Arrondi pair" : "Round Half Even",
    truncate: isFr ? "Troncature" : "Truncate",
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Skeleton header */}
        <div className="rounded-2xl p-6 sm:p-8 bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-56 rounded-lg bg-surface-100 dark:bg-surface-700 animate-pulse" />
              <div className="h-3 w-40 rounded bg-surface-100 dark:bg-surface-700 animate-pulse" />
            </div>
          </div>
        </div>
        <ConfigSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <style>{`
        @keyframes gfFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .gf-fade { animation: gfFadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ── Header ── */}
      <div className="gf-fade relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}>
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <FiSettings size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight">
                {isFr ? "Configuration de la notation" : "Grading Configuration"}
              </h1>
              <p className="text-white/70 text-sm">
                {isFr ? "Barèmes de notation et seuils de mentions" : "Grading scales and mention thresholds"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* SECTION 1: Education Systems */}
      {/* ════════════════════════════════════════ */}
      <div className="gf-fade" style={{ animationDelay: "0.04s" }}>
        <ExpandableSection title={isFr ? "Systèmes éducatifs" : "Education Systems"} icon={FiLayers}>
          {educationSystems.length === 0 ? (
            <p className="text-[13px] text-surface-400 text-center py-4">{isFr ? "Aucun système configuré" : "No systems configured"}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {educationSystems.map((sys) => (
                <div key={sys.education_system_id} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700">
                  <div className="text-[13px] font-bold text-surface-900 dark:text-surface-100">{sys.code}</div>
                  <div className="text-[11px] text-surface-400">{isFr ? sys.name_fr : sys.name_en}</div>
                  {sys.period_hierarchy && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {JSON.parse(typeof sys.period_hierarchy === "string" ? sys.period_hierarchy : "[]").map((p) => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ExpandableSection>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* SECTION 2: Grading Scales */}
      {/* ════════════════════════════════════════ */}
      <div className="gf-fade space-y-3" style={{ animationDelay: "0.06s" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <FiStar size={18} />
            {isFr ? "Barèmes de notation" : "Grading Scales"}
          </h2>
          <button
            onClick={() => setNewScaleOpen(true)}
            className="h-8 px-3.5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md flex items-center gap-1.5"
            style={{ background: pc }}
          >
            <FiPlus size={13} />
            {isFr ? "Nouveau barème" : "New Scale"}
          </button>
        </div>

        {gradingScales.length === 0 ? (
          <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-8 text-center">
            <p className="text-[13px] text-surface-400">{isFr ? "Aucun barème créé" : "No grading scales yet"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {gradingScales.map((scale) => (
              <div key={scale.grading_scale_id} className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl overflow-hidden">
                {/* Scale header */}
                <div
                  className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors"
                  onClick={() => {
                    if (expandedScaleId === scale.grading_scale_id) {
                      setExpandedScaleId(null);
                    } else {
                      setExpandedScaleId(scale.grading_scale_id);
                      if (!scaleVersions[scale.grading_scale_id]) loadVersions(scale.grading_scale_id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                      <FiStar size={14} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-surface-900 dark:text-surface-100">{scale.name}</div>
                      <div className="text-[11px] text-surface-400">
                        {scale.min_value}–{scale.max_value} · {isFr ? "Version" : "Ver"}: {scale.current_version_id ? "✓" : "-"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setNewVersionOpen(scale.grading_scale_id); }}
                      className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors flex items-center gap-1"
                    >
                      <FiPlus size={11} />
                      {isFr ? "Version" : "Ver"}
                    </button>
                    {expandedScaleId === scale.grading_scale_id ? <FiChevronUp size={16} className="text-surface-400" /> : <FiChevronDown size={16} className="text-surface-400" />}
                  </div>
                </div>

                {/* Scale versions */}
                {expandedScaleId === scale.grading_scale_id && (
                  <div className="px-5 pb-4 border-t border-surface-100 dark:border-surface-700 pt-3">
                    {(!scaleVersions[scale.grading_scale_id] || scaleVersions[scale.grading_scale_id].length === 0) ? (
                      <p className="text-[12px] text-surface-400 text-center py-3">{isFr ? "Aucune version. Créez-en une." : "No versions yet. Create one."}</p>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-4 gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase text-surface-400">
                          <div>{isFr ? "Seuil" : "Pass Mark"}</div>
                          <div>{isFr ? "Règle" : "Rounding"}</div>
                          <div>{isFr ? "Précision" : "Precision"}</div>
                          <div>{isFr ? "Date" : "Date"}</div>
                        </div>
                        {scaleVersions[scale.grading_scale_id].map((v) => (
                          <div key={v.grading_scale_version_id} className="grid grid-cols-4 gap-2 px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-900 text-[12px]">
                            <div className="font-semibold text-surface-800 dark:text-surface-200">{v.pass_mark}</div>
                            <div className="text-surface-500">{ROUNDING_LABELS[v.rounding_rule] || v.rounding_rule}</div>
                            <div className="text-surface-500">{v.decimal_precision} {isFr ? "décimales" : "dec."}</div>
                            <div className="text-surface-400 text-[10px]">{v.effective_from ? new Date(v.effective_from).toLocaleDateString() : "-"}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════ */}
      {/* SECTION 3: Mention Threshold Sets */}
      {/* ════════════════════════════════════════ */}
      <div className="gf-fade space-y-3" style={{ animationDelay: "0.08s" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <FiAward size={18} />
            {isFr ? "Seuils de mentions" : "Mention Thresholds"}
          </h2>
          <button
            onClick={() => setNewMentionSetOpen(true)}
            className="h-8 px-3.5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md flex items-center gap-1.5"
            style={{ background: pc }}
          >
            <FiPlus size={13} />
            {isFr ? "Nouvel ensemble" : "New Set"}
          </button>
        </div>

        {thresholdSets.length === 0 ? (
          <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-8 text-center">
            <FiInfo size={28} className="mx-auto mb-3 text-surface-300" />
            <p className="text-[13px] text-surface-500 font-medium mb-1">
              {isFr ? "Aucun ensemble de seuils" : "No threshold sets yet"}
            </p>
            <p className="text-[12px] text-surface-400 max-w-sm mx-auto">
              {isFr
                ? "Créez un ensemble de seuils pour lier un système éducatif à un barème de notation. Ensuite, ajoutez des seuils (ex: 16-20 → Très bien)."
                : "Create a threshold set to link an education system to a grading scale. Then add thresholds (e.g., 16-20 → Very Good)."}
            </p>
            <button
              onClick={() => setNewMentionSetOpen(true)}
              className="mt-4 h-8 px-4 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md"
              style={{ background: pc }}
            >
              <FiPlus size={13} className="inline mr-1" />
              {isFr ? "Créer un ensemble" : "Create a set"}
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {thresholdSets.map((ts) => {
                const setId = ts.threshold_set_id;
                const thresholds = mentionThresholds[setId];
                const isExpanded = expandedMentionSetId === setId;

                // Look up the linked education system & grading scale
                const linkedSys = educationSystems.find(
                  (s) => s.education_system_id === ts.education_system_id
                );
                const linkedScale = gradingScales.find(
                  (s) => s.grading_scale_id === ts.grading_scale_id
                );

                return (
                  <div key={setId} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700">
                    <div className="text-[12px] font-bold text-surface-900 dark:text-surface-100 mb-0.5">
                      {linkedSys?.code || ts.education_system_id?.slice(0, 8) || "?"}
                    </div>
                    <div className="text-[10px] text-surface-400 mb-1.5">
                      {isFr ? linkedSys?.name_fr : linkedSys?.name_en}
                      {linkedScale && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[9px]">
                          {linkedScale.name}
                        </span>
                      )}
                    </div>

                    {!thresholds ? (
                      <button
                        onClick={() => {
                          setExpandedMentionSetId(setId);
                          loadThresholds(setId);
                        }}
                        className="text-[11px] text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {isFr ? "Charger les seuils" : "Load thresholds"}
                      </button>
                    ) : thresholds.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-[10px] text-surface-400">{isFr ? "Aucun seuil" : "No thresholds"}</p>
                        <button
                          onClick={() => setNewThresholdOpen(setId)}
                          className="h-6 px-2 rounded-lg text-[10px] font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 transition-colors flex items-center gap-1"
                        >
                          <FiPlus size={10} />
                          {isFr ? "Ajouter" : "Add"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {thresholds.map((t) => (
                          <div key={t.mention_threshold_id} className="flex items-center justify-between text-[11px] px-2 py-1 rounded-md bg-white dark:bg-surface-800">
                            <span className="font-semibold text-surface-800 dark:text-surface-200">
                              {t.min_value}–{t.max_value || "∞"}
                            </span>
                            <span className="text-surface-500">{isFr ? t.mention_label_fr : t.mention_label_en}</span>
                          </div>
                        ))}
                        <button
                          onClick={() => setNewThresholdOpen(setId)}
                          className="mt-1 h-6 px-2 rounded-lg text-[10px] font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-1"
                        >
                          <FiPlus size={10} />
                          {isFr ? "Ajouter" : "Add"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════ */}
      {/* MODAL: New Grading Scale */}
      {/* ════════════════════════════════════════ */}
      <ModalBackdrop
        open={newScaleOpen}
        onClose={() => setNewScaleOpen(false)}
        title={isFr ? "Nouveau barème" : "New Grading Scale"}
        subtitle={isFr ? "Définissez les paramètres du barème" : "Define the grading scale parameters"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Nom *" : "Name *"}</label>
            <input
              type="text"
              value={scaleForm.name}
              onChange={(e) => setScaleForm({ ...scaleForm, name: e.target.value })}
              placeholder={isFr ? "Ex: Barème Lycée Cameroun" : "E.g. Cameroon Lycée Scale"}
              className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Note min" : "Min value"}</label>
              <input
                type="number"
                value={scaleForm.minValue}
                onChange={(e) => setScaleForm({ ...scaleForm, minValue: Number(e.target.value) })}
                className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Note max" : "Max value"}</label>
              <input
                type="number"
                value={scaleForm.maxValue}
                onChange={(e) => setScaleForm({ ...scaleForm, maxValue: Number(e.target.value) })}
                className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setNewScaleOpen(false)} className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              {isFr ? "Annuler" : "Cancel"}
            </button>
            <button
              onClick={handleCreateScale}
              disabled={saving || !scaleForm.name.trim()}
              className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{ background: pc }}
            >
              {saving ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isFr ? "Création..." : "Creating..."}</>
              ) : (
                <>{isFr ? "Créer" : "Create"}</>
              )}
            </button>
          </div>
        </div>
      </ModalBackdrop>

      {/* ════════════════════════════════════════ */}
      {/* MODAL: New Grading Scale Version */}
      {/* ════════════════════════════════════════ */}
      <ModalBackdrop
        open={!!newVersionOpen}
        onClose={() => setNewVersionOpen(null)}
        title={isFr ? "Nouvelle version" : "New Version"}
        subtitle={isFr ? "Paramètres de calcul pour cette version" : "Calculation parameters for this version"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Seuil" : "Pass Mark"}</label>
              <input
                type="number"
                value={versionForm.passMark}
                onChange={(e) => setVersionForm({ ...versionForm, passMark: Number(e.target.value) })}
                step="0.5"
                className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Précision" : "Precision"}</label>
              <input
                type="number"
                value={versionForm.decimalPrecision}
                onChange={(e) => setVersionForm({ ...versionForm, decimalPrecision: Number(e.target.value) })}
                min="0"
                max="6"
                className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Règle" : "Rounding"}</label>
              <div className="relative">
                <select
                  value={versionForm.roundingRule}
                  onChange={(e) => setVersionForm({ ...versionForm, roundingRule: e.target.value })}
                  className="w-full h-10 pl-3 pr-8 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
                >
                  {Object.entries(ROUNDING_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setNewVersionOpen(null)} className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              {isFr ? "Annuler" : "Cancel"}
            </button>
            <button
              onClick={() => handleCreateVersion(newVersionOpen)}
              disabled={saving}
              className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{ background: pc }}
            >
              {saving ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isFr ? "Création..." : "Creating..."}</>
              ) : (
                <>{isFr ? "Créer la version" : "Create Version"}</>
              )}
            </button>
          </div>
        </div>
      </ModalBackdrop>

      {/* ════════════════════════════════════════ */}
      {/* MODAL: New Mention Threshold Set */}
      {/* ════════════════════════════════════════ */}
      <ModalBackdrop
        open={newMentionSetOpen}
        onClose={() => setNewMentionSetOpen(false)}
        title={isFr ? "Nouvel ensemble de mentions" : "New Threshold Set"}
        subtitle={isFr ? "Liez un système éducatif à un barème" : "Link an education system to a grading scale"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Système éducatif *" : "Education System *"}</label>
            <div className="relative">
              <select
                value={mentionSetForm.educationSystemId}
                onChange={(e) => setMentionSetForm({ ...mentionSetForm, educationSystemId: e.target.value })}
                className="w-full h-10 pl-3 pr-8 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
              >
                <option value="">{isFr ? "Choisir..." : "Choose..."}</option>
                {educationSystems.map((sys) => (
                  <option key={sys.education_system_id} value={sys.education_system_id}>
                    {sys.code} — {isFr ? sys.name_fr : sys.name_en}
                  </option>
                ))}
              </select>
              <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Barème *" : "Grading Scale *"}</label>
            <div className="relative">
              <select
                value={mentionSetForm.gradingScaleId}
                onChange={(e) => setMentionSetForm({ ...mentionSetForm, gradingScaleId: e.target.value })}
                className="w-full h-10 pl-3 pr-8 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
              >
                <option value="">{isFr ? "Choisir..." : "Choose..."}</option>
                {gradingScales.map((s) => (
                  <option key={s.grading_scale_id} value={s.grading_scale_id}>{s.name} ({s.min_value}–{s.max_value})</option>
                ))}
              </select>
              <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setNewMentionSetOpen(false)} className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              {isFr ? "Annuler" : "Cancel"}
            </button>
            <button
              onClick={handleCreateMentionSet}
              disabled={saving}
              className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{ background: pc }}
            >
              {saving ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isFr ? "Création..." : "Creating..."}</>
              ) : (
                <>{isFr ? "Créer" : "Create"}</>
              )}
            </button>
          </div>
        </div>
      </ModalBackdrop>

      {/* ════════════════════════════════════════ */}
      {/* MODAL: New Mention Threshold */}
      {/* ════════════════════════════════════════ */}
      <ModalBackdrop
        open={!!newThresholdOpen}
        onClose={() => setNewThresholdOpen(null)}
        title={isFr ? "Ajouter un seuil de mention" : "Add Mention Threshold"}
        subtitle={isFr ? "Définissez une plage de notes et son libellé" : "Define a score range and its label"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Note min" : "Min score"}</label>
              <input
                type="number"
                value={thresholdForm.minValue}
                onChange={(e) => setThresholdForm({ ...thresholdForm, minValue: Number(e.target.value) })}
                step="0.5"
                className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Note max" : "Max score"}</label>
              <input
                type="number"
                value={thresholdForm.maxValue}
                onChange={(e) => setThresholdForm({ ...thresholdForm, maxValue: Number(e.target.value) })}
                step="0.5"
                className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Libellé (FR) *" : "Label (FR) *"}</label>
            <input
              type="text"
              value={thresholdForm.mentionLabelFr}
              onChange={(e) => setThresholdForm({ ...thresholdForm, mentionLabelFr: e.target.value })}
              placeholder={isFr ? "Ex: Très bien" : "E.g. Très bien"}
              className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">{isFr ? "Libellé (EN) *" : "Label (EN) *"}</label>
            <input
              type="text"
              value={thresholdForm.mentionLabelEn}
              onChange={(e) => setThresholdForm({ ...thresholdForm, mentionLabelEn: e.target.value })}
              placeholder={isFr ? "E.g. Very Good" : "E.g. Very Good"}
              className="w-full h-10 px-3.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-colors"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setNewThresholdOpen(null)} className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              {isFr ? "Annuler" : "Cancel"}
            </button>
            <button
              onClick={() => handleCreateThreshold(newThresholdOpen)}
              disabled={saving || !thresholdForm.mentionLabelFr.trim() || !thresholdForm.mentionLabelEn.trim()}
              className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{ background: pc }}
            >
              {saving ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isFr ? "Ajout..." : "Adding..."}</>
              ) : (
                <>{isFr ? "Ajouter" : "Add"}</>
              )}
            </button>
          </div>
        </div>
      </ModalBackdrop>
    </div>
  );
}
