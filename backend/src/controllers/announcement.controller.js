const response = require('../utils/response');
const announcementService = require('../services/announcement.service');

class AnnouncementController {
  async create(req, res, next) {
    try {
      const data = { ...req.body, createdBy: req.user?.userId };
      const result = await announcementService.create(req.schoolId || req.user?.schoolId, data);
      response.success(res, 'Announcement created', result, 201);
    } catch (error) { next(error); }
  }

  async listPublic(req, res, next) {
    try {
      const subdomain = req.subdomain || req.query.subdomain;
      if (!subdomain) {
        return response.error(res, 'Subdomain is required', null, 400);
      }
      const result = await announcementService.listPublishedBySubdomain(subdomain);
      response.success(res, 'Published announcements retrieved', result);
    } catch (error) { next(error); }
  }

  async list(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit, offset, targetAudience, isPublished } = req.query;
      const result = await announcementService.listBySchool(schoolId, {
        limit, offset, targetAudience,
        isPublished: isPublished !== undefined ? isPublished === 'true' : undefined,
      });
      response.success(res, 'Announcements retrieved', result);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await announcementService.getById(schoolId, req.params.id);
      response.success(res, 'Announcement retrieved', result);
    } catch (error) {
      if (error.message === 'Announcement not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await announcementService.update(schoolId, req.params.id, req.body);
      response.success(res, 'Announcement updated', result);
    } catch (error) {
      if (error.message === 'Announcement not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await announcementService.delete(schoolId, req.params.id);
      response.success(res, 'Announcement deleted', result);
    } catch (error) {
      if (error.message === 'Announcement not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async publish(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await announcementService.publish(schoolId, req.params.id);
      response.success(res, 'Announcement published', result);
    } catch (error) {
      if (error.message === 'Announcement not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async unpublish(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await announcementService.unpublish(schoolId, req.params.id);
      response.success(res, 'Announcement unpublished', result);
    } catch (error) {
      if (error.message === 'Announcement not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new AnnouncementController();
