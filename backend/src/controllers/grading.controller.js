/**
 * Grading System Controller
 *
 * REST handlers for the Report Card Grading System v1 API.
 * Delegates business logic to GradingService.
 */

const gradingService = require('../services/grading.service');
const response = require('../utils/response');

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
      const { classLevelId, periodStructureId } = req.body;
      const data = await gradingService.generateBatch(classLevelId, periodStructureId, actorId);
      response.success(res, 'Batch report cards generated', data);
    } catch (err) {
      next(err);
    }
  }

  async listReportCards(req, res, next) {
    try {
      const data = await gradingService.listReportCards(req.query);
      response.success(res, 'Report cards retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async getReportCardPayload(req, res, next) {
    try {
      const { id } = req.params;
      const { lang } = req.query;
      const data = await gradingService.getReportCardPayload(id, lang);
      response.success(res, 'Report card payload retrieved', data);
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
}

module.exports = new GradingController();
