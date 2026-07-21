const response = require('../utils/response');
const dashboardService = require('../services/dashboard.service');

class DashboardController {
  async getStats(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { academicYearId } = req.query;
      const stats = await dashboardService.getStats(schoolId, { academicYearId });
      response.success(res, 'Dashboard stats retrieved', stats);
    } catch (error) {
      next(error);
    }
  }

  async getRecentActivities(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit, academicYearId } = req.query;
      const activities = await dashboardService.getRecentActivities(schoolId, { limit, academicYearId });
      response.success(res, 'Recent activities retrieved', activities);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueData(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { months, academicYearId } = req.query;
      const revenue = await dashboardService.getRevenueData(schoolId, { months, academicYearId });
      response.success(res, 'Revenue data retrieved', revenue);
    } catch (error) {
      next(error);
    }
  }

  async getFinanceStats(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const stats = await dashboardService.getFinanceStats(schoolId);
      response.success(res, 'Finance stats retrieved', stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
