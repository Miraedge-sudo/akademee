const express = require('express');
const levelController = require('../controllers/level.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const auditMiddleware = require('../middleware/audit.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', levelController.list);
router.post('/', roleMiddleware(['admin']), auditMiddleware('CREATE', 'system_levels'), levelController.create);
router.get('/:id', levelController.getById);
router.put('/:id', roleMiddleware(['admin']), auditMiddleware('UPDATE', 'system_levels'), levelController.update);
router.delete('/:id', roleMiddleware(['admin']), auditMiddleware('DELETE', 'system_levels'), levelController.delete);

module.exports = router;
