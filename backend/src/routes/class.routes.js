const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');

router.get('/', classController.list);
router.get('/:id', classController.get);
router.post('/', classController.create);

module.exports = router;
