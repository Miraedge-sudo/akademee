const response = require('../utils/response');
const dashboardService = require('../services/dashboard.service');

class DashboardController {
  async getStats(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const stats = await dashboardService.getStats(schoolId);
      response.success(res, 'Dashboard stats retrieved', stats);
    } catch (error) {
      next(error);
    }
  }

  async getRecentActivities(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit } = req.query;
      const activities = await dashboardService.getRecentActivities(schoolId, { limit });
      response.success(res, 'Recent activities retrieved', activities);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueData(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { months } = req.query;
      const revenue = await dashboardService.getRevenueData(schoolId, { months });
      response.success(res, 'Revenue data retrieved', revenue);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
