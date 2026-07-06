const express = require('express');
const announcementController = require('../controllers/announcement.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { createAnnouncementValidator, updateAnnouncementValidator } = require('../validators/announcement.validator');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', announcementController.list);
router.post(
  '/',
  roleMiddleware(['admin']),
  createAnnouncementValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('CREATE', 'announcements'),
  announcementController.create
);
router.get('/:id', announcementController.getById);
router.put(
  '/:id',
  roleMiddleware(['admin']),
  updateAnnouncementValidator,
  validateMiddleware,
  auditMiddleware('UPDATE', 'announcements'),
  announcementController.update
);
router.delete(
  '/:id',
  roleMiddleware(['admin']),
  auditMiddleware('DELETE', 'announcements'),
  announcementController.delete
);
router.post(
  '/:id/publish',
  roleMiddleware(['admin']),
  auditMiddleware('PUBLISH', 'announcements'),
  announcementController.publish
);
router.post(
  '/:id/unpublish',
  roleMiddleware(['admin']),
  auditMiddleware('UNPUBLISH', 'announcements'),
  announcementController.unpublish
);

/**
 * @openapi
 * /api/announcements:
 *   get:
 *     tags: [Announcements]
 *     summary: List all announcements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of announcements
 *
 *   post:
 *     tags: [Announcements]
 *     summary: Create an announcement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               targetAudience:
 *                 type: string
 *                 enum: [all, students, teachers, parents]
 *     responses:
 *       201:
 *         description: Announcement created
 *
 * /api/announcements/{id}:
 *   get:
 *     tags: [Announcements]
 *     summary: Get an announcement by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Announcement details
 *
 *   put:
 *     tags: [Announcements]
 *     summary: Update an announcement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               targetAudience:
 *                 type: string
 *     responses:
 *       200:
 *         description: Announcement updated
 *
 *   delete:
 *     tags: [Announcements]
 *     summary: Delete an announcement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Announcement deleted
 *
 * /api/announcements/{id}/publish:
 *   post:
 *     tags: [Announcements]
 *     summary: Publish an announcement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Announcement published
 *
 * /api/announcements/{id}/unpublish:
 *   post:
 *     tags: [Announcements]
 *     summary: Unpublish an announcement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Announcement unpublished
 */
module.exports = router;
