const express = require('express');
const sequenceController = require('../../controllers/sequence.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');
const auditMiddleware = require('../../middleware/audit.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/periode/:periodeId', sequenceController.listByPeriode);
router.post('/', roleMiddleware(['admin']), auditMiddleware('CREATE', 'sequences'), sequenceController.create);
router.get('/:id', sequenceController.getById);
router.put('/:id', roleMiddleware(['admin']), auditMiddleware('UPDATE', 'sequences'), sequenceController.update);
router.delete('/:id', roleMiddleware(['admin']), auditMiddleware('DELETE', 'sequences'), sequenceController.delete);
router.patch('/:id/open', roleMiddleware(['admin']), sequenceController.open);
router.patch('/:id/close', roleMiddleware(['admin']), sequenceController.close);
router.patch('/:id/lock', roleMiddleware(['admin']), sequenceController.lock);
router.patch('/:id/unlock', roleMiddleware(['admin']), sequenceController.unlock);

module.exports = router;
