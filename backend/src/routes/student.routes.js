const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const roleCheck = require('../middleware/roleCheck');

router.route('/:id')
  .get(studentController.get)
  .put(roleCheck(['SUPER_ADMIN', 'ADMIN']), studentController.update)
  .delete(roleCheck(['SUPER_ADMIN']), studentController.remove);

router.route('/')
  .post(roleCheck(['SUPER_ADMIN', 'ADMIN']), studentController.create)
  .get(studentController.list);

module.exports = router;
