const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

router.get('/pdf/:studentId', reportController.generatePdf);

module.exports = router;
