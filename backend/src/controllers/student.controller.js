/**
 * Student Controller — tenant-scoped CRUD; each school only sees its own students.
 */

const response = require('../utils/response');
const studentService = require('../services/student.service');

class StudentController {
  async createStudent(req, res, next) {
    try {
      const student = await studentService.createStudent(req.schoolId, req.body);
      response.success(res, 'Student created', student, 201);
    } catch (error) {
      next(error);
    }
  }

  async getStudent(req, res, next) {
    try {
      const { id } = req.params;
      const student = await studentService.getStudentById(req.schoolId, id);
      response.success(res, 'Student retrieved', student);
    } catch (error) {
      if (error.message === 'Student not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getMyProfile(req, res, next) {
    try {
      const student = await studentService.getStudentByUserId(req.schoolId, req.user.userId);
      response.success(res, 'Student profile retrieved', student);
    } catch (error) {
      if (error.message === 'Student not found') {
        return response.error(res, 'Student profile not found', null, 404);
      }
      next(error);
    }
  }

  async getAllStudents(req, res, next) {
    try {
      const { limit = 50, offset = 0, search, status, className } = req.query;
      const result = await studentService.listStudents(req.schoolId, {
        limit: parseInt(limit, 10) || 50,
        offset: parseInt(offset, 10) || 0,
        search,
        status,
        className,
      });
      response.success(res, 'Students retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async updateStudent(req, res, next) {
    try {
      const { id } = req.params;
      const student = await studentService.updateStudent(req.schoolId, id, req.body);
      response.success(res, 'Student updated', student);
    } catch (error) {
      if (error.message === 'Student not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async deleteStudent(req, res, next) {
    try {
      const { id } = req.params;
      const result = await studentService.deleteStudent(req.schoolId, id);
      response.success(res, 'Student deleted', result);
    } catch (error) {
      if (error.message === 'Student not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }
}

module.exports = new StudentController();
