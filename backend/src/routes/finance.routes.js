const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');

router.get('/', financeController.list);
router.get('/summary', financeController.summary);
router.get('/student/:studentId', financeController.getByStudent);
router.post('/', financeController.create);

module.exports = router;
