const express = require('express');
const seriesController = require('../controllers/series.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const auditMiddleware = require('../middleware/audit.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', seriesController.list);
router.post('/', roleMiddleware(['admin']), auditMiddleware('CREATE', 'system_series'), seriesController.create);
router.get('/:id', seriesController.getById);
router.put('/:id', roleMiddleware(['admin']), auditMiddleware('UPDATE', 'system_series'), seriesController.update);
router.delete('/:id', roleMiddleware(['admin']), auditMiddleware('DELETE', 'system_series'), seriesController.delete);

module.exports = router;
