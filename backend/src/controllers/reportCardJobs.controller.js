/**
 * Report Card Jobs Controller
 *
 * REST handlers for managing background report card generation jobs.
 * Delegates to ReportCardQueue service.
 */

const reportCardQueue = require('../services/reportCardQueue');
const response = require('../utils/response');

class ReportCardJobsController {
  /**
   * POST /api/v1/report-card-jobs
   * Enqueue batch report card generation job(s).
   *
   * Accepts a single `classLevelId` (legacy) OR an array `classLevelIds`.
   * When several classes are given, one background job is created per class
   * and the response aggregates them as `{ jobs: [...], totalStudents }`.
   */
  async createJob(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const actorId = req.user?.userId;
      const { classLevelId, classLevelIds, periodStructureId, sequenceId, educationSystemCode } = req.body;

      if (!periodStructureId) {
        return res.status(400).json({
          success: false,
          message: 'periodStructureId is required',
        });
      }

      // Normalize to an array: legacy single class OR explicit multi-class list.
      // Deduplicate so the same class never produces duplicate jobs.
      const ids = Array.isArray(classLevelIds)
        ? [...new Set(classLevelIds.filter(Boolean))]
        : classLevelId
          ? [classLevelId]
          : [];

      if (ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'classLevelId (or classLevelIds) and periodStructureId are required',
        });
      }

      // Validate that IDs are UUIDs (prevents 500 on malformed input)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalid = ids.find((id) => !uuidPattern.test(id));
      if (invalid || !uuidPattern.test(periodStructureId)) {
        return res.status(400).json({
          success: false,
          message: 'classLevelId(s) and periodStructureId must be valid UUIDs',
        });
      }

      // One job per class — the worker is already built around a single class.
      const jobs = [];
      let totalStudents = 0;
      for (const id of ids) {
        const result = await reportCardQueue.enqueueBatchJob({
          schoolId,
          classLevelId: id,
          periodStructureId,
          sequenceId,
          educationSystemCode,
          actorId,
        });
        jobs.push({ ...result, classLevelId: id });
        totalStudents += result.totalStudents || 0;
      }

      // Legacy single-class response shape is preserved so older callers keep working.
      const payload =
        jobs.length === 1
          ? { ...jobs[0], jobs, totalStudents }
          : { jobs, totalStudents };

      response.success(res, 'Report card generation job(s) queued', payload, 202);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/report-card-jobs
   * List jobs with optional filters.
   */
  async listJobs(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { status, limit, offset } = req.query;

      const data = await reportCardQueue.listJobs({
        schoolId,
        status,
        limit: Number(limit) || 20,
        offset: Number(offset) || 0,
      });

      response.success(res, 'Jobs retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/report-card-jobs/:id
   * Get the status of a specific job.
   */
  async getJobStatus(req, res, next) {
    try {
      const { id } = req.params;
      const data = await reportCardQueue.getJobStatus(id);

      if (!data) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      response.success(res, 'Job status retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/report-card-jobs/:id/cancel
   * Cancel a queued or active job.
   */
  async cancelJob(req, res, next) {
    try {
      const { id } = req.params;
      const data = await reportCardQueue.cancelJob(id);
      response.success(res, 'Job cancelled', data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/report-card-jobs/:id/progress
   * SSE endpoint for real-time job progress.
   * Client can connect to receive live updates.
   */
  async streamJobProgress(req, res, next) {
    try {
      const { id } = req.params;

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      let aborted = false;
      req.on('close', () => {
        aborted = true;
        try { res.end(); } catch { /* ignore */ }
      });

      // Poll the job status every 1.5 seconds
      const interval = setInterval(async () => {
        if (aborted) {
          clearInterval(interval);
          return;
        }

        try {
          const job = await reportCardQueue.getJobStatus(id);
          if (!job) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Job not found' })}\n\n`);
            clearInterval(interval);
            res.end();
            return;
          }

          res.write(`data: ${JSON.stringify({
            type: 'progress',
            status: job.status,
            current: job.completed_students,
            total: job.total_students,
            failed: job.failed_students,
            errorMessage: job.error_message,
          })}\n\n`);

          // If job is finished, stop polling
          if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) {
            clearInterval(interval);
            res.write(`data: ${JSON.stringify({
              type: 'complete',
              status: job.status,
              results: job.results,
              errors: job.errors,
            })}\n\n`);
            res.end();
          }
        } catch (err) {
          if (!aborted) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
          }
          clearInterval(interval);
          res.end();
        }
      }, 1500);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportCardJobsController();