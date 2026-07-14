const response = require('../utils/response');
const attendanceService = require('../services/attendance.service');
const attendanceStatsService = require('../services/attendanceStats.service');

class AttendanceController {
  async recordAttendance(req, res, next) {
    try {
      const { studentId, classId, academicYearId, date, status, markedBy, remarks } = req.body;
      const { schoolId } = req;
      const result = await attendanceService.create(schoolId, { studentId, classId, academicYearId, date, status, markedBy, remarks });
      response.success(res, 'Attendance recorded', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getStudentAttendance(req, res, next) {
    try {
      const { studentId } = req.params;
      const { limit = 10, offset = 0, academicYearId } = req.query;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await attendanceService.listByStudent(schoolId, studentId, { limit, offset, academicYearId });
      response.success(res, 'Attendance retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getClassAttendance(req, res, next) {
    try {
      const { classId, date } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const { academicYearId } = req.query;
      const result = await attendanceService.listBySchool(schoolId, { startDate: date, endDate: date, academicYearId });
      response.success(res, 'Class attendance retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getClassAttendanceNoDate(req, res, next) {
    try {
      const { classId } = req.params;
      const { startDate, endDate, limit, offset, academicYearId } = req.query;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await attendanceService.listByClass(schoolId, classId, { limit, offset, startDate, endDate, academicYearId });
      response.success(res, 'Class attendance retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceStats(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { studentId, classId } = req.query;
      if (studentId) {
        const result = await attendanceStatsService.getStudentStats(schoolId, studentId);
        return response.success(res, 'Attendance stats retrieved', result);
      }
      if (classId) {
        const result = await attendanceStatsService.getClassStats(schoolId, classId);
        return response.success(res, 'Attendance stats retrieved', result);
      }
      response.error(res, 'Provide studentId or classId query parameter', null, 400);
    } catch (error) {
      next(error);
    }
  }

  async getAllAttendance(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit, offset, startDate, endDate, status, academicYearId } = req.query;
      const result = await attendanceService.listBySchool(schoolId, { limit, offset, startDate, endDate, status, academicYearId });
      response.success(res, 'Attendance records retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async updateAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await attendanceService.update(schoolId, id, { status, remarks });
      response.success(res, 'Attendance updated', result);
    } catch (error) {
      if (error.message === 'Attendance record not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async bulkRecordAttendance(req, res, next) {
    try {
      const { attendanceData } = req.body;
      const { schoolId } = req;
      if (!attendanceData || !Array.isArray(attendanceData)) {
        return response.error(res, 'attendanceData must be an array', null, 400);
      }
      const result = await attendanceService.bulkCreate(schoolId, attendanceData);
      response.success(res, 'Bulk attendance recorded', result, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
