const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');

router.get('/', attendanceController.list);
router.get('/student/:studentId', attendanceController.getByStudent);
router.post('/', attendanceController.create);

module.exports = router;
