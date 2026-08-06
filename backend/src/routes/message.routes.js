/**
 * Campus Message Routes — admin management of parent/campus threads.
 */

const express = require('express');
const messageController = require('../controllers/message.controller');
const authMiddleware = require('../middleware/auth.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const { replyValidator, updateStatusValidator } = require('../validators/parent.validator');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', roleMiddleware(['admin', 'teacher', 'accountant', 'secretary']), messageController.listMessages);
router.get('/:id', roleMiddleware(['admin', 'teacher', 'accountant', 'secretary']), messageController.getThread);
router.post('/:id/reply', roleMiddleware(['admin', 'teacher']), replyValidator, validateMiddleware, messageController.replyToMessage);
router.patch('/:id/status', roleMiddleware(['admin', 'teacher']), updateStatusValidator, validateMiddleware, messageController.updateStatus);

module.exports = router;
