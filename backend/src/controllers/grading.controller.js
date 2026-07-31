/**
 * Grading System Controller
 *
 * REST handlers for the Report Card Grading System v1 API.
 * Delegates business logic to GradingService.
 */

const gradingService = require('../services/grading.service');
const reportCardQueue = require('../services/reportCardQueue');
const reportCardPdfService = require('../services/reportCardPdf.service');
const reportCardExportService = require('../services/reportCardExport.service');
const logger = require('../utils/logger');
const response = require('../utils/response');

/**
 * Multi-tenant guard: ensure the report card belongs to the requester's school.
 * Sends a 404/403 response and returns null when access is denied; otherwise
 * returns the report card's school id.
 *
 * Module-level function (NOT a class method) because Express calls the route
 * handlers unbound — `this` would be undefined inside the class.
 *
 * NOTE: only enforced when a requester school is resolved (req.schoolId or
 * req.user.schoolId) — keeps legacy flows working when schoolId is not
 * attached to the token.
 */
async function assertReportCardAccess(req, res, id) {
  const requesterSchoolId = req.schoolId || req.user?.schoolId;
  const reportCardSchoolId = await gradingService.getReportCardSchool(id);
  if (!reportCardSchoolId) {
    response.error(res, 'Report card not found', null, 404);
    return null;
  }
  if (requesterSchoolId && requesterSchoolId !== reportCardSchoolId) {
    response.error(res, 'Forbidden: report card does not belong to your school', null, 403);
    return null;
  }
  return reportCardSchoolId;
}

