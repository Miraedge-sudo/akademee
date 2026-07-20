const response = require('../utils/response');
const classService = require('../services/class.service');
const enrollmentService = require('../services/enrollment.service');

class ClassController {
  async createClass(req, res, next) {
    try {
      const { name, classTeacherId, academicYearId, capacity, levelId, seriesId } = req.body;
      const { schoolId } = req;
      const result = await classService.create(schoolId, { name, classTeacherId, academicYearId, capacity, levelId, seriesId });
      response.success(res, 'Class created', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getClass(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await classService.getById(schoolId, id);
      response.success(res, 'Class retrieved', result);
    } catch (error) {
      if (error.message === 'Class not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getSchoolClasses(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit, offset, academicYearId } = req.query;
      const result = await classService.listBySchool(schoolId, { limit, offset, academicYearId });
      response.success(res, 'Classes retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async updateClass(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await classService.update(schoolId, id, updateData);
      response.success(res, 'Class updated', result);
    } catch (error) {
      if (error.message === 'Class not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async deleteClass(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await classService.delete(schoolId, id);
      response.success(res, 'Class deleted', result);
    } catch (error) {
      if (error.message === 'Class not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getTeacherClasses(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { teacherId } = req.params;
      const result = await classService.getTeacherClasses(schoolId, teacherId);
      response.success(res, 'Teacher classes retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async removeStudent(req, res, next) {
    try {
      const { id, studentId } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await enrollmentService.removeFromClass(schoolId, studentId, id);
      response.success(res, 'Student removed from class', result);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('No active')) {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }
}

module.exports = new ClassController();
