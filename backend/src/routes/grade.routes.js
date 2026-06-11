const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/grade.controller');

router.get('/', gradeController.list);
router.get('/student/:studentId', gradeController.getByStudent);
router.post('/', gradeController.create);

module.exports = router;
