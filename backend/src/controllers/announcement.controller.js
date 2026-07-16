const response = require('../utils/response');
const announcementService = require('../services/announcement.service');
const { uploadFiles } = require('../services/announcementUpload.service');

class AnnouncementController {
  async create(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const data = { ...req.body, createdBy: req.user?.userId };

      if (data.isPublished === 'true') data.isPublished = true;
      if (data.isPublished === 'false') data.isPublished = false;
      if (data.files === '') delete data.files;

      if (req.files && req.files.length > 0) {
        const uploaded = await uploadFiles(req.files, schoolId);
        data.files = uploaded;
      }

      const result = await announcementService.create(schoolId, data);
      response.success(res, 'Announcement created', result, 201);
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
      const data = { ...req.body };

      if (data.isPublished === 'true') data.isPublished = true;
      if (data.isPublished === 'false') data.isPublished = false;
      if (data.files === '') delete data.files;

      if (req.files && req.files.length > 0) {
        const uploaded = await uploadFiles(req.files, schoolId);
        data.files = uploaded;
      }

      const result = await announcementService.update(schoolId, req.params.id, data);
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
