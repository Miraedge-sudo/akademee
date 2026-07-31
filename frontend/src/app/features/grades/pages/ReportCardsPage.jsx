/**
 * ReportCardsPage — Admin report card management interface.
 *
 * Features:
 *  - List existing report cards with filtering (class, period, status)
 *  - Generate individual report cards (student + period)
 *  - Batch generation (entire class + period)
 *  - View JSON payload for any report card
 *  - Status management: Publish, Revise, Lock
 *  - Score color coding & contextual status badges
 *
 * Route: /dashboard/report-cards
 * Backend: /api/v1/report-cards
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTheme } from "../../../core/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { getClasses } from "../../../core/api/classService";
import { getStudents } from "../../../core/api/studentService";
import periodService from "../../../core/api/periodService";
import sequencesService from "../../../core/api/sequencesService";
import { listEducationSystems } from "../../../core/api/gradingService";
import {
  listReportCards,
  generateReportCard,
  getReportCardPayload,
  publishReportCard,
  reviseReportCard,
  lockReportCard,
  unlockReportCard,
  deleteReportCard,
  enqueueBatchJob,
  subscribeToJobProgress,
  downloadReportCardPdf,
  startReportCardExport,
  subscribeToExportProgress,
  downloadExportFile,
  saveBlobAs,
} from "../../../core/api/reportCardsService";
import toast from "react-hot-toast";
import {
  FiFileText,
  FiPlus,
  FiUsers,
  FiSearch,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiEye,
  FiSend,
  FiLock,
  FiUnlock,
  FiRefreshCw,
  FiDownload,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiBookmark,
  FiTrash2,
  FiCalendar,
  FiLayers,
  FiUserCheck,
  FiZap,
  FiLoader,
} from "react-icons/fi";
import PageLoader from "../../../components/ui/PageLoader";
import TableSkeleton from "../../../components/ui/TableSkeleton";
import StatsSkeleton from "../../../components/ui/StatsSkeleton";
import BulletinTemplate from "../../../components/ui/BulletinTemplate";
import ReportCardGenerationAnimation from "../../../components/ui/ReportCardGenerationAnimation";
import JobsDashboard from "../components/JobsDashboard";

// ── Status config ──
const STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "#9CA3AF", bg: "rgba(156,163,175,0.1)" },
  COMPLETE: { label: "Complete", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  PUBLISHED: { label: "Published", color: "#1D9E75", bg: "rgba(29,158,117,0.1)" },
  LOCKED: { label: "Locked", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  REVISED: { label: "Revised", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  ARCHIVED: { label: "Archived", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

// ── Score helpers ──
function scoreColor(score) {
  const pct = (score / 20) * 100;
  if (pct >= 60) return "#1D9E75";
  if (pct >= 40) return "#F59E0B";
  return "#EF4444";
}

// ── Education system color mapping ──
const EDU_SYSTEM_COLORS = {
  ANG_GEN: "#1B4F72",
  FR_GEN: "#1B6B3C",
  ANG_TECH: "#B5651D",
  FR_TECH: "#8B6914",
  UNIV: "#5B2C6F",
};
function getEduSystemColor(code) {
  return EDU_SYSTEM_COLORS[code] || "#6B7280";
}

// ── Modal backdrop ──
function ModalBackdrop({ open, onClose, title, subtitle, children, width = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full ${width} max-h-[85vh] overflow-y-auto border border-surface-100 dark:border-surface-700`}>
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

export default function ReportCardsPage() {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const pc = primaryColor || "#085041";
  const isFr = i18n.language === "fr";

  // ── Data state ──
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [reportCards, setReportCards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [students, setStudents] = useState([]);

  // ── Filters ──
  const [filterClassId, setFilterClassId] = useState("");
  const [filterPeriodId, setFilterPeriodId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEduSystem, setFilterEduSystem] = useState("");
  const [educationSystems, setEducationSystems] = useState([]);

  // ── Action modals ──
  const [genStudentOpen, setGenStudentOpen] = useState(false);
  const [genBatchOpen, setGenBatchOpen] = useState(false);
  const [payloadModal, setPayloadModal] = useState(null); // report card object
  const [payloadData, setPayloadData] = useState(null);
  const [payloadLoading, setPayloadLoading] = useState(false);

  // ── Form states ──
  const [genStudentId, setGenStudentId] = useState("");
  const [genStudentSearch, setGenStudentSearch] = useState("");
  const [genPeriodId, setGenPeriodId] = useState("");
  const [genSequenceId, setGenSequenceId] = useState("");
  const [genSequences, setGenSequences] = useState([]);
  const [genEduSystem, setGenEduSystem] = useState("");
  const [genClassId, setGenClassId] = useState("");
  const [genBatchPeriodId, setGenBatchPeriodId] = useState("");
  const [genBatchSequenceId, setGenBatchSequenceId] = useState("");
  const [genBatchSequences, setGenBatchSequences] = useState([]);
  const [genBatchEduSystem, setGenBatchEduSystem] = useState("");

  // ── Education system for selected class/student ──
  const selectedClass = classes.find(c => c.id === genClassId);
  const selectedStudentClass = genStudentId
    ? classes.find(c => c.id === students.find(s => (s.id === genStudentId))?.classId)
    : null;

  // ── Mapping onboarding system names → DB codes ──
  const ONBOARDING_TO_DB_CODE = {
    'francophone_general': 'FR_GEN',
    'anglophone_general': 'ANG_GEN',
    'francophone_technical': 'FR_TECH',
    'anglophone_technical': 'ANG_TECH',
    'university': 'UNIV',
  };

  // ── Education systems available for the school ──
  // Filters by the school's selected systems from onboarding
  const schoolEduSystems = (() => {
    // Get the school's onboarding system names
    const schoolSystems = user?.school?.educationalSystems || [];
    const allowedCodes = new Set(
      schoolSystems
        .map(s => ONBOARDING_TO_DB_CODE[s] || null)
        .filter(Boolean)
    );

    // Build list from ALL education systems, filtered by allowed codes
    const allSystems = educationSystems.map(sys => ({
      code: sys.code,
      name: sys.name_en || sys.name_fr || sys.code,
    })).filter(sys => sys.code);

    if (allowedCodes.size > 0) {
      return allSystems.filter(sys => allowedCodes.has(sys.code));
    }
    // Fallback: if no school systems found, return empty so admin knows to configure
    return [];
  })();
  const [generating, setGenerating] = useState(false);
  const [genDismissed, setGenDismissed] = useState(false);

  // ── Revise modal ──
  const [reviseModal, setReviseModal] = useState(null);
  const [reviseReason, setReviseReason] = useState("");

  // ── Delete confirmation ──
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(null); // { done, total } during batch delete

  // ── Batch selection ──
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);

  // ── Batch generation progress ──
  const [batchProgress, setBatchProgress] = useState(null); // { current, total } or null
  const jobSubscriptionRef = useRef(null);

  // ── Group ZIP export: background job + real SSE progress ──
  const [exportingGroup, setExportingGroup] = useState(false);
  const [exportProgress, setExportProgress] = useState(null); // { exportId, current, total, status }
  const exportSubRef = useRef(null);

  // ── Accordion state for grouped view ──
  const [expandedEduSystems, setExpandedEduSystems] = useState(new Set());
  const [expandedClasses, setExpandedClasses] = useState(new Set());

  // ── Load initial data ──
  const loadInitial = useCallback(async () => {
    try {
      const [classesData, periodsData, eduSystems] = await Promise.all([
        getClasses().catch(() => []),
        periodService.list().catch(() => []),
        listEducationSystems().catch(() => []),
      ]);
      setClasses(Array.isArray(classesData) ? classesData : classesData?.classes || []);
      setPeriods(Array.isArray(periodsData) ? periodsData : []);
      setEducationSystems(Array.isArray(eduSystems) ? eduSystems : []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // ── Load report cards ──
  const loadReportCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterClassId) params.classLevelId = filterClassId;
      if (filterPeriodId) params.periodStructureId = filterPeriodId;
      if (filterStatus) params.status = filterStatus;
      if (filterEduSystem) params.educationSystemCode = filterEduSystem;
      const data = await listReportCards(params);
      setReportCards(Array.isArray(data) ? data : data?.reportCards || []);
    } catch (err) {
      console.error('[ReportCardList] Failed to load report cards:', err.response?.data || err.message || err);
      setReportCards([]);
    }
    setLoading(false);
  }, [filterClassId, filterPeriodId, filterStatus, filterEduSystem]);

  useEffect(() => { loadReportCards(); }, [loadReportCards]);

  // ── Clean up the active job / export SSE subscriptions on unmount ──
  useEffect(() => {
    return () => {
      if (jobSubscriptionRef.current) {
        jobSubscriptionRef.current();
        jobSubscriptionRef.current = null;
      }
      if (exportSubRef.current) {
        exportSubRef.current();
        exportSubRef.current = null;
      }
    };
  }, []);

  // ── Initial page load ──
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // ── Load students when gen student modal opens ──
  useEffect(() => {
    if (genStudentOpen) {
      getStudents({ limit: 500 })
        .then((data) => setStudents(Array.isArray(data) ? data : data?.students || []))
        .catch(() => setStudents([]));
    }
  }, [genStudentOpen]);

  // ── Load all sequences when student modal opens ──
  useEffect(() => {
    if (!genStudentOpen) return;
    sequencesService.list()
      .then(setGenSequences)
      .catch(() => setGenSequences([]));
  }, [genStudentOpen]);

  // ── Load all sequences when batch modal opens ──
  useEffect(() => {
    if (!genBatchOpen) return;
    sequencesService.list()
      .then(setGenBatchSequences)
      .catch(() => setGenBatchSequences([]));
  }, [genBatchOpen]);

  // ── Stats ──
  const totalCards = reportCards.length;
  const publishedCards = reportCards.filter((r) => r.status === "PUBLISHED").length;
  const draftCards = reportCards.filter((r) => r.status === "DRAFT").length;
  const lockedCards = reportCards.filter((r) => r.status === "LOCKED").length;

  // ── Group report cards by education system → class ──
  const groupedCards = useMemo(() => {
    const map = {};
    for (const rc of reportCards) {
      const eduCode = rc.education_system_code || 'OTHER';
      const classId = rc.class_id || 'unassigned';
      const className = rc.class_name || (isFr ? 'Sans classe' : 'No class');
      const eduLabel = rc.education_system_label || eduCode;
      if (!map[eduCode]) {
        map[eduCode] = { code: eduCode, label: eduLabel, color: getEduSystemColor(eduCode), classes: {} };
      }
      if (!map[eduCode].classes[classId]) {
        map[eduCode].classes[classId] = { id: classId, name: className, cards: [] };
      }
      map[eduCode].classes[classId].cards.push(rc);
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => a.label.localeCompare(b.label))
      .map(([, group]) => ({
        ...group,
        classList: Object.entries(group.classes)
          .sort(([, a], [, b]) => a.name.localeCompare(b.name))
          .map(([, cls]) => ({
            ...cls,
            cards: [...cls.cards].sort((a, b) => (a.student_name || '').localeCompare(b.student_name || '')),
          })),
      }));
  }, [reportCards, isFr]);

  // ── Toggle expand for education system / class ──
  const toggleEduSystem = (code) => {
    const next = new Set(expandedEduSystems);
    if (next.has(code)) next.delete(code); else next.add(code);
    setExpandedEduSystems(next);
  };
  const toggleClass = (classId) => {
    const next = new Set(expandedClasses);
    if (next.has(classId)) next.delete(classId); else next.add(classId);
    setExpandedClasses(next);
  };

  // ── Generate individual (uses sequence ID as periodStructureId) ──
  const handleGenerateStudent = async () => {
    const periodId = genSequenceId || genPeriodId;
    if (!genEduSystem) {
      toast.error(isFr ? "Sélectionnez d'abord un système éducatif" : "First select an education system");
      return;
    }
    if (!genStudentId || !periodId) {
      toast.error(isFr ? "Sélectionnez un étudiant et une période ou séquence" : "Select a student and a period or sequence");
      return;
    }
    setGenerating(true);
    setGenDismissed(false);
    setBatchProgress(null);
    try {
      const result = await generateReportCard({
        studentId: genStudentId,
        periodStructureId: periodId,
        educationSystemCode: genEduSystem,
      });
      // Show completion briefly before dismissing
      setBatchProgress({ current: 1, total: 1 });
      await new Promise(resolve => setTimeout(resolve, 1800));
      toast.success(isFr ? "Bulletin généré !" : "Report card generated!");
      setGenStudentOpen(false);
      setGenStudentId("");
      setGenPeriodId("");
      setGenSequenceId("");
      setGenSequences([]);
      // Don't reset batchProgress to null — let it stay at 100%
      // so the completion animation remains visible until generating=false hides it
      loadReportCards();
    } catch (err) {
      console.error('[ReportCardGeneration] Individual generation failed:', err);
      toast.error(err.response?.data?.message || err.message || (isFr ? "Échec de la génération" : "Generation failed"));
      setBatchProgress(null);
    }
    setGenerating(false);
  };

  // ── Generate batch (uses sequence ID as periodStructureId) ──
  // Enqueues a background job via BullMQ, keeps the full-screen animation
  // visible and drives its progress bar from the job's real SSE stream.
  // The animation disappears when the job completes (or errors), and can be
  // closed early with the ✕ button.
  const handleGenerateBatch = async () => {
    const periodId = genBatchSequenceId || genBatchPeriodId;
    if (!genBatchEduSystem) {
      toast.error(isFr ? "Sélectionnez d'abord un système éducatif" : "First select an education system");
      return;
    }
    if (!genClassId || !periodId) {
      toast.error(isFr ? "Sélectionnez une classe et une période ou séquence" : "Select a class and a period or sequence");
      return;
    }
    setGenerating(true);
    setGenDismissed(false);
    setBatchProgress({ current: 0, total: 0 });
    try {
      console.log('[ReportCardGeneration] Enqueueing batch job:', { classLevelId: genClassId, periodStructureId: periodId, educationSystemCode: genBatchEduSystem });
      const job = await enqueueBatchJob({
        classLevelId: genClassId,
        periodStructureId: periodId,
        educationSystemCode: genBatchEduSystem,
      });
      console.log('[ReportCardGeneration] Job queued:', job);

      // Close the modal immediately — the job runs in the background
      setGenBatchOpen(false);
      setGenClassId("");
      setGenBatchPeriodId("");
      setGenBatchSequenceId("");
      setGenBatchSequences([]);

      const jobId = job?.jobId;
      const totalStudents = job?.totalStudents || 0;

      if (!jobId) {
        // No job id — nothing to track, hide the animation right away
        toast.success(
          isFr
            ? "Génération lancée en arrière-plan."
            : "Generation started in background."
        );
        setGenerating(false);
        setBatchProgress(null);
        loadReportCards();
        return;
      }

      toast.success(
        isFr
          ? "Génération lancée — l'animation suit la progression du job."
          : "Generation started — the animation tracks the job progress."
      );

      // Keep the animation visible and drive it from the job's real SSE
      // progress. `generating` stays true until the job completes/errors, so
      // the overlay never disappears prematurely.
      if (jobSubscriptionRef.current) {
        jobSubscriptionRef.current(); // clean up a previous subscription if any
        jobSubscriptionRef.current = null;
      }
      jobSubscriptionRef.current = subscribeToJobProgress(
        jobId,
        (progress) => {
          // progress: { type:'progress', status, current, total, failed }
          if (progress && progress.current != null && progress.total != null) {
            setBatchProgress({ current: progress.current, total: progress.total });
          }
        },
        (complete) => {
          // Job finished — COMPLETED / FAILED / CANCELLED
          const succeeded = complete?.status === 'COMPLETED';
          if (succeeded) {
            // Show 100% and let the success ✓ animation play before hiding
            setBatchProgress({ current: totalStudents, total: totalStudents });
            setTimeout(() => {
              setGenerating(false);
              setGenDismissed(false);
              loadReportCards();
            }, 2200);
          } else {
            const failed = complete?.errors?.length || 0;
            toast.error(
              isFr
                ? `Génération terminée avec ${failed} échec(s).`
                : `Generation finished with ${failed} failure(s).`
            );
            setGenerating(false);
            setBatchProgress(null);
            loadReportCards();
          }
        },
        (error) => {
          console.error('[ReportCardGeneration] Job progress stream error:', error);
          setGenerating(false);
          setBatchProgress(null);
          loadReportCards();
        }
      );
    } catch (err) {
      console.error('[ReportCardGeneration] Batch job enqueue failed:', err);
      toast.error(err.response?.data?.message || err.message || (isFr ? "Échec du lancement de la génération" : "Failed to start generation"));
      setGenerating(false);
      setBatchProgress(null);
    }
    // The JobsDashboard below polls /api/v1/report-card-jobs automatically
    // and subscribes via SSE for live progress.
  };

  // ── View payload ──
  const handleViewPayload = async (reportCard) => {
    setPayloadModal(reportCard);
    setPayloadData(null);
    setPayloadLoading(true);
    try {
      const data = await getReportCardPayload(reportCard.report_card_id);
      setPayloadData(data);
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec du chargement" : "Failed to load payload"));
    }
    setPayloadLoading(false);
  };

  // ── Publish ──
  const handlePublish = async (reportCard) => {
    try {
      await publishReportCard(reportCard.report_card_id);
      toast.success(isFr ? "Bulletin publié !" : "Report card published!");
      loadReportCards();
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec de la publication" : "Publish failed"));
    }
  };

  // ── Revise ──
  const handleReviseConfirm = async () => {
    if (!reviseModal || !reviseReason.trim()) {
      toast.error(isFr ? "Veuillez fournir une raison" : "Please provide a reason");
      return;
    }
    try {
      await reviseReportCard(reviseModal.report_card_id, reviseReason.trim());
      toast.success(isFr ? "Bulletin révisé !" : "Report card revised!");
      setReviseModal(null);
      setReviseReason("");
      loadReportCards();
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec de la révision" : "Revision failed"));
    }
  };

  // ── Lock ──
  const handleLock = async (reportCard) => {
    try {
      await lockReportCard(reportCard.report_card_id);
      toast.success(isFr ? "Bulletin verrouillé !" : "Report card locked!");
      loadReportCards();
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec du verrouillage" : "Lock failed"));
    }
  };

  // ── Unlock ──
  const handleUnlock = async (reportCard) => {
    try {
      await unlockReportCard(reportCard.report_card_id);
      toast.success(isFr ? "Bulletin déverrouillé !" : "Report card unlocked!");
      loadReportCards();
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec du déverrouillage" : "Unlock failed"));
    }
  };

  // ── Delete confirmation ──
  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    if (deleteModal.batch) {
      // Batch delete
      await handleBatchDeleteConfirm();
      return;
    }
    setDeleting(true);
    try {
      await deleteReportCard(deleteModal.report_card_id);
      toast.success(isFr ? "Bulletin supprimé !" : "Report card deleted!");
      loadReportCards();
      setDeleting(false);
      setDeleteModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec de la suppression" : "Delete failed"));
      setDeleting(false);
    }
  };

  // ── Batch selection handlers ──
  const allIds = reportCards.map(rc => rc.report_card_id);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (allSelected) { setSelectedIds(new Set()); }
    else { setSelectedIds(new Set(allIds)); }
  };

  const handleBatchAction = async (actionName, actionFn, successMsg) => {
    if (selectedIds.size === 0) return;
    setBatchProcessing(true);
    let successCount = 0;
    let failCount = 0;
    for (const id of selectedIds) {
      try {
        await actionFn(id);
        successCount++;
      } catch {
        failCount++;
      }
    }
    toast.success(`${successCount} ${successMsg}` + (failCount > 0 ? `, ${failCount} ${isFr ? "échec(s)" : "failed"}` : ''));
    setSelectedIds(new Set());
    setBatchProcessing(false);
    loadReportCards();
  };

  const handleBatchPublish = () => handleBatchAction(
    'publish',
    (id) => publishReportCard(id),
    isFr ? 'bulletins publiés' : 'report cards published'
  );

  const handleBatchLock = () => handleBatchAction(
    'lock',
    (id) => lockReportCard(id),
    isFr ? 'bulletins verrouillés' : 'report cards locked'
  );

  const handleBatchDeleteConfirm = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBatchProcessing(true);
    setDeleting(true);
    setDeleteProgress({ done: 0, total: ids.length });
    let successCount = 0;
    let failCount = 0;
    try {
      for (const id of ids) {
        try {
          await deleteReportCard(id);
          successCount++;
        } catch {
          failCount++;
        }
        setDeleteProgress({ done: successCount + failCount, total: ids.length });
      }
      toast.success(`${successCount} ${isFr ? 'bulletins supprimés' : 'report cards deleted'}` + (failCount > 0 ? `, ${failCount} ${isFr ? "échec(s)" : "failed"}` : ''));
    } finally {
      setSelectedIds(new Set());
      setBatchProcessing(false);
      setDeleting(false);
      setDeleteProgress(null);
      setDeleteModal(null);
      loadReportCards();
    }
  };

  // ── Download PDF (server-rendered, deterministic, real pagination) ──
  const handleDownloadPDF = async () => {
    if (!payloadData) return;
    try {
      const studentName = (payloadData?.student?.full_name || "report-card").replace(/[^a-zA-Z0-9]/g, "-");
      const { blob, filename } = await downloadReportCardPdf(payloadData.report_card_id, "EN", studentName);
      saveBlobAs(blob, filename);
      toast.success(isFr ? "PDF téléchargé !" : "PDF downloaded!");
    } catch (err) {
      console.error("[ReportCardPdf] Server-side PDF download failed:", err);
      toast.error(err.response?.data?.message || (isFr ? "Échec du téléchargement PDF" : "PDF download failed"));
    }
  };

  // ── Download ALL report cards of a group (education system or class) ──
  // Three phases, mirroring the background job flow:
  //   1. startReportCardExport → { exportId, total }
  //   2. subscribeToExportProgress → real SSE progress (current/total)
  //   3. downloadExportFile → saves the finished ZIP once complete
  const handleExportGroup = async (cards, label, filters = {}) => {
    if (!cards || cards.length === 0) {
      toast.error(isFr ? "Aucun bulletin à télécharger" : "No report cards to download");
      return;
    }
    const safeName = (label || "bulletins").replace(/[^a-zA-Z0-9_-]/g, "-");
    setExportingGroup(true);
    try {
      const { exportId, total } = await startReportCardExport({
        ids: cards.map((c) => c.report_card_id),
        lang: "EN",
        ...filters,
      });
      setExportProgress({ exportId, current: 0, total, status: "RUNNING" });

      // Clean up any previous export subscription
      if (exportSubRef.current) {
        exportSubRef.current();
        exportSubRef.current = null;
      }

      exportSubRef.current = subscribeToExportProgress(
        exportId,
        (progress) => {
          // progress: { type:'progress', status, current, total }
          setExportProgress((prev) => (prev
            ? {
                ...prev,
                current: progress.current ?? prev.current,
                total: progress.total ?? prev.total,
                status: progress.status || prev.status,
              }
            : prev));
        },
        async (complete) => {
          exportSubRef.current = null;
          if (complete?.status === "COMPLETED") {
            try {
              const { blob, filename } = await downloadExportFile(exportId, safeName);
              saveBlobAs(blob, filename);
              toast.success(isFr ? `ZIP téléchargé (${total} bulletin(s)) !` : `ZIP downloaded (${total} card(s))!`);
            } catch (dlErr) {
              toast.error(dlErr.response?.data?.message || (isFr ? "Échec du téléchargement ZIP" : "ZIP download failed"));
            }
          } else {
            toast.error(complete?.errors?.[0]?.error || (isFr ? "Échec de la préparation du ZIP" : "ZIP preparation failed"));
          }
          setExportProgress(null);
          setExportingGroup(false);
        },
        (error) => {
          exportSubRef.current = null;
          console.error("[ReportCardZip] Export progress stream error:", error);
          toast.error(isFr ? "Échec du suivi de l'export" : "Export progress stream failed");
          setExportProgress(null);
          setExportingGroup(false);
        }
      );
    } catch (err) {
      console.error("[ReportCardZip] Group ZIP export failed:", err);
      toast.error(err.response?.data?.message || (isFr ? "Échec du téléchargement ZIP" : "ZIP download failed"));
      setExportingGroup(false);
    }
  };

  // ── Cancel the ongoing ZIP export (hide the progress bar; the server
  // finishes in the background and its in-memory record expires via TTL) ──
  const handleCancelExport = () => {
    if (exportSubRef.current) {
      exportSubRef.current();
      exportSubRef.current = null;
    }
    setExportProgress(null);
    setExportingGroup(false);
  };

  // ── Status badge ──
  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {status === "PUBLISHED" && <FiCheckCircle size={11} />}
        {status === "DRAFT" && <FiClock size={11} />}
        {status === "LOCKED" && <FiLock size={11} />}
        {status === "COMPLETE" && <FiCheckCircle size={11} />}
        {status === "REVISED" && <FiRefreshCw size={11} />}
        {cfg.label}
      </span>
    );
  };

  // ── Determine which actions are available based on status ──
  const allowedActions = (status) => {
    const acts = [];
    if (["DRAFT", "COMPLETE"].includes(status)) {
      acts.push("publish");
    }
    if (["DRAFT", "COMPLETE"].includes(status)) {
      acts.push("lock");
    }
    if (status === "LOCKED") {
      acts.push("unlock");
    }
    if (["PUBLISHED", "LOCKED"].includes(status)) {
      acts.push("revise");
    }
    if (["DRAFT", "COMPLETE", "LOCKED"].includes(status)) {
      acts.push("delete");
    }
    acts.push("view");
    return acts;
  };

  // ── Render ──
  if (pageLoading) {
    return <PageLoader lang={i18n.language} message={isFr ? "Chargement en cours..." : "Loading..."} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <style>{`
        @keyframes rcFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rc-fade { animation: rcFadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
        @keyframes rcSlideIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .rc-modal { animation: rcSlideIn 0.25s cubic-bezier(.16,1,.3,1); }
        @keyframes exportBarIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Print Styles ── */
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .fixed.inset-0 { position: static !important; }
          .absolute.inset-0.bg-black\/40 { display: none !important; }
          .max-h-\[85vh\] {
            max-height: none !important;
            overflow: visible !important;
          }
          #report-card-payload {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            max-height: none !important;
            width: 100% !important;
          }
          #report-card-payload * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          #report-card-payload button,
          #report-card-payload .no-print { display: none !important; }
          #report-card-payload .print-only { display: block !important; }
          .print-break-inside { page-break-inside: avoid; break-inside: avoid; }
          .print-break-after { page-break-after: always; break-after: page; }
          /* Hide everything outside the payload on print */
          .main-content > *:not(#report-card-payload):not(.fixed) { display: none !important; }
          /* Ensure colors are preserved in tables */
          #report-card-payload .divide-y > * { border-bottom: 1px solid #e5e7eb !important; }
          #report-card-payload [class*="bg-surface-50"] { background: #f9fafb !important; }
          #report-card-payload [class*="bg-green-100"] { background: #d1fae5 !important; }
          #report-card-payload [class*="bg-red-100"] { background: #fee2e2 !important; }
          #report-card-payload [class*="text-green-800"] { color: #065f46 !important; }
          #report-card-payload [class*="text-red-800"] { color: #991b1b !important; }
          #report-card-payload [class*="border-surface-200"] { border-color: #e5e7eb !important; }
          #report-card-payload [class*="text-surface"] { color: #374151 !important; }
          /* Font adjustments for print */
          #report-card-payload { font-size: 11pt !important; line-height: 1.4 !important; }
          #report-card-payload h2 { font-size: 16pt !important; }
          #report-card-payload .font-extrabold { font-weight: 900 !important; }
          /* Ensure grid displays correctly */
          #report-card-payload .grid { display: grid !important; }
          #report-card-payload .lg\:hidden { display: block !important; }
          @page {
            size: A4 portrait;
            margin: 15mm 12mm;
          }
        }
      `}</style>

      {/* ── Hero header ── */}
      <div
        className="rc-fade relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <FiFileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight">
                {t("reportCards.title", "Report Cards")}
              </h1>
              <p className="text-white/70 text-sm">
                {isFr ? "Générez et gérez les bulletins scolaires" : "Generate and manage student report cards"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="rc-fade grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ animationDelay: "0.04s" }}>
        {[
          { icon: FiFileText, value: totalCards, label: isFr ? "Total bulletins" : "Total report cards", color: "#3B82F6" },
          { icon: FiClock, value: draftCards, label: isFr ? "Brouillons" : "Drafts", color: "#9CA3AF" },
          { icon: FiCheckCircle, value: publishedCards, label: isFr ? "Publiés" : "Published", color: "#1D9E75" },
          { icon: FiLock, value: lockedCards, label: isFr ? "Verrouillés" : "Locked", color: "#F59E0B" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-800 rounded-xl border-[1.5px] border-surface-100 dark:border-surface-700 p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}15` }}>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-[18px] font-extrabold text-surface-900 dark:text-surface-100">{stat.value}</div>
                <div className="text-[11px] text-surface-400">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Actions & Filters bar (redesigned) ── */}
      <div className="rc-fade bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden" style={{ animationDelay: "0.06s" }}>
        {/* Top: Action buttons */}
        <div className="px-4 pt-4 pb-2 sm:pb-0 sm:pr-4 sm:pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setGenStudentOpen(true)}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md flex items-center gap-1.5 shadow-sm"
              style={{ background: pc }}
            >
              <FiPlus size={13} />
              {isFr ? "Générer pour un élève" : "Generate for Student"}
            </button>
            <button
              onClick={() => setGenBatchOpen(true)}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md flex items-center gap-1.5 shadow-sm"
              style={{ background: pc }}
            >
              <FiUsers size={13} />
              {isFr ? "Générer pour une classe" : "Generate for Class"}
            </button>
          </div>
        </div>

        {/* Bottom: Filters */}
        <div className="px-4 pb-4 pt-3 sm:pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Filter label + active count */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                {isFr ? "Filtrer par" : "Filter by"}
              </span>
              {(
                filterStatus || filterClassId || filterPeriodId || filterEduSystem
              ) ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc }} />
                  <span className="text-[11px] text-surface-500">
                    {[filterStatus, filterClassId, filterPeriodId, filterEduSystem].filter(Boolean).length} {isFr ? "filtre(s) actif(s)" : "filter(s) active"}
                  </span>
                </>
              ) : null}
            </div>

            {/* Filter selects row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status filter */}
              <div className="relative group">
                {filterStatus && (
                  <div className="absolute -top-1.5 -right-1.5 z-10 w-3 h-3 rounded-full border-2 border-white dark:border-surface-800" style={{ background: STATUS_CONFIG[filterStatus]?.color || pc }} />
                )}
                <div className="flex items-center gap-2 h-9 px-3 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-lg transition-all group-                    hover:border-surface-300 dark:hover:border-surface-600 dark:group-hover:border-surface-600 focus-within:border-primary-400">
                  <FiClock size={13} className="text-surface-400 flex-shrink-0" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent text-[12px] text-surface-700 dark:text-surface-200 appearance-none cursor-pointer focus:outline-none min-w-[100px]"
                  >
                    <option value="">{isFr ? "Statut" : "Status"}</option>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                  <FiChevronDown size={12} className="text-surface-400 flex-shrink-0" />
                </div>
              </div>

              {/* Class filter */}
              <div className="relative group">
                {filterClassId && (
                  <div className="absolute -top-1.5 -right-1.5 z-10 w-3 h-3 rounded-full border-2 border-white dark:border-surface-800" style={{ background: pc }} />
                )}
                <div className="flex items-center gap-2 h-9 px-3 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-lg transition-all group-                    hover:border-surface-300 dark:hover:border-surface-600 dark:group-hover:border-surface-600 focus-within:border-primary-400">
                  <FiUsers size={13} className="text-surface-400 flex-shrink-0" />
                  <select
                    value={filterClassId}
                    onChange={(e) => setFilterClassId(e.target.value)}
                    className="bg-transparent text-[12px] text-surface-700 dark:text-surface-200 appearance-none cursor-pointer focus:outline-none min-w-[110px]"
                  >
                    <option value="">{isFr ? "Classe" : "Class"}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <FiChevronDown size={12} className="text-surface-400 flex-shrink-0" />
                </div>
              </div>

              {/* Period filter */}
              <div className="relative group">
                {filterPeriodId && (
                  <div className="absolute -top-1.5 -right-1.5 z-10 w-3 h-3 rounded-full border-2 border-white dark:border-surface-800" style={{ background: pc }} />
                )}
                <div className="flex items-center gap-2 h-9 px-3 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-lg transition-all group-                    hover:border-surface-300 dark:hover:border-surface-600 dark:group-hover:border-surface-600 focus-within:border-primary-400">
                  <FiCalendar size={13} className="text-surface-400 flex-shrink-0" />
                  <select
                    value={filterPeriodId}
                    onChange={(e) => setFilterPeriodId(e.target.value)}
                    className="bg-transparent text-[12px] text-surface-700 dark:text-surface-200 appearance-none cursor-pointer focus:outline-none min-w-[110px]"
                  >
                    <option value="">{isFr ? "Période" : "Period"}</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <FiChevronDown size={12} className="text-surface-400 flex-shrink-0" />
                </div>
              </div>
              {/* Education system filter */}
              <div className="relative group">
                {filterEduSystem && (
                  <div className="absolute -top-1.5 -right-1.5 z-10 w-3 h-3 rounded-full border-2 border-white dark:border-surface-800" style={{ background: getEduSystemColor(filterEduSystem) }} />
                )}
                <div className="flex items-center gap-2 h-9 px-3 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-lg transition-all group-                    hover:border-surface-300 dark:hover:border-surface-600 dark:group-hover:border-surface-600 focus-within:border-primary-400">
                  <FiBookmark size={13} className="text-surface-400 flex-shrink-0" />
                  <select
                    value={filterEduSystem}
                    onChange={(e) => setFilterEduSystem(e.target.value)}
                    className="bg-transparent text-[12px] text-surface-700 dark:text-surface-200 appearance-none cursor-pointer focus:outline-none min-w-[130px]"
                  >
                    <option value="">{isFr ? "Système" : "System"}</option>
                    {educationSystems.map((sys) => (
                      <option key={sys.code || sys.education_system_id} value={sys.code}>
                        {sys.name_en || sys.name_fr || sys.code}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown size={12} className="text-surface-400 flex-shrink-0" />
                </div>
              </div>

              {/* Clear all filters */}
              {(filterStatus || filterClassId || filterPeriodId || filterEduSystem) && (
                <button
                  onClick={() => { setFilterStatus(""); setFilterClassId(""); setFilterPeriodId(""); setFilterEduSystem(""); }}
                  className="h-9 w-9 rounded-lg flex items-center justify-center transition-all hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500"
                  title={isFr ? "Effacer les filtres" : "Clear filters"}
                >
                  <FiX size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Report Cards — Grouped by Education System & Class ── */}
      <div className="rc-fade" style={{ animationDelay: "0.08s" }}>
        <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : reportCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-4 border-2 border-dashed border-surface-200 dark:border-surface-600">
                <FiFileText size={28} className="text-surface-300" />
              </div>
              <h3 className="text-base font-semibold text-surface-700 dark:text-surface-200 mb-1">
                {isFr ? "Aucun bulletin" : "No report cards yet"}
              </h3>
              <p className="text-sm text-surface-400 max-w-sm">
                {isFr
                  ? "Générez des bulletins pour les élèves et les périodes ci-dessus."
                  : "Generate report cards for students and periods above."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {groupedCards.map((group, gi) => {
                const isEduOpen = expandedEduSystems.has(group.code);
                const totalInGroup = group.classList.reduce((s, c) => s + c.cards.length, 0);
                return (
                  <div key={group.code} className="rc-fade" style={{ animationDelay: `${0.05 + gi * 0.04}s` }}>
                    {/* ── Education System Header ── */}
                    <div className="w-full flex items-center gap-2 px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors">
                      <button
                        onClick={() => toggleEduSystem(group.code)}
                        className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
                      >
                        <div
                          className="w-1.5 h-8 rounded-full flex-shrink-0"
                          style={{ background: group.color }}
                        />
                        <FiChevronRight
                          size={16}
                          className={`text-surface-400 transition-transform duration-200 ${isEduOpen ? 'rotate-90' : ''}`}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] font-bold text-surface-900 dark:text-surface-100">
                            {group.label}
                          </span>
                          <span className="text-[11px] text-surface-400 ml-2">
                            {group.classList.length} {isFr ? 'classe(s)' : 'class(es)'} · {totalInGroup} {isFr ? 'bulletin(s)' : 'card(s)'}
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider flex-shrink-0"
                          style={{ background: `${group.color}18`, color: group.color }}
                        >
                          {group.code}
                        </span>
                      </button>
                      {/* Download all for this education system */}
                      <button
                        onClick={() => handleExportGroup(
                          group.classList.flatMap((c) => c.cards),
                          group.label,
                          group.code && group.code !== 'OTHER'
                            ? { educationSystemCode: group.code }
                            : {}
                        )}
                        disabled={exportingGroup}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-white/10 hover:text-white transition-all flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title={isFr
                          ? `Tout télécharger (${group.code})`
                          : `Download all (${group.code})`}
                      >
                        {exportingGroup ? <FiLoader size={14} className="animate-spin" /> : <FiDownload size={14} />}
                      </button>
                    </div>

                    {/* ── Classes within this Education System ── */}
                    {isEduOpen && (
                      <div className="border-t border-surface-100 dark:border-surface-700">
                        {group.classList.map((cls, ci) => {
                          const isClassOpen = expandedClasses.has(cls.id);
                          return (
                            <div key={cls.id}>
                              {/* Class Header */}
                              <div className="w-full flex items-center gap-2 px-5 py-2.5 pl-12 hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors">
                                <button
                                  onClick={() => toggleClass(cls.id)}
                                  className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
                                >
                                  <FiChevronRight
                                    size={13}
                                    className={`text-surface-400 transition-transform duration-200 ${isClassOpen ? 'rotate-90' : ''}`}
                                  />
                                  <span className="text-[12px] font-semibold text-surface-700 dark:text-surface-200">
                                    {cls.name}
                                  </span>
                                  <span className="text-[11px] text-surface-400">
                                    {cls.cards.length} {isFr ? 'élève(s)' : 'student(s)'}
                                  </span>
                                  {/* Mini status summary */}
                                  {(() => {
                                    const pub = cls.cards.filter(c => c.status === 'PUBLISHED').length;
                                    const drf = cls.cards.filter(c => c.status === 'DRAFT' || c.status === 'COMPLETE').length;
                                    return (
                                      <div className="flex items-center gap-1.5 ml-auto">
                                        {pub > 0 && (
                                          <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                                            {pub} {isFr ? 'pub.' : 'pub.'}
                                          </span>
                                        )}
                                        {drf > 0 && (
                                          <span className="text-[10px] font-semibold text-surface-400">
                                            {drf} {isFr ? 'br.' : 'drf.'}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </button>
                                {/* Download all report cards of this class */}
                                <button
                                  onClick={() => handleExportGroup(
                                  cls.cards,
                                  cls.name,
                                  cls.id && cls.id !== 'unassigned'
                                    ? { classLevelId: cls.id }
                                    : {}
                                )}
                                  disabled={exportingGroup}
                                  className="w-7 h-7 rounded-md flex items-center justify-center text-surface-400 hover:bg-white/10 hover:text-white transition-all flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                  title={isFr
                                    ? `Tout télécharger (${cls.name})`
                                    : `Download all (${cls.name})`}
                                >
                                  {exportingGroup ? <FiLoader size={12} className="animate-spin" /> : <FiDownload size={12} />}
                                </button>
                              </div>

                              {/* Student Report Card Rows */}
                              {isClassOpen && (
                                <div className="border-t border-surface-50 dark:border-surface-700/50">
                                  {/* Mini table header */}
                                  <div className="hidden lg:grid grid-cols-10 gap-2 px-5 py-2 pl-16 bg-surface-50/50 dark:bg-surface-900/20 text-[10px] font-semibold tracking-wider uppercase text-surface-400">
                                    <div className="col-span-1 flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={cls.cards.every(c => selectedIds.has(c.report_card_id))}
                                        onChange={() => {
                                          const allSelected = cls.cards.every(c => selectedIds.has(c.report_card_id));
                                          const next = new Set(selectedIds);
                                          for (const c of cls.cards) {
                                            if (allSelected) next.delete(c.report_card_id);
                                            else next.add(c.report_card_id);
                                          }
                                          setSelectedIds(next);
                                        }}
                                        className="w-3.5 h-3.5 cursor-pointer"
                                      />
                                    </div>
                                    <div className="col-span-2">{isFr ? 'Élève' : 'Student'}</div>
                                    <div className="col-span-2">{isFr ? 'Période' : 'Period'}</div>
                                    <div className="col-span-1">{isFr ? 'Statut' : 'Status'}</div>
                                    <div className="col-span-1 text-center">V.</div>
                                    <div className="col-span-1 text-center">{isFr ? 'Moy.' : 'Avg'}</div>
                                    <div className="col-span-1 text-center">{isFr ? 'Rang' : 'Rank'}</div>
                                    <div className="col-span-1 text-right">{isFr ? 'Actions' : 'Actions'}</div>
                                  </div>

                                  {cls.cards.map((rc, ri) => {
                                    const avg = rc.general_average != null ? Number(rc.general_average) : null;
                                    const avgColor = avg ? scoreColor(avg) : '#9CA3AF';
                                    const rankStr = rc.class_rank ? `${rc.class_rank}/${rc.class_size}` : '-';
                                    const actions = allowedActions(rc.status);
                                    return (
                                      <div
                                        key={rc.report_card_id}
                                        className="grid grid-cols-1 lg:grid-cols-10 gap-2 px-5 py-2.5 pl-16 hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors items-center"
                                        style={{
                                          background: selectedIds.has(rc.report_card_id)
                                            ? 'rgba(var(--primary-rgb, 8,80,65), 0.03)'
                                            : '',
                                        }}
                                      >
                                        {/* Checkbox */}
                                        <div className="lg:col-span-1 flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={selectedIds.has(rc.report_card_id)}
                                            onChange={() => toggleSelect(rc.report_card_id)}
                                            className="w-3.5 h-3.5 cursor-pointer"
                                          />
                                        </div>

                                        {/* Student name */}
                                        <div className="lg:col-span-2 flex items-center gap-2 min-w-0">
                                          <div className="w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-[8px] font-extrabold text-surface-500 dark:text-surface-400 flex-shrink-0">
                                            {(rc.student_name || 'NA').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                          </div>
                                          <span className="text-[12px] font-semibold text-surface-900 dark:text-surface-100 truncate">
                                            {rc.student_name || '-'}
                                          </span>
                                        </div>

                                        {/* Period */}
                                        <div className="hidden lg:block lg:col-span-2">
                                          <span className="text-[11px] text-surface-600 dark:text-surface-300">
                                            {rc.sequence_label || rc.period_name || '-'}
                                          </span>
                                        </div>

                                        {/* Status */}
                                        <div className="lg:col-span-1">
                                          <StatusBadge status={rc.status} />
                                        </div>

                                        {/* Version */}
                                        <div className="lg:col-span-1 text-center">
                                          <span className="text-[12px] font-mono text-surface-500">
                                            {rc.version || 1}
                                          </span>
                                        </div>

                                        {/* Average */}
                                        <div className="lg:col-span-1 text-center">
                                          {avg != null ? (
                                            <span className="text-[13px] font-extrabold tabular-nums" style={{ color: avgColor }}>
                                              {avg.toFixed(2)}
                                            </span>
                                          ) : (
                                            <span className="text-[11px] text-surface-400">-</span>
                                          )}
                                        </div>

                                        {/* Rank */}
                                        <div className="lg:col-span-1 text-center">
                                          <span className="text-[11px] text-surface-500 font-medium">
                                            {rc.class_rank != null ? rankStr : '-'}
                                          </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="lg:col-span-1 flex items-center justify-end gap-1">
                                          <button
                                            onClick={() => handleViewPayload(rc)}
                                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                                            title={isFr ? 'Voir' : 'View'}
                                          >
                                            <FiEye size={11} />
                                          </button>
                                          {actions.includes('publish') && (
                                            <button
                                              onClick={() => handlePublish(rc)}
                                              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-green-600"
                                              title={isFr ? 'Publier' : 'Publish'}
                                            >
                                              <FiSend size={10} />
                                            </button>
                                          )}
                                          {actions.includes('revise') && (
                                            <button
                                              onClick={() => setReviseModal(rc)}
                                              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-purple-600"
                                              title={isFr ? 'Réviser' : 'Revise'}
                                            >
                                              <FiRefreshCw size={10} />
                                            </button>
                                          )}
                                          {actions.includes('lock') && (
                                            <button
                                              onClick={() => handleLock(rc)}
                                              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-amber-600"
                                              title={isFr ? 'Verrouiller' : 'Lock'}
                                            >
                                              <FiLock size={10} />
                                            </button>
                                          )}
                                          {actions.includes('unlock') && (
                                            <button
                                              onClick={() => handleUnlock(rc)}
                                              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-blue-600"
                                              title={isFr ? 'Déverrouiller' : 'Unlock'}
                                            >
                                              <FiUnlock size={10} />
                                            </button>
                                          )}
                                          {actions.includes('delete') && (
                                            <button
                                              onClick={() => setDeleteModal(rc)}
                                              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-500"
                                              title={isFr ? 'Supprimer' : 'Delete'}
                                            >
                                              <FiTrash2 size={10} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Jobs Dashboard — Background Job Monitoring ── */}
      <JobsDashboard primaryColor={pc} />

      {/* ── Floating Batch Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="rc-fade fixed bottom-6 left-1/2 -translate-x-1/2 z-50" style={{ animationDelay: "0s" }}>
          <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-4 backdrop-blur-sm bg-white/95 dark:bg-surface-800/95">
            {/* Count */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${pc}15` }}>
                <FiCheckCircle size={14} style={{ color: pc }} />
              </div>
              <div>
                <span className="text-[13px] font-bold text-surface-900 dark:text-surface-100">{selectedIds.size}</span>
                <span className="text-[11px] text-surface-400 ml-1">{isFr ? "sélectionné(s)" : "selected"}</span>
              </div>
            </div>

            <div className="w-px h-8 bg-surface-100 dark:bg-surface-700" />

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchPublish}
                disabled={batchProcessing}
                className="h-8 px-3.5 rounded-lg text-[11px] font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                <FiSend size={12} />
                {isFr ? "Publier" : "Publish"}
              </button>
              <button
                onClick={handleBatchLock}
                disabled={batchProcessing}
                className="h-8 px-3.5 rounded-lg text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                <FiLock size={12} />
                {isFr ? "Verrouiller" : "Lock"}
              </button>
              <button
                onClick={() => setDeleteModal({ batch: true })}
                disabled={batchProcessing}
                className="h-8 px-3.5 rounded-lg text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                <FiTrash2 size={12} />
                {isFr ? "Supprimer" : "Delete"}
              </button>
            </div>

            <div className="w-px h-8 bg-surface-100 dark:bg-surface-700" />

            {/* Deselect */}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all"
              title={isFr ? "Désélectionner tout" : "Deselect all"}
            >
              <FiX size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: Generate for Student (redesigned) */}
      {/* ════════════════════════════════════════════ */}
      <ModalBackdrop
        open={genStudentOpen}
        onClose={() => { setGenStudentOpen(false); setGenStudentId(""); setGenStudentSearch(""); setGenPeriodId(""); setGenSequenceId(""); setGenSequences([]); setGenEduSystem(""); }}
        title={isFr ? "Générer un bulletin" : "Generate Report Card"}
        subtitle={isFr ? "Suivez les étapes pour générer le bulletin d'un élève" : "Follow the steps to generate a student report card"}
      >
        <div className="space-y-5">
          {/* ── Step 1: Education System Selection ── */}
          <div className={`p-4 rounded-xl border-[1.5px] transition-all ${
            genEduSystem ? 'border-primary-400 bg-primary-50/40 dark:bg-primary-900/15' : 'border-surface-100 dark:border-surface-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: genEduSystem ? 'var(--primary-color, #085041)' : '#9CA3AF' }}>
                {genEduSystem ? <FiCheckCircle size={12} /> : '1'}
              </div>
              <span className="text-[13px] font-bold text-surface-800 dark:text-surface-100">
                {isFr ? "Système éducatif" : "Education system"}
              </span>
              {genEduSystem && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{
                  background: getEduSystemColor(genEduSystem),
                  color: "#fff",
                  opacity: 0.9,
                }}>
                  {genEduSystem}
                </span>
              )}
            </div>
            <div className="relative">
              <FiBookmark size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <select
                value={genEduSystem}
                onChange={(e) => setGenEduSystem(e.target.value)}
                className="w-full h-11 pl-10 pr-9 bg-white dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-all hover:border-surface-300 dark:hover:border-surface-600"
              >
                <option value="">{isFr ? "Choisir le système..." : "Select system..."}</option>
                {schoolEduSystems.map((sys) => (
                  <option key={sys.code} value={sys.code}>
                    {sys.name}
                  </option>
                ))}
              </select>
              <FiChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>

          {/* ── Step 2: Student Selection ── */}
          <div className={`p-4 rounded-xl border-[1.5px] transition-all ${
            genStudentId ? 'border-primary-400 bg-primary-50/40 dark:bg-primary-900/15' : 'border-surface-100 dark:border-surface-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: genStudentId ? 'var(--primary-color, #085041)' : '#9CA3AF' }}>
                {genStudentId ? <FiCheckCircle size={12} /> : '2'}
              </div>
              <span className="text-[13px] font-bold text-surface-800 dark:text-surface-100">
                {isFr ? "Choisir un élève" : "Select a student"}
              </span>
            </div>                    {/* Search input */}
                    <div className="relative mb-2">
                      <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input
                        type="text"
                        value={genStudentSearch}
                        onChange={(e) => { setGenStudentSearch(e.target.value); setGenStudentId(""); }}
                        placeholder={isFr ? "Rechercher un élève..." : "Search a student..."}
                        className="w-full h-10 pl-10 pr-4 bg-white dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 focus:outline-none focus:border-primary-400 transition-all"
                      />
                    </div>
                    <div className="relative">
              <FiUserCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <select
                value={genStudentId}
                onChange={(e) => setGenStudentId(e.target.value)}
                className="w-full h-11 pl-10 pr-9 bg-white dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-all hover:border-surface-300 dark:hover:border-surface-600"
              >
                <option value="">{isFr ? "Sélectionnez un élève..." : "Select a student..."}</option>
                {students
                  .filter((s) => {
                    if (!genStudentSearch) return true;
                    const name = (s.fullName || s.first_name + " " + s.last_name || s.name || "").toLowerCase();
                    return name.includes(genStudentSearch.toLowerCase());
                  })
                  .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName || s.first_name + " " + s.last_name || s.name}
                    {(() => {
                      const sc = classes.find(c => c.id === s.classId);
                      return sc?.educationSystemCode ? ` (${sc.educationSystemCode})` : '';
                    })()}
                  </option>
                ))}
              </select>
              <FiChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>

          {/* ── Step 3: Sequence / Period ── */}
          <div className={`p-4 rounded-xl border-[1.5px] transition-all ${
            (genPeriodId || genSequenceId) ? 'border-primary-400 bg-primary-50/40 dark:bg-primary-900/15' : 'border-surface-100 dark:border-surface-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: (genPeriodId || genSequenceId) ? 'var(--primary-color, #085041)' : '#9CA3AF' }}>
                {(genPeriodId || genSequenceId) ? <FiCheckCircle size={12} /> : '3'}
              </div>
              <span className="text-[13px] font-bold text-surface-800 dark:text-surface-100">
                {isFr ? "Séquence / Période" : "Sequence / Period"}
              </span>
              {genSequenceId && genSequences.find(s => s.id === genSequenceId) && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
                  background: genSequences.find(s => s.id === genSequenceId)?.statut === 'OUVERTE' ? 'rgba(29,158,117,0.1)' : 'rgba(245,158,11,0.1)',
                  color: genSequences.find(s => s.id === genSequenceId)?.statut === 'OUVERTE' ? '#1D9E75' : '#F59E0B',
                }}>
                  {genSequences.find(s => s.id === genSequenceId)?.statut === 'OUVERTE'
                    ? (isFr ? 'Ouverte' : 'Open')
                    : genSequences.find(s => s.id === genSequenceId)?.statut === 'FERMEE'
                      ? (isFr ? 'Fermée' : 'Closed')
                      : genSequences.find(s => s.id === genSequenceId)?.statut}
                </span>
              )}
            </div>

            {/* Helper text */}
            <p className="text-[11px] text-surface-400 mb-3 leading-relaxed">
              {isFr
                ? "Choisissez une séquence pour un bulletin séquentiel, ou une période pour un bulletin de trimestre."
                : "Choose a sequence for a sequential report card, or a period for a term report card."}
            </p>

            {/* Sequence + Period side by side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Sequence (primary) */}
              <div>
                <label className="block text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1.5">
                  {isFr ? "Séquence" : "Sequence"}
                </label>
                <div className="relative">
                  <FiLayers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <select
                    value={genSequenceId}
                    onChange={(e) => { setGenSequenceId(e.target.value); setGenPeriodId(""); }}
                    className="w-full h-10 pl-9 pr-8 bg-white dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-lg text-[12px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-all hover:border-surface-300 dark:hover:border-surface-600"
                  >
                    <option value="">{isFr ? "Choisir..." : "Choose..."}</option>
                    {genSequences.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.libelle || s.label || (isFr ? `Séquence ${s.ordre}` : `Sequence ${s.ordre}`)}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                </div>
              </div>

              {/* Period (optional) */}
              <div>
                <label className="block text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1.5">
                  {isFr ? "Période / Trimestre (optionnel)" : "Period / Term (optional)"}
                </label>
                <div className="relative">
                  <FiCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <select
                    value={genPeriodId}
                    onChange={(e) => { setGenPeriodId(e.target.value); setGenSequenceId(""); }}
                    className="w-full h-10 pl-9 pr-8 bg-white dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-lg text-[12px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-all hover:border-surface-300 dark:hover:border-surface-600"
                  >
                    <option value="">{isFr ? "Choisir..." : "Choose..."}</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Selection summary */}
            {genPeriodId && genSequenceId && genSequences.find(s => s.id === genSequenceId) && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50/50 dark:bg-primary-900/20">
                <FiZap size={13} className="text-primary-600 dark:text-primary-400" />
                <span className="text-[11px] font-medium text-primary-700 dark:text-primary-300">
                  {periods.find(p => p.id === genPeriodId)?.name || ''}
                  <FiChevronRight size={10} className="inline mx-1" />
                  {genSequences.find(s => s.id === genSequenceId)?.libelle || ''}
                </span>
              </div>
            )}
          </div>

          {/* ── Template preview ── */}
          {genEduSystem && genStudentId && genPeriodId && (
            <div className="p-3 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10">
              <div className="flex items-center gap-2">
                <FiFileText size={14} className="text-primary-500" />
                <span className="text-[12px] font-semibold text-primary-700 dark:text-primary-300">
                  {isFr
                    ? `Template bulletin : ${genEduSystem}`
                    : `Report card template: ${genEduSystem}`
                  }
                </span>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => { setGenStudentOpen(false); setGenStudentId(""); setGenPeriodId(""); setGenSequenceId(""); setGenSequences([]); setGenEduSystem(""); }}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              {isFr ? "Annuler" : "Cancel"}
            </button>
            <button
              onClick={handleGenerateStudent}
              disabled={generating || !genStudentId || !(genSequenceId || genPeriodId)}
              className="h-10 px-5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-1.5"
              style={{ background: pc }}
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isFr ? "Génération..." : "Generating..."}
                </>
              ) : (
                <>
                  <FiZap size={13} />
                  {isFr ? "Générer le bulletin" : "Generate Report Card"}
                </>
              )}
            </button>
          </div>
        </div>
      </ModalBackdrop>

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: Generate for Class (Batch) — redesigned */}
      {/* ════════════════════════════════════════════ */}
      <ModalBackdrop
        open={genBatchOpen}
        onClose={() => { setGenBatchOpen(false); setGenClassId(""); setGenBatchPeriodId(""); setGenBatchSequenceId(""); setGenBatchSequences([]); setGenBatchEduSystem(""); }}
        title={isFr ? "Génération par classe" : "Batch Generation"}
        subtitle={isFr ? "Générer des bulletins pour tous les élèves d'une classe" : "Generate report cards for every student in a class"}
        width="max-w-xl"
      >
        <div className="space-y-5">
          {/* ── Step 1: Education System Selection ── */}
          <div className={`p-4 rounded-xl border-[1.5px] transition-all ${
            genBatchEduSystem ? 'border-primary-400 bg-primary-50/40 dark:bg-primary-900/15' : 'border-surface-100 dark:border-surface-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: genBatchEduSystem ? 'var(--primary-color, #085041)' : '#9CA3AF' }}>
                {genBatchEduSystem ? <FiCheckCircle size={12} /> : '1'}
              </div>
              <span className="text-[13px] font-bold text-surface-800 dark:text-surface-100">
                {isFr ? "Système éducatif" : "Education system"}
              </span>
              {genBatchEduSystem && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{
                  background: getEduSystemColor(genBatchEduSystem),
                  color: "#fff",
                  opacity: 0.9,
                }}>
                  {genBatchEduSystem}
                </span>
              )}
            </div>
            <div className="relative">
              <FiBookmark size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <select
                value={genBatchEduSystem}
                onChange={(e) => setGenBatchEduSystem(e.target.value)}
                className="w-full h-11 pl-10 pr-9 bg-white dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-all hover:border-surface-300 dark:hover:border-surface-600"
              >
                <option value="">{isFr ? "Choisir le système..." : "Select system..."}</option>
                {schoolEduSystems.map((sys) => (
                  <option key={sys.code} value={sys.code}>
                    {sys.name}
                  </option>
                ))}
              </select>
              <FiChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>

          {/* ── Step 2: Class Selection ── */}
          <div className={`p-4 rounded-xl border-[1.5px] transition-all ${
            genClassId ? 'border-primary-400 bg-primary-50/40 dark:bg-primary-900/15' : 'border-surface-100 dark:border-surface-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: genClassId ? 'var(--primary-color, #085041)' : '#9CA3AF' }}>
                {genClassId ? <FiCheckCircle size={12} /> : '2'}
              </div>
              <span className="text-[13px] font-bold text-surface-800 dark:text-surface-100">
                {isFr ? "Choisir une classe" : "Select a class"}
              </span>
            </div>
            <div className="relative">
              <FiUsers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <select
                value={genClassId}
                onChange={(e) => setGenClassId(e.target.value)}
                className="w-full h-11 pl-10 pr-9 bg-white dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-all hover:border-surface-300 dark:hover:border-surface-600"
              >
                <option value="">{isFr ? "Sélectionnez une classe..." : "Select a class..."}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.educationSystemCode ? ` (${c.educationSystemCode})` : ''}
                  </option>
                ))}
              </select>
              <FiChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
            {/* ── Info: class system vs chosen system ── */}
            {genClassId && selectedClass?.educationSystemCode && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-900">
                <FiBookmark size={12} className="text-surface-400" />
                <span className="text-[11px] text-surface-500">
                  {isFr ? "Système de la classe" : "Class system"}: <strong>{selectedClass.educationSystemName || selectedClass.educationSystemCode}</strong>
                </span>
              </div>
            )}
          </div>

          {/* ── Step 3: Sequence / Period ── */}
          <div className={`p-4 rounded-xl border-[1.5px] transition-all ${
            (genBatchPeriodId || genBatchSequenceId) ? 'border-primary-400 bg-primary-50/40 dark:bg-primary-900/15' : 'border-surface-100 dark:border-surface-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: (genBatchPeriodId || genBatchSequenceId) ? 'var(--primary-color, #085041)' : '#9CA3AF' }}>
                {(genBatchPeriodId || genBatchSequenceId) ? <FiCheckCircle size={12} /> : '3'}
              </div>
              <span className="text-[13px] font-bold text-surface-800 dark:text-surface-100">
                {isFr ? "Séquence / Période" : "Sequence / Period"}
              </span>
              {genBatchSequenceId && genBatchSequences.find(s => s.id === genBatchSequenceId) && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
                  background: genBatchSequences.find(s => s.id === genBatchSequenceId)?.statut === 'OUVERTE' ? 'rgba(29,158,117,0.1)' : 'rgba(245,158,11,0.1)',
                  color: genBatchSequences.find(s => s.id === genBatchSequenceId)?.statut === 'OUVERTE' ? '#1D9E75' : '#F59E0B',
                }}>
                  {genBatchSequences.find(s => s.id === genBatchSequenceId)?.statut === 'OUVERTE'
                    ? (isFr ? 'Ouverte' : 'Open')
                    : genBatchSequences.find(s => s.id === genBatchSequenceId)?.statut === 'FERMEE'
                      ? (isFr ? 'Fermée' : 'Closed')
                      : genBatchSequences.find(s => s.id === genBatchSequenceId)?.statut}
                </span>
              )}
            </div>

            {/* Helper text */}
            <p className="text-[11px] text-surface-400 mb-3 leading-relaxed">
              {isFr
                ? "Choisissez une séquence pour un bulletin séquentiel, ou une période pour un bulletin de trimestre."
                : "Choose a sequence for a sequential report card, or a period for a term report card."}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Sequence (primary) */}
              <div>
                <label className="block text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1.5">
                  {isFr ? "Séquence" : "Sequence"}
                </label>
                <div className="relative">
                  <FiLayers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <select
                    value={genBatchSequenceId}
                    onChange={(e) => { setGenBatchSequenceId(e.target.value); setGenBatchPeriodId(""); }}
                    disabled={genBatchSequences.length === 0}
                    className="w-full h-10 pl-9 pr-8 bg-white dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-lg text-[12px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-all hover:border-surface-300 dark:hover:border-surface-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {genBatchSequences.length === 0
                        ? (isFr ? "Aucune séquence" : "No sequences")
                        : (isFr ? "Choisir une séquence..." : "Select a sequence...")}
                    </option>
                    {genBatchSequences.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.libelle || s.label || (isFr ? `Séquence ${s.ordre}` : `Sequence ${s.ordre}`)}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                </div>
              </div>

              {/* Period (optional) */}
              <div>
                <label className="block text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1.5">
                  {isFr ? "Période / Trimestre (optionnel)" : "Period / Term (optional)"}
                </label>
                <div className="relative">
                  <FiCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <select
                    value={genBatchPeriodId}
                    onChange={(e) => { setGenBatchPeriodId(e.target.value); setGenBatchSequenceId(""); }}
                    className="w-full h-10 pl-9 pr-8 bg-white dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-lg text-[12px] text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-all hover:border-surface-300 dark:hover:border-surface-600"
                  >
                    <option value="">{isFr ? "Choisir..." : "Choose..."}</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Selection summary */}
            {genBatchPeriodId && genBatchSequenceId && genBatchSequences.find(s => s.id === genBatchSequenceId) && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50/50 dark:bg-primary-900/20">
                <FiUsers size={13} className="text-primary-600 dark:text-primary-400" />
                <span className="text-[11px] font-medium text-primary-700 dark:text-primary-300">
                  {classes.find(c => c.id === genClassId)?.name || ''} — {periods.find(p => p.id === genBatchPeriodId)?.name || ''}
                  <FiChevronRight size={10} className="inline mx-1" />
                  {genBatchSequences.find(s => s.id === genBatchSequenceId)?.libelle || ''}
                </span>
              </div>
            )}
          </div>

          {/* ── Info banner ── */}
          {genClassId && genBatchPeriodId && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <FiAlertCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-blue-700 dark:text-blue-300">
                {isFr
                  ? "Un bulletin sera généré pour chaque élève actif de la classe. Cette opération peut prendre quelques instants."
                  : "A report card will be generated for each active student in the class. This may take a moment."}
              </p>
            </div>
          )}

          {/* ── Template preview ── */}
          {genBatchEduSystem && genClassId && genBatchPeriodId && (
            <div className="p-3 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10">
              <div className="flex items-center gap-2">
                <FiFileText size={14} className="text-primary-500" />
                <span className="text-[12px] font-semibold text-primary-700 dark:text-primary-300">
                  {isFr
                    ? `Template : ${genBatchEduSystem}`
                    : `Template: ${genBatchEduSystem}`
                  }
                </span>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => { setGenBatchOpen(false); setGenClassId(""); setGenBatchPeriodId(""); setGenBatchSequenceId(""); setGenBatchSequences([]); setGenBatchEduSystem(""); }}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              {isFr ? "Annuler" : "Cancel"}
            </button>
            <button
              onClick={handleGenerateBatch}
              disabled={generating || !genClassId || !(genBatchSequenceId || genBatchPeriodId)}
              className="h-10 px-5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-1.5"
              style={{ background: pc }}
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isFr ? "Génération..." : "Generating..."}
                </>
              ) : (
                <>
                  <FiZap size={13} />
                  {isFr ? "Générer pour la classe" : "Generate for Class"}
                </>
              )}
            </button>
          </div>

          {/* ── Progress Bar ── */}
          {batchProgress && batchProgress.total > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-surface-600 dark:text-surface-300">
                  {isFr
                    ? `${batchProgress.current} / ${batchProgress.total} bulletins`
                    : `${batchProgress.current} / ${batchProgress.total} report cards`}
                </span>
                <span className="font-bold" style={{ color: pc }}>
                  {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    background: `linear-gradient(90deg, ${pc}, ${pc}dd)`,
                  }}
                />
              </div>
              {batchProgress.current === batchProgress.total && (
                <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold animate-pulse">
                  {isFr ? "Terminé !" : "Complete!"}
                </p>
              )}
            </div>
          )}
        </div>
      </ModalBackdrop>

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: Revise (reason) */}
      {/* ════════════════════════════════════════════ */}
      <ModalBackdrop
        open={!!reviseModal}
        onClose={() => { setReviseModal(null); setReviseReason(""); }}
        title={isFr ? "Réviser le bulletin" : "Revise Report Card"}
        subtitle={isFr
          ? `Version ${reviseModal?.version || 1} sera verrouillée, une nouvelle version brouillon sera créée.`
          : `Version ${reviseModal?.version || 1} will be locked, a new draft version created.`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">
              {isFr ? "Motif de la révision *" : "Reason for revision *"}
            </label>
            <textarea
              value={reviseReason}
              onChange={(e) => setReviseReason(e.target.value)}
              placeholder={isFr ? "Expliquez pourquoi ce bulletin est révisé..." : "Explain why this report card is being revised..."}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[13px] text-surface-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 transition-colors resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => { setReviseModal(null); setReviseReason(""); }}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              {isFr ? "Annuler" : "Cancel"}
            </button>
            <button
              onClick={handleReviseConfirm}
              disabled={!reviseReason.trim()}
              className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-1.5"
              style={{ background: pc }}
            >
              <FiRefreshCw size={13} />
              {isFr ? "Confirmer la révision" : "Confirm Revision"}
            </button>
          </div>
        </div>
      </ModalBackdrop>

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: Delete Confirmation */}
      {/* ════════════════════════════════════════════ */}
      <ModalBackdrop
        open={!!deleteModal}
        onClose={() => { if (!deleting) setDeleteModal(null); }}
        title={isFr ? "Confirmer la suppression" : "Confirm Deletion"}
        subtitle={deleteModal?.batch
          ? (isFr
              ? `${selectedIds.size} bulletin(s) sélectionné(s)`
              : `${selectedIds.size} report card(s) selected`)
          : deleteModal?.student_name
            ? `${deleteModal.student_name} — ${deleteModal.period_name || ""}`
            : ""}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-800/50 flex items-center justify-center flex-shrink-0">
              <FiAlertCircle size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-red-700 dark:text-red-300">
                {isFr
                  ? "Cette action est irréversible."
                  : "This action cannot be undone."}
              </p>
              <p className="text-[12px] text-red-600 dark:text-red-400 mt-0.5">
                {isFr
                  ? "Le bulletin et toutes ses lignes seront définitivement supprimés."
                  : "The report card and all its lines will be permanently deleted."}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteModal(null)}
              disabled={deleting}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isFr ? "Annuler" : "Cancel"}
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {deleting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {deleteProgress
                    ? (isFr
                        ? `Suppression ${deleteProgress.done}/${deleteProgress.total}...`
                        : `Deleting ${deleteProgress.done}/${deleteProgress.total}...`)
                    : (isFr ? "Suppression..." : "Deleting...")}
                </>
              ) : (
                <>
                  <FiTrash2 size={13} />
                  {deleteModal?.batch
                    ? (isFr ? `Supprimer (${selectedIds.size})` : `Delete (${selectedIds.size})`)
                    : (isFr ? "Supprimer" : "Delete")}
                </>
              )}
            </button>
          </div>
        </div>
      </ModalBackdrop>

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: Payload Viewer — Bulletin Scolaire */}
      {/* ════════════════════════════════════════════ */}
      <ModalBackdrop
        open={!!payloadModal}
        onClose={() => { setPayloadModal(null); setPayloadData(null); }}
        title={isFr ? "Bulletin Scolaire" : "Report Card"}
        subtitle={payloadModal?.sequence_label || payloadModal?.period_name || payloadModal?.student_name
          ? `${payloadModal.student_name} — ${payloadModal.period_name || ""}`
          : ""}
        width="max-w-4xl"
      >
        {payloadLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--primary-color, #085041)' }} />
              <div className="absolute inset-0 rounded-full bg-white dark:bg-surface-800 shadow-lg flex items-center justify-center border-2" style={{ borderColor: 'var(--primary-color, #085041)' }}>
                <FiFileText size={22} style={{ color: 'var(--primary-color, #085041)' }} className="animate-pulse" />
              </div>
            </div>
            <span className="text-[14px] font-semibold text-surface-500 dark:text-surface-400">
              {isFr ? "Chargement du bulletin..." : "Loading report card..."}
            </span>
          </div>
        ) : payloadData ? (
          <div className="space-y-4">
            {/* ── Bulletin Template ── */}
            <div id="report-card-payload">
              <BulletinTemplate payload={payloadData} schoolName={user?.schoolName} />
            </div>

            {/* ── Actions ── */}
            <div className="flex justify-end gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-700 dark:text-surface-200 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-all flex items-center gap-1.5"
              >
                <FiFileText size={13} />
                {isFr ? "🖨️ Imprimer" : "🖨️ Print"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-surface-400">
            {isFr ? "Impossible de charger les détails du bulletin" : "Unable to load report card details"}
          </div>
        )}
      </ModalBackdrop>

      {/* ── Floating ZIP export progress bar ── */}
      {exportProgress && exportProgress.total > 0 && (
        <div
          className="fixed bottom-6 right-6 z-[90] w-80 rounded-2xl shadow-2xl border border-surface-100 dark:border-surface-700 p-4 backdrop-blur-md bg-white/95 dark:bg-surface-900/95"
          style={{ animation: "exportBarIn 0.3s cubic-bezier(.16,1,.3,1) both" }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-surface-800 dark:text-surface-100 flex items-center gap-1.5">
                <FiDownload size={13} className="text-primary-500" />
                {isFr ? "Préparation du ZIP..." : "Preparing ZIP..."}
              </p>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5">
                {isFr
                  ? `${exportProgress.current} / ${exportProgress.total} bulletins`
                  : `${exportProgress.current} / ${exportProgress.total} report cards`}
              </p>
            </div>
            <button
              onClick={handleCancelExport}
              className="shrink-0 p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title={isFr ? "Fermer" : "Close"}
            >
              <FiX size={15} />
            </button>
          </div>
          <div className="w-full h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden mt-2.5">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(exportProgress.current / exportProgress.total) * 100}%`,
                background: `linear-gradient(90deg, ${pc}, ${pc}dd)`,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-surface-400">
              {isFr ? "Génération des PDF en arrière-plan..." : "Rendering PDFs in background..."}
            </span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: pc }}>
              {Math.round((exportProgress.current / exportProgress.total) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* ── Spectacular generation animation overlay ── */}
      <ReportCardGenerationAnimation
        visible={generating && !genDismissed}
        primaryColor={pc}
        realProgress={batchProgress?.total > 0 ? Math.round((batchProgress.current / batchProgress.total) * 100) : null}
        onFinish={() => {}}
        onDismiss={() => setGenDismissed(true)}
      />
    </div>
  );
}
