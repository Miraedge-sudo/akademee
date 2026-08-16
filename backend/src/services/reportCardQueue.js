/**
 * Report Card Queue Service
 *
 * Background job queue for report card generation using BullMQ.
 *
 * Architecture:
 *   ┌──────────────┐     ┌──────────┐     ┌──────────────┐
 *   │ API Controller│────▶│  Queue   │────▶│   Worker     │
 *   │ (HTTP)        │     │ (Redis)  │     │ (Background) │
 *   └──────────────┘     └──────────┘     └──────┬───────┘
 *                                                │
 *                                        ┌───────▼───────┐
 *                                        │  GradingService│
 *                                        │  (business)    │
 *                                        └───────────────┘
 *
 * Features:
 *  - Persistent queue (survives server restarts via Redis)
 *  - Concurrency control (configurable, default 3)
 *  - Progress tracking (pushes to DB + Redis)
 *  - Retry with exponential backoff (max 3 attempts)
 *  - Dead letter queue for failed jobs
 *  - Real-time status via SSE (polling fallback)
 */

const { Queue, Worker } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const gradingService = require('./grading.service');
const sql = require('../config/database');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

// ── Constants ──
const QUEUE_NAME = 'report-card-generation';
const DEFAULT_CONCURRENCY = 3; // Number of parallel jobs per worker
const MAX_RETRIES = 3;

// ── Queue instance ──
let queue = null;
let worker = null;

/**
 * Get or create the BullMQ queue instance.
 */
function getQueue() {
  if (!queue) {
    const connection = getRedisConnection();
    queue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: MAX_RETRIES,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, then 10s, then 20s
        },
        removeOnComplete: {
          age: 7 * 24 * 3600, // keep completed jobs for 7 days
          count: 1000,
        },
        removeOnFail: {
          age: 14 * 24 * 3600, // keep failed jobs for 14 days
        },
      },
    });
    logger.info(`[ReportCardQueue] Queue "${QUEUE_NAME}" created`);
  }
  return queue;
}

/**
 * Add a batch report card generation job to the queue.
 *
 * @param {object} params
 * @param {string} params.schoolId
 * @param {string} params.classLevelId
 * @param {string} params.periodStructureId
 * @param {string} [params.sequenceId]
 * @param {string} [params.educationSystemCode]
 * @param {string} params.actorId
 * @param {string} [params.jobId] - optional custom job ID
 * @returns {Promise<{jobId: string, dbJobId: string}>}
 */