class GradingController {
  // ------------------------------------------------------------------
  // Education Systems
  // ------------------------------------------------------------------
  async listEducationSystems(req, res, next) {
    try {
      const data = await gradingService.listEducationSystems();
      response.success(res, 'Education systems retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async getEducationSystem(req, res, next) {
    try {
      const { id } = req.params;
      const data = await gradingService.getEducationSystem(id);
      if (!data) return res.status(404).json({ success: false, message: 'Education system not found' });
      response.success(res, 'Education system retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // Grading Scales
  // ------------------------------------------------------------------
  async createGradingScale(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const data = await gradingService.createGradingScale(schoolId, req.body);
      response.success(res, 'Grading scale created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async listGradingScales(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const data = await gradingService.listGradingScales(schoolId);
      response.success(res, 'Grading scales retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async createGradingScaleVersion(req, res, next) {
    try {
      const { scaleId } = req.params;
      const data = await gradingService.createGradingScaleVersion(scaleId, req.body);
      response.success(res, 'Grading scale version created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async listGradingScaleVersions(req, res, next) {
    try {
      const { scaleId } = req.params;
      const data = await gradingService.listGradingScaleVersions(scaleId);
      response.success(res, 'Grading scale versions retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // Mention Thresholds
  // ------------------------------------------------------------------
  async createMentionThresholdSet(req, res, next) {
    try {
      const data = await gradingService.createMentionThresholdSet(req.body);
      response.success(res, 'Mention threshold set created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async createMentionThreshold(req, res, next) {
    try {
      const { setId } = req.params;
      const data = await gradingService.createMentionThreshold(setId, req.body);
      response.success(res, 'Mention threshold created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async listMentionThresholds(req, res, next) {
    try {
      const { setId } = req.params;
      const data = await gradingService.listMentionThresholds(setId);
      response.success(res, 'Mention thresholds retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // Report Card Config
  // ------------------------------------------------------------------
  async upsertReportCardConfig(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const data = await gradingService.upsertReportCardConfig(schoolId, req.body);
      response.success(res, 'Report card config saved', data);
    } catch (err) {
      next(err);
    }
  }

  async getReportCardConfig(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { appliesTo } = req.params;
      const data = await gradingService.getReportCardConfig(schoolId, appliesTo);
      response.success(res, 'Report card config retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // Subject Offerings & Assessment Components
  // ------------------------------------------------------------------
  async createSubjectOffering(req, res, next) {
    try {
      const data = await gradingService.createSubjectOffering(req.body);
      response.success(res, 'Subject offering created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async listSubjectOfferings(req, res, next) {
    try {
      const data = await gradingService.listSubjectOfferings(req.query);
      response.success(res, 'Subject offerings retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async createAssessmentComponent(req, res, next) {
    try {
      const data = await gradingService.createAssessmentComponent(req.body);
      response.success(res, 'Assessment component created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async listAssessmentComponents(req, res, next) {
    try {
      const { offeringId } = req.params;
      const data = await gradingService.listAssessmentComponents(offeringId);
      response.success(res, 'Assessment components retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // UE Groups
  // ------------------------------------------------------------------
  async createUEGroup(req, res, next) {
    try {
      const data = await gradingService.createUEGroup(req.body);
      response.success(res, 'UE group created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async listUEGroups(req, res, next) {
    try {
      const { programId, periodStructureId } = req.query;
      const data = await gradingService.listUEGroups(programId, periodStructureId);
      response.success(res, 'UE groups retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // Grades
  // ------------------------------------------------------------------
  async createGrade(req, res, next) {
    try {
      const actorId = req.user?.userId;
      const data = await gradingService.createGrade(actorId, req.body);
      response.success(res, 'Grade recorded', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async listGrades(req, res, next) {
    try {
      const data = await gradingService.listGrades(req.query);
      response.success(res, 'Grades retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async updateGrade(req, res, next) {
    try {
      const actorId = req.user?.userId;
      const { id } = req.params;
      const data = await gradingService.updateGrade(id, actorId, req.body);
      response.success(res, 'Grade updated', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // Calculations
  // ------------------------------------------------------------------
  async calculateSubjectAverage(req, res, next) {
    try {
      const { studentId, offeringId } = req.query;
      const data = await gradingService.computeSubjectAverage(studentId, offeringId, req.query);
      response.success(res, 'Subject average computed', data);
    } catch (err) {
      next(err);
    }
  }

  async calculatePeriodAverage(req, res, next) {
    try {
      const { studentId, periodStructureId } = req.query;
      const data = await gradingService.computePeriodAverage(studentId, periodStructureId, req.query);
      response.success(res, 'Period average computed', data);
    } catch (err) {
      next(err);
    }
  }

  async calculateCohortRanks(req, res, next) {
    try {
      const { classLevelId, periodStructureId } = req.query;
      const data = await gradingService.computeCohortRanks(classLevelId, periodStructureId, req.query);
      response.success(res, 'Cohort ranks computed', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // Report Cards
  // ------------------------------------------------------------------
  async generateReportCard(req, res, next) {
    try {
      const actorId = req.user?.userId;
      const { studentId, periodStructureId } = req.body;
      const data = await gradingService.generateReportCard(studentId, periodStructureId, actorId, req.body);
      response.success(res, 'Report card generated', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async generateBatchReportCards(req, res, next) {
    try {
      const actorId = req.user?.userId;
      const schoolId = req.schoolId || req.user?.schoolId;
      const { classLevelId, periodStructureId, sequenceId, educationSystemCode } = req.body;

      // Enqueue the job to BullMQ instead of processing synchronously
      const result = await reportCardQueue.enqueueBatchJob({
        schoolId,
        classLevelId,
        periodStructureId,
        sequenceId,
        educationSystemCode,
        actorId,
      });

      response.success(res, 'Report card generation job queued', result, 202);
    } catch (err) {
      next(err);
    }
  }



  async listReportCards(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const data = await gradingService.listReportCards({ ...req.query, schoolId });
      response.success(res, 'Report cards retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async getReportCardPayload(req, res, next) {
    try {
      const { id } = req.params;
      const { lang } = req.query;

      const reportCardSchoolId = await assertReportCardAccess(req, res, id);
      if (!reportCardSchoolId) return; // response already sent

      const data = await gradingService.getReportCardPayload(id, lang);
      response.success(res, 'Report card payload retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async downloadReportCardPdf(req, res, next) {
    try {
      const { id } = req.params;
      const { lang } = req.query;

      const reportCardSchoolId = await assertReportCardAccess(req, res, id);
      if (!reportCardSchoolId) return; // response already sent

      const payload = await gradingService.getReportCardPayload(id, lang);
      const pdfBuffer = await reportCardPdfService.generateReportCardPdf(payload);

      const studentName = (payload?.student?.full_name || 'report-card').replace(/[^a-zA-Z0-9]/g, '-');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bulletin-${studentName}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /report-card-exports
   *
   * Starts a BACKGROUND ZIP export of individual bulletins (one PDF per
   * student) organized in class folders with students sorted alphabetically.
   * Returns { exportId, total } immediately; the client then follows progress
   * via GET /report-card-exports/:id/progress (SSE) and downloads the finished
   * archive via GET /report-card-exports/:id/file.
   *
   * Selection: explicit `ids` (max 200, each guarded against the requester's
   * school) OR `classLevelId` / `educationSystemCode` filters resolved
   * server-side through the school-scoped list query.
   *
   * SECURITY: the filter path must NOT run without a school context —
   * listReportCards({ schoolId: null }) would skip the school WHERE clause
   * and resolve cards from OTHER schools' classes/systems.
   */
  async startReportCardExport(req, res, next) {
    try {
      const { ids, lang, classLevelId, educationSystemCode } = req.body;
      const schoolId = req.schoolId || req.user?.schoolId;
      let idList = [];

      if (classLevelId || educationSystemCode) {
        if (!schoolId) {
          return res.status(400).json({ success: false, message: 'School context is required for group export' });
        }
        const cards = await gradingService.listReportCards({ schoolId, classLevelId, educationSystemCode });
        idList = cards.map((c) => c.report_card_id);
        if (idList.length === 0) {
          return res.status(404).json({ success: false, message: 'No report cards found for the requested filters' });
        }
      } else {
        idList = String(ids || '').split(',').map((s) => s.trim()).filter(Boolean);
        if (idList.length === 0) {
          return res.status(400).json({ success: false, message: 'Provide ids (comma-separated), classLevelId or educationSystemCode' });
        }
        if (idList.length > 200) {
          return res.status(400).json({ success: false, message: 'Too many report cards (max 200 per ids export)' });
        }
      }

      // Resolve payloads now (synchronously) so total is known immediately and
      // the response can return { exportId, total }. The actual ZIP generation
      // runs in the background via reportCardExportService.
      const payloads = [];
      let skipped = 0;
      for (const id of idList) {
        if (!classLevelId && !educationSystemCode) {
          const schoolMatch = await assertReportCardAccess(req, res, id);
          if (!schoolMatch) return; // response already sent (404/403)
        }
        try {
          const payload = await gradingService.getReportCardPayload(id, lang || 'EN');
          if (payload) payloads.push(payload);
          else skipped++;
        } catch (err) {
          logger.warn(`[Export] Skipping report card ${id}: ${err.message}`);
          skipped++;
        }
      }

      if (skipped > 0) {
        logger.warn(`[Export] ${skipped}/${idList.length} report cards skipped (unloadable payload)`);
      }
      if (payloads.length === 0) {
        return res.status(500).json({ success: false, message: 'Could not load any report card payloads' });
      }

      // Meaningful filename used both in the POST response and for the actual
      // download (stored on the record so downloadExportFile can serve it).
      const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9_-]/g, '-').trim();
      const fileName = educationSystemCode
        ? `bulletins-${safe(educationSystemCode)}.zip`
        : classLevelId && payloads[0]?.student?.class_name
          ? `bulletins-${safe(payloads[0].student.class_name)}.zip`
          : `bulletins-${payloads.length}.zip`;

      const { exportId, total } = reportCardExportService.startExport({ payloads, lang: lang || 'EN', fileName });

      response.success(res, 'Export started', { exportId, total, fileName }, 202);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /report-card-exports/:id/progress
   * SSE endpoint streaming live ZIP-export progress — same event shape as the
   * report-card generation jobs ({ type: 'progress' | 'complete', current,
   * total, status }). Client disconnects cleanly stop the polling loop.
   */
  async streamExportProgress(req, res, next) {
    try {
      const { id } = req.params;

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

      const interval = setInterval(async () => {
        if (aborted) {
          clearInterval(interval);
          return;
        }
        try {
          const progress = reportCardExportService.getProgress(id);
          if (!progress) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Export not found' })}\n\n`);
            clearInterval(interval);
            res.end();
            return;
          }

          res.write(`data: ${JSON.stringify({
            type: 'progress',
            status: progress.status,
            current: progress.current,
            total: progress.total,
          })}\n\n`);

          if (['COMPLETED', 'FAILED'].includes(progress.status)) {
            clearInterval(interval);
            res.write(`data: ${JSON.stringify({
              type: 'complete',
              status: progress.status,
              results: null,
              errors: progress.error ? [{ error: progress.error }] : [],
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
      }, 700);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /report-card-exports/:id/file
   * Download the finished ZIP archive. One-shot: the buffer is freed after
   * this request (see reportCardExportService.getBuffer).
   */
  async downloadExportFile(req, res, next) {
    try {
      const { id } = req.params;
      const result = reportCardExportService.getBuffer(id);
      if (!result.ok) {
        const message = result.message || (result.code === 404 ? 'Export not found' : 'Export is not ready yet');
        return res.status(result.code).json({ success: false, message });
      }
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName || 'bulletins.zip'}"`);
      res.send(result.buffer);
    } catch (err) {
      next(err);
    }
  }

  async publishReportCard(req, res, next) {
    try {
      const actorId = req.user?.userId;
      const { id } = req.params;
      const data = await gradingService.publishReportCard(id, actorId);
      response.success(res, 'Report card published', data);
    } catch (err) {
      next(err);
    }
  }

  async reviseReportCard(req, res, next) {
    try {
      const actorId = req.user?.userId;
      const { id } = req.params;
      const data = await gradingService.reviseReportCard(id, actorId, req.body.reason);
      response.success(res, 'Report card revised', data);
    } catch (err) {
      next(err);
    }
  }

  async lockReportCard(req, res, next) {
    try {
      const actorId = req.user?.userId;
      const { id } = req.params;
      const data = await gradingService.lockReportCard(id, actorId);
      response.success(res, 'Report card locked', data);
    } catch (err) {
      next(err);
    }
  }

  async unlockReportCard(req, res, next) {
    try {
      const actorId = req.user?.userId;
      const { id } = req.params;
      const data = await gradingService.unlockReportCard(id, actorId);
      response.success(res, 'Report card unlocked', data);
    } catch (err) {
      next(err);
    }
  }

  async deleteReportCard(req, res, next) {
    try {
      const actorId = req.user?.userId;
      const { id } = req.params;
      const data = await gradingService.deleteReportCard(id, actorId);
      response.success(res, 'Report card deleted', data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GradingController();
