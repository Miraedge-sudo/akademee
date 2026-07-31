/**
 * JobsDashboard — Background job monitoring panel for report card generation.
 *
 * Shows:
 *  - All queued/running/completed/failed jobs
 *  - Real-time progress via SSE
 *  - Controls to cancel jobs
 *  - History of past jobs
 *
 * Mounted below the main report cards list on the ReportCardsPage.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { listJobs, cancelJob, subscribeToJobProgress } from "../../../core/api/reportCardsService";
import toast from "react-hot-toast";
import {
  FiZap,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiRefreshCw,
  FiTrash2,
  FiStopCircle,
  FiActivity,
  FiFileText,
} from "react-icons/fi";

// ── Job status config ──
const JOB_STATUS_CONFIG = {
  QUEUED: { label: "Queued", color: "#6B7280", bg: "rgba(107,114,128,0.1)", icon: FiClock },
  ACTIVE: { label: "Active", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: FiActivity },
  COMPLETED: { label: "Completed", color: "#1D9E75", bg: "rgba(29,158,117,0.1)", icon: FiCheckCircle },
  FAILED: { label: "Failed", color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: FiAlertCircle },
  CANCELLED: { label: "Cancelled", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: FiStopCircle },
};

function formatDuration(startedAt, completedAt) {
  if (!startedAt) return "-";
  const start = new Date(startedAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  const seconds = Math.floor((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString();
}

export default function JobsDashboard({ primaryColor = "#085041" }) {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const pc = primaryColor || "#085041";

  // ── State ──
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const subscriptionsRef = useRef({});
  const intervalRef = useRef(null);

  // ── Load jobs ──
  const loadJobs = useCallback(async () => {
    try {
      const data = await listJobs({ limit: 50 });
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[JobsDashboard] Failed to load jobs:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadJobs();
    // Poll every 10 seconds for new jobs
    intervalRef.current = setInterval(loadJobs, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadJobs]);

  // ── Subscribe to SSE for active jobs ──
  // Uses a ref so subscriptions are only created for NEW active jobs and
  // torn down for jobs that left the active set — NOT on every progress tick.
  useEffect(() => {
    const activeIds = new Set(
      jobs.filter(j => j.status === 'QUEUED' || j.status === 'ACTIVE').map(j => j.job_id)
    );

    // Tear down subscriptions for jobs no longer active
    for (const [jobId, unsubscribe] of Object.entries(subscriptionsRef.current)) {
      if (!activeIds.has(jobId)) {
        unsubscribe();
        delete subscriptionsRef.current[jobId];
      }
    }

    // Create subscriptions for newly-active jobs only
    for (const job of jobs) {
      if (!activeIds.has(job.job_id)) continue;
      if (subscriptionsRef.current[job.job_id]) continue;

      const unsubscribe = subscribeToJobProgress(
        job.job_id,
        (progress) => {
          // Update the job in the list (throttled: only when values actually change)
          setJobs(prev => prev.map(j =>
            j.job_id === job.job_id
              ? {
                  ...j,
                  completed_students: progress.current,
                  total_students: progress.total,
                  failed_students: progress.failed,
                  status: progress.status,
                }
              : j
          ));
        },
        (complete) => {
          // Job completed — update final state and drop the subscription
          const unsub = subscriptionsRef.current[job.job_id];
          if (unsub) { unsub(); delete subscriptionsRef.current[job.job_id]; }
          setJobs(prev => prev.map(j =>
            j.job_id === job.job_id
              ? { ...j, status: complete.status, results: complete.results, errors: complete.errors, completed_at: new Date().toISOString() }
              : j
          ));
          // Reload to get fresh data from DB
          loadJobs();
        },
        (error) => {
          console.error(`[JobsDashboard] SSE error for job ${job.job_id}:`, error);
          const unsub = subscriptionsRef.current[job.job_id];
          if (unsub) { unsub(); delete subscriptionsRef.current[job.job_id]; }
        }
      );

      subscriptionsRef.current[job.job_id] = unsubscribe;
    }
  }, [jobs, loadJobs]);

  // ── Cleanup all subscriptions on unmount ──
  useEffect(() => {
    return () => {
      for (const unsubscribe of Object.values(subscriptionsRef.current)) {
        unsubscribe();
      }
      subscriptionsRef.current = {};
    };
  }, []);

  // ── Cancel a job ──
  const handleCancel = async (jobId) => {
    try {
      await cancelJob(jobId);
      toast.success(isFr ? "Job annulé" : "Job cancelled");
      loadJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || (isFr ? "Échec de l'annulation" : "Cancel failed"));
    }
  };

  // ── Stats ──
  const activeJobs = jobs.filter(j => j.status === 'QUEUED' || j.status === 'ACTIVE').length;
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
  const failedJobs = jobs.filter(j => j.status === 'FAILED').length;
  const totalCardsGenerated = jobs
    .filter(j => j.status === 'COMPLETED')
    .reduce((sum, j) => sum + (j.completed_students || 0), 0);

  // ── Render ──
  return (
    <div className="rc-fade bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden" style={{ animationDelay: "0.1s" }}>
      {/* ── Header ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors text-left cursor-pointer"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${pc}15` }}>
          <FiZap size={16} style={{ color: pc }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-bold text-surface-900 dark:text-surface-100">
            {isFr ? "Tâches de génération" : "Generation Jobs"}
          </span>
          <span className="text-[11px] text-surface-400 ml-2">
            {jobs.length} {isFr ? "tâche(s)" : "job(s)"}
          </span>
        </div>
        <FiChevronRight
          size={16}
          className={`text-surface-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* ── Mini stats (always visible) ── */}
      <div className="px-5 pb-3 flex items-center gap-4 flex-wrap">
        {activeJobs > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
            <FiActivity size={12} />
            {activeJobs} {isFr ? "actif(s)" : "active"}
          </span>
        )}
        {completedJobs > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 dark:text-green-400">
            <FiCheckCircle size={12} />
            {completedJobs} {isFr ? "terminé(s)" : "completed"}
          </span>
        )}
        {failedJobs > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
            <FiAlertCircle size={12} />
            {failedJobs} {isFr ? "échoué(s)" : "failed"}
          </span>
        )}
        {totalCardsGenerated > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-500">
            <FiFileText size={12} />
            {totalCardsGenerated} {isFr ? "bulletin(s) généré(s)" : "cards generated"}
          </span>
        )}
      </div>

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="border-t border-surface-100 dark:border-surface-700">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-surface-300 border-t-primary-500 rounded-full" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-3 border-2 border-dashed border-surface-200 dark:border-surface-600">
                <FiZap size={20} className="text-surface-300" />
              </div>
              <p className="text-[13px] text-surface-400">
                {isFr
                  ? "Aucune tâche de génération pour le moment. Lancez une génération par classe !"
                  : "No generation jobs yet. Start a batch generation!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {/* ── Column headers ── */}
              <div className="hidden lg:grid grid-cols-12 gap-2 px-5 py-2 bg-surface-50/50 dark:bg-surface-900/20 text-[10px] font-semibold tracking-wider uppercase text-surface-400">
                <div className="col-span-2">{isFr ? "Date" : "Date"}</div>
                <div className="col-span-1">{isFr ? "Statut" : "Status"}</div>
                <div className="col-span-2">{isFr ? "Progression" : "Progress"}</div>
                <div className="col-span-1 text-center">{isFr ? "Succès" : "Success"}</div>
                <div className="col-span-1 text-center">{isFr ? "Échecs" : "Failed"}</div>
                <div className="col-span-1 text-center">{isFr ? "Durée" : "Duration"}</div>
                <div className="col-span-3 text-center">{isFr ? "Erreur" : "Error"}</div>
                <div className="col-span-1 text-right">{isFr ? "Action" : "Action"}</div>
              </div>

              {jobs.map((job, idx) => {
                const cfg = JOB_STATUS_CONFIG[job.status] || JOB_STATUS_CONFIG.QUEUED;
                const pct = job.total_students > 0
                  ? Math.round(((job.completed_students || 0) / job.total_students) * 100)
                  : 0;

                return (
                  <div
                    key={job.job_id}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-2 px-5 py-3 hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors items-center"
                  >
                    {/* Date */}
                    <div className="lg:col-span-2">
                      <span className="text-[11px] text-surface-600 dark:text-surface-300">
                        {formatDate(job.created_at)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="lg:col-span-1">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        <cfg.icon size={10} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="lg:col-span-2">
                      {job.status === 'ACTIVE' || job.status === 'QUEUED' ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-surface-100 dark:bg-surface-700">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${pc}, ${pc}88)`,
                                boxShadow: `0 0 8px ${pc}40`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums text-surface-500">
                            {job.completed_students || 0}/{job.total_students || 0}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-surface-500">
                          {job.completed_students || 0}/{job.total_students || 0}
                        </span>
                      )}
                    </div>

                    {/* Success count */}
                    <div className="lg:col-span-1 text-center">
                      <span className="text-[11px] font-semibold text-green-600 dark:text-green-400">
                        {job.completed_students || 0}
                      </span>
                    </div>

                    {/* Failed count */}
                    <div className="lg:col-span-1 text-center">
                      <span className={`text-[11px] font-semibold ${job.failed_students > 0 ? 'text-red-600 dark:text-red-400' : 'text-surface-400'}`}>
                        {job.failed_students || 0}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="lg:col-span-1 text-center">
                      <span className="text-[10px] font-mono text-surface-500">
                        {formatDuration(job.started_at, job.completed_at)}
                      </span>
                    </div>

                    {/* Error message */}
                    <div className="lg:col-span-3 text-center">
                      {job.error_message ? (
                        <span className="text-[10px] text-red-500 truncate block max-w-full" title={job.error_message}>
                          {job.error_message}
                        </span>
                      ) : (
                        <span className="text-[10px] text-surface-400">-</span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="lg:col-span-1 text-right">
                      {(job.status === 'QUEUED' || job.status === 'ACTIVE') && (
                        <button
                          onClick={() => handleCancel(job.job_id)}
                          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-surface-400 hover:text-red-500"
                          title={isFr ? "Annuler" : "Cancel"}
                        >
                          <FiStopCircle size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Refresh button ── */}
          <div className="px-5 py-3 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between">
            <span className="text-[10px] text-surface-400">
              {isFr ? "Mise à jour automatique toutes les 10s" : "Auto-refresh every 10s"}
            </span>
            <button
              onClick={loadJobs}
              className="h-7 px-3 rounded-lg text-[10px] font-semibold text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all flex items-center gap-1.5"
            >
              <FiRefreshCw size={11} />
              {isFr ? "Rafraîchir" : "Refresh"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}