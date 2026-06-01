const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');

router.get('/', studentController.list);
router.get('/:id', studentController.get);
router.post('/', studentController.create);
router.put('/:id', studentController.update);
router.delete('/:id', studentController.remove);

module.exports = router;
