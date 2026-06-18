/**
 * Attendance Controller
 */

const response = require('../utils/response');

class AttendanceController {
  async recordAttendance(req, res, next) {
    try {
      const { studentId, classId, date, status } = req.body;

      response.success(res, 'Attendance recorded', {}, 201);
    } catch (error) {
      next(error);
    }
  }

  async getStudentAttendance(req, res, next) {
    try {
      const { studentId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      response.success(res, 'Attendance retrieved', []);
    } catch (error) {
      next(error);
    }
  }

  async getClassAttendance(req, res, next) {
    try {
      const { classId, date } = req.params;

      response.success(res, 'Class attendance retrieved', []);
    } catch (error) {
      next(error);
    }
  }

  async updateAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      response.success(res, 'Attendance updated', {});
    } catch (error) {
      next(error);
    }
  }

  async bulkRecordAttendance(req, res, next) {
    try {
      const { attendanceData } = req.body;

      response.success(res, 'Bulk attendance recorded', {});
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