async function enqueueBatchJob(params) {
  const {
    schoolId,
    classLevelId,
    periodStructureId,
    sequenceId,
    educationSystemCode,
    actorId,
  } = params;

  // 1. Count students to pre-populate the DB record
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM enrollments e
    WHERE e.class_id = ${classLevelId}
      AND (e.enrolled_to IS NULL OR e.enrolled_to >= CURRENT_DATE)
  `;

  // 2. Create a DB record for tracking
  const [dbJob] = await sql`
    INSERT INTO report_card_jobs (
      school_id, class_level_id, period_structure_id, sequence_id,
      education_system_code, actor_id, status, total_students
    ) VALUES (
      ${schoolId}, ${classLevelId}, ${periodStructureId}, ${sequenceId || null},
      ${educationSystemCode || null}, ${actorId || null}, 'QUEUED', ${count}
    )
    RETURNING *
  `;

  // 3. Add to BullMQ queue
  // If Redis is unavailable, the enqueue fails — mark the DB job FAILED
  // so it never stays in a phantom 'QUEUED' state.
  let bullJob;
  try {
    const bullQueue = getQueue();
    bullJob = await bullQueue.add(
      'generate-batch',
      {
        dbJobId: dbJob.job_id,
        schoolId,
        classLevelId,
        periodStructureId,
        sequenceId,
        educationSystemCode,
        actorId,
        totalStudents: count,
      },
      {
        jobId: `batch-${dbJob.job_id}`,
      }
    );
  } catch (err) {
    // Mark the DB record FAILED so the UI can show the real reason
    await sql`
      UPDATE report_card_jobs
      SET status = 'FAILED',
          error_message = ${`Enqueue failed: ${err.message}`},
          completed_at = now(),
          updated_at = now()
      WHERE job_id = ${dbJob.job_id}
    `;
    logger.error(`[ReportCardQueue] Failed to enqueue job ${dbJob.job_id}:`, err.message);
    throw new Error(`Could not enqueue job (Redis unavailable): ${err.message}`);
  }

  // 4. Update the DB record with the Bull job ID
  await sql`
    UPDATE report_card_jobs
    SET bull_job_id = ${bullJob.id}
    WHERE job_id = ${dbJob.job_id}
  `;

  logger.info(`[ReportCardQueue] Job enqueued`, {
    dbJobId: dbJob.job_id,
    bullJobId: bullJob.id,
    classLevelId,
    periodStructureId,
    totalStudents: count,
  });

  return {
    jobId: dbJob.job_id,
    bullJobId: bullJob.id,
    totalStudents: count,
  };
}

/**
 * Process a single batch job.
 * Called by the worker for each job in the queue.
 */
async function processBatchJob(job) {
  const {
    dbJobId,
    schoolId,
    classLevelId,
    periodStructureId,
    sequenceId,
    educationSystemCode,
    actorId,
    totalStudents,
  } = job.data;

  // ── Mark as ACTIVE ──
  await sql`
    UPDATE report_card_jobs
    SET status = 'ACTIVE', started_at = now(), updated_at = now()
    WHERE job_id = ${dbJobId}
  `;

  // ── Update job progress periodically ──
  // IMPORTANT: progress-tracking failures must NEVER fail the job itself.
  // Wrap all progress writes in try/catch (log only).
  const updateProgress = async (current, total) => {
    try {
      await sql`
        UPDATE report_card_jobs
        SET completed_students = ${current},
            total_students = ${total},
            updated_at = now()
        WHERE job_id = ${dbJobId}
      `;
      // Also update BullMQ progress (0-100)
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      await job.updateProgress(pct);
    } catch (err) {
      logger.warn(`[ReportCardQueue] Progress update failed for job ${dbJobId}:`, err.message);
    }
  };

  // ── Check whether the job was cancelled by the admin ──
  const isCancelled = async () => {
    try {
      const rows = await sql`
        SELECT status FROM report_card_jobs WHERE job_id = ${dbJobId}
      `;
      return rows.length > 0 && rows[0].status === 'CANCELLED';
    } catch {
      return false;
    }
  };

  const results = [];
  const errors = [];

  try {
    // ── Pre-compute the whole cohort ONCE (Phase 2: kills the N+1) ──
    // Resolves school config, grading scale, mentions and computes every
    // student's averages + ranks in a handful of queries, then the per-student
    // generation below only does the inserts.
    let batchPrepared = null;
    try {
      batchPrepared = await gradingService.prepareBatch(classLevelId, periodStructureId, { sequenceId });
      logger.info(`[ReportCardQueue] Cohort precomputed for job ${dbJobId} (${batchPrepared.cohortData.classSize} students)`);
    } catch (err) {
      logger.warn(`[ReportCardQueue] Cohort precompute failed for job ${dbJobId} — falling back to per-student compute: ${err.message}`);
    }

    // ── Fetch students ──
    const students = await sql`
      SELECT e.student_id
      FROM enrollments e
      WHERE e.class_id = ${classLevelId}
        AND (e.enrolled_to IS NULL OR e.enrolled_to >= CURRENT_DATE)
      ORDER BY e.student_id
    `;

    const total = students.length;
    await updateProgress(0, total);

    // ── Process students in chunks for memory efficiency ──
    const CHUNK_SIZE = 5;
    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      // ── Honour cancellation: stop processing if the admin cancelled this job ──
      if (await isCancelled()) {
        logger.info(`[ReportCardQueue] Job ${dbJobId} was cancelled — stopping at ${results.length}/${total}`);
        break;
      }

      const chunk = students.slice(i, i + CHUNK_SIZE);

      // Process chunk in parallel
      const chunkResults = await Promise.allSettled(
        chunk.map((s) =>
          gradingService.generateReportCard(s.student_id, periodStructureId, actorId, {
            educationSystemCode,
            sequenceId,
            // Phase 2: reuse the single batch pre-computation (prepared + cohortData)
            ...(batchPrepared || {}),
          })
        )
      );

      for (let j = 0; j < chunk.length; j++) {
        const r = chunkResults[j];
        if (r.status === 'fulfilled') {
          results.push({
            studentId: chunk[j].student_id,
            reportCardId: r.value.reportCard.report_card_id,
            success: true,
          });
        } else {
          errors.push({
            studentId: chunk[j].student_id,
            error: r.reason?.message || 'Unknown error',
          });
        }
      }

      // Update progress after each chunk
      await updateProgress(results.length, total);
      logger.info(`[ReportCardQueue] ${results.length}/${total} cards generated for job ${dbJobId}`);
    }

    // ── Don't overwrite CANCELLED with COMPLETED if the admin cancelled mid-run ──
    const wasCancelled = await isCancelled();
    if (wasCancelled) {
      await sql`
        UPDATE report_card_jobs
        SET completed_students = ${results.length},
            failed_students = ${errors.length},
            results = ${JSON.stringify(results)},
            errors = ${JSON.stringify(errors)},
            updated_at = now()
        WHERE job_id = ${dbJobId} AND status = 'CANCELLED'
      `;
      logger.info(`[ReportCardQueue] Job ${dbJobId} marked CANCELLED with ${results.length} cards completed`);
      return { success: false, cancelled: true, results, errors };
    }

    // ── Mark as COMPLETED ──
    await sql`
      UPDATE report_card_jobs
      SET status = 'COMPLETED',
          completed_students = ${results.length},
          failed_students = ${errors.length},
          results = ${JSON.stringify(results)},
          errors = ${JSON.stringify(errors)},
          completed_at = now(),
          updated_at = now()
      WHERE job_id = ${dbJobId}
    `;

    logger.info(`[ReportCardQueue] Job ${dbJobId} completed: ${results.length} success, ${errors.length} failures`);

    // ── Invalidate the school's HTTP cache (reports/grades/dashboard) ──
    // Background workers have no HTTP request, so invalidate directly and
    // scoped to the school — never across tenants.
    try {
      const cleared = await cache.delByPrefix('http', `school:${schoolId}`);
      if (cleared > 0) {
        logger.info(`[ReportCardQueue] Cache invalidated for school ${schoolId}: ${cleared} keys`);
      }
    } catch (err) {
      logger.warn(`[ReportCardQueue] Cache invalidation failed for school ${schoolId}:`, err.message);
    }

    return { success: true, results, errors };
  } catch (err) {
    // ── Mark as FAILED ──
    await sql`
      UPDATE report_card_jobs
      SET status = 'FAILED',
          error_message = ${err.message},
          completed_students = ${results.length},
          failed_students = ${errors.length + 1},
          results = ${JSON.stringify(results)},
          errors = ${JSON.stringify(errors)},
          completed_at = now(),
          updated_at = now()
      WHERE job_id = ${dbJobId}
    `;

    logger.error(`[ReportCardQueue] Job ${dbJobId} failed:`, { message: err.message });

    // Re-throw so BullMQ handles retry logic
    throw err;
  }
}

/**
 * Start the worker that processes jobs from the queue.
 * Call this once during server startup.
 */
function startWorker() {
  if (worker) return; // Already started

  const connection = getRedisConnection();
  const concurrency = Number(process.env.REPORT_CARD_WORKER_CONCURRENCY) || DEFAULT_CONCURRENCY;

  worker = new Worker(QUEUE_NAME, processBatchJob, {
    connection,
    concurrency,
    lockDuration: 600000, // 10 minutes — report card generation is heavy; 2min was too short for large classes
    stalledInterval: 120000, // Check for stalled jobs every 2 minutes
  });

  worker.on('completed', (job) => {
    logger.info(`[ReportCardQueue] Worker completed job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[ReportCardQueue] Worker failed job ${job.id}:`, err.message);
  });

  worker.on('error', (err) => {
    // BullMQ errors are expected (e.g. connection issues) — don't crash.
    // Log the FULL error (some Redis errors have an empty .message).
    logger.error(`[ReportCardQueue] Worker error:`, {
      name: err?.name || null,
      code: err?.code || null,
      message: err?.message || null,
      stack: err?.stack || String(err),
    });
  });

  logger.info(`[ReportCardQueue] Worker started (concurrency: ${concurrency})`);
}

/**
 * Gracefully stop the worker and close the queue.
 */
async function stopWorker() {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('[ReportCardQueue] Worker stopped');
  }
  if (queue) {
    await queue.close();
    queue = null;
    logger.info('[ReportCardQueue] Queue closed');
  }
}

/**
 * Normalize a job row so JSONB columns (`results`, `errors`) are always
 * arrays, never JSON strings. postgres.js can return jsonb as a raw string
 * depending on the driver version/query shape, which would break frontend
 * consumers that call `.map`/`.length` on them.
 */
function normalizeJob(row) {
  if (!row) return row;
  for (const key of ['results', 'errors']) {
    if (typeof row[key] === 'string') {
      try {
        row[key] = JSON.parse(row[key]);
      } catch {
        row[key] = [];
      }
    }
    if (!Array.isArray(row[key])) row[key] = [];
  }
  return row;
}

/**
 * Get the status of a specific job from the DB.
 */
async function getJobStatus(jobId) {
  const [row] = await sql`
    SELECT * FROM report_card_jobs WHERE job_id = ${jobId}
  `;
  return normalizeJob(row || null);
}

/**
 * List jobs for a school, with optional filters.
 */
async function listJobs({ schoolId, status, limit = 20, offset = 0 }) {
  const rows = await sql`
    SELECT *
    FROM report_card_jobs
    WHERE school_id = ${schoolId}
      ${status ? sql`AND status = ${status}` : sql``}
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
  return rows.map(normalizeJob);
}

/**
 * Cancel a queued or active job.
 */
async function cancelJob(jobId) {
  const [job] = await sql`
    SELECT * FROM report_card_jobs WHERE job_id = ${jobId}
  `;
  if (!job) throw new Error('Job not found');
  if (!['QUEUED', 'ACTIVE'].includes(job.status)) {
    throw new Error(`Cannot cancel a job with status "${job.status}"`);
  }

  // Remove from BullMQ if still queued
  if (job.bull_job_id) {
    try {
      const bullQueue = getQueue();
      const bullJob = await bullQueue.getJob(job.bull_job_id);
      if (bullJob) {
        await bullJob.remove();
      }
    } catch (err) {
      logger.warn(`[ReportCardQueue] Could not remove Bull job ${job.bull_job_id}:`, err.message);
    }
  }

  await sql`
    UPDATE report_card_jobs
    SET status = 'CANCELLED', completed_at = now(), updated_at = now()
    WHERE job_id = ${jobId}
  `;

  return { cancelled: true };
}

module.exports = {
  getQueue,
  enqueueBatchJob,
  startWorker,
  stopWorker,
  getJobStatus,
  listJobs,
  cancelJob,
};