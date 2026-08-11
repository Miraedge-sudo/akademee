/**
 * Campus Message Controller — admin management of parent/campus threads.
 */

const response = require('../utils/response');
const messageService = require('../services/message.service');

class CampusMessageController {
  async listMessages(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit = 50, offset = 0, status, studentId } = req.query;
      const result = await messageService.listBySchool(schoolId, { limit, offset, status, studentId });
      response.success(res, 'Messages retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getThread(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const thread = await messageService.getThread(schoolId, req.params.id);
      response.success(res, 'Message thread retrieved', thread);
    } catch (error) {
      if (error.message === 'Message not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async replyToMessage(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const reply = await messageService.adminReply(schoolId, req.user?.userId, req.params.id, req.body);
      response.success(res, 'Reply sent', reply, 201);
    } catch (error) {
      if (error.message === 'Message not found') {
        return response.error(res, error.message, null, 404);
      }
      if (error.message.includes('required')) {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await messageService.updateStatus(schoolId, req.params.id, req.body.status);
      response.success(res, 'Status updated', result);
    } catch (error) {
      if (error.message === 'Message not found') {
        return response.error(res, error.message, null, 404);
      }
      if (error.message === 'Invalid status') {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }
}

module.exports = new CampusMessageController();
