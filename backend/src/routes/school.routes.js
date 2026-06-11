const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/school.controller');

router.get('/', schoolController.list);
router.get('/:id', schoolController.get);
router.post('/', schoolController.create);

module.exports = router;
