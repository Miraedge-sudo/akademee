const response = require('../utils/response');
const classTeacherService = require('../services/classTeacher.service');

class ClassTeacherController {
  async assign(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const { id } = req.params;
      const { teacherId, isMain } = req.body;
      const result = await classTeacherService.assign(schoolId, { classId: id, teacherId, isMain });
      response.success(res, 'Teacher assigned to class', result, 201);
    } catch (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        return response.error(res, 'Teacher already assigned to this class', null, 409);
      }
      next(error);
    }
  }

  async listByClass(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const { id } = req.params;
      const result = await classTeacherService.listByClass(schoolId, id);
      response.success(res, 'Class teachers retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async availableTeachers(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await classTeacherService.getAvailableTeachers(schoolId);
      response.success(res, 'Available teachers retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async listBySchool(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await classTeacherService.listBySchool(schoolId);
      response.success(res, 'All class-teacher assignments', result);
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const { id, teacherId } = req.params;

      // Find the assignment by class_id + teacher_id
      const existing = await classTeacherService.listByClass(schoolId, id);
      const assignment = existing.find((a) => a.teacherId === teacherId);
      if (!assignment) return response.error(res, 'Assignment not found', null, 404);

      const result = await classTeacherService.remove(schoolId, assignment.id);
      response.success(res, 'Teacher removed from class', result);
    } catch (error) {
      if (error.message === 'Assignment not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new ClassTeacherController();
