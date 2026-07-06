const response = require('../utils/response');
const attendanceStatsService = require('../services/attendanceStats.service');

class AttendanceStatsController {
  async getStudentStats(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await attendanceStatsService.getStudentStats(schoolId, req.params.studentId);
      response.success(res, 'Attendance stats retrieved', result);
    } catch (error) { next(error); }
  }

  async getClassStats(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const { startDate, endDate } = req.query;
      const result = await attendanceStatsService.getClassStats(schoolId, req.params.classId, { startDate, endDate });
      response.success(res, 'Class attendance stats retrieved', result);
    } catch (error) { next(error); }
  }

  async getMonthlyTrend(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const { months } = req.query;
      const result = await attendanceStatsService.getMonthlyTrend(schoolId, { months });
      response.success(res, 'Monthly attendance trend retrieved', result);
    } catch (error) { next(error); }
  }
}

module.exports = new AttendanceStatsController();
