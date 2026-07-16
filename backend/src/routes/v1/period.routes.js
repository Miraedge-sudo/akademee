const express = require('express');
const periodService = require('../../services/period.service');
const authMiddleware = require('../../middleware/auth.middleware');
const response = require('../../utils/response');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const schoolId = req.schoolId || req.user.schoolId;
    const result = await periodService.listBySchool(schoolId);
    const mapped = (result.periods || []).map(p => ({
      id: p.id,
      label: p.name,
    }));
    response.success(res, 'Periodes retrieved', mapped);
  } catch (error) { next(error); }
});

module.exports = router;
