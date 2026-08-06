/**
 * Parent Routes — portal endpoints for the PARENT role.
 * All endpoints require auth + tenant + PARENT role.
 */

const express = require('express');
const parentController = require('../controllers/parent.controller');
const authMiddleware = require('../middleware/auth.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const { payFeeValidator, sendMessageValidator, replyValidator } = require('../validators/parent.validator');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware, roleMiddleware(['parent']));

router.get('/children', parentController.getMyChildren);
router.get('/fees', parentController.getMyFees);
router.post('/fees/pay', payFeeValidator, validateMiddleware, parentController.payFee);
router.get('/payments', parentController.getMyPayments);

router.get('/messages', parentController.getMyMessages);
router.post('/messages', sendMessageValidator, validateMiddleware, parentController.sendMessage);
router.get('/messages/:id', parentController.getMessageThread);
router.post('/messages/:id/reply', replyValidator, validateMiddleware, parentController.replyToMessage);

module.exports = router;
