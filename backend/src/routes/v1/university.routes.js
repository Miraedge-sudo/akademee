const express = require('express');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');
const auditMiddleware = require('../../middleware/audit.middleware');
const validateMiddleware = require('../../middleware/validate.middleware');

const facultyController = require('../../controllers/university/faculty.controller');
const departmentController = require('../../controllers/university/department.controller');
const programController = require('../../controllers/university/program.controller');
const researchProjectController = require('../../controllers/university/researchProject.controller');
const publicationController = require('../../controllers/university/publication.controller');

const {
  idParamValidator,
  paginationValidator,
  createFacultyValidator,
  updateFacultyValidator,
  createDepartmentValidator,
  updateDepartmentValidator,
  createProgramValidator,
  updateProgramValidator,
  createResearchProjectValidator,
  updateResearchProjectValidator,
  createPublicationValidator,
  updatePublicationValidator,
} = require('../../validators/university.validator');

const router = express.Router();
const writeRole = roleMiddleware(['admin']);

// ── Public (tenant-scoped via subdomain, no JWT required) ──
router.get('/research/public', paginationValidator, validateMiddleware, researchProjectController.listPublic);
router.get('/publications/public', paginationValidator, validateMiddleware, publicationController.listPublic);

// ── Authenticated (all roles read; admin writes) ──
router.use(authMiddleware);

// Faculties
router.get('/faculties', paginationValidator, validateMiddleware, facultyController.list);
router.get('/faculties/:id/stats', idParamValidator, validateMiddleware, facultyController.getStats);
router.get('/faculties/:id/programs', [...idParamValidator, ...paginationValidator], validateMiddleware, facultyController.listPrograms);
router.get('/faculties/:id', idParamValidator, validateMiddleware, facultyController.getById);
router.post('/faculties', writeRole, createFacultyValidator, validateMiddleware, auditMiddleware('CREATE', 'faculties'), facultyController.create);
router.put('/faculties/:id', writeRole, updateFacultyValidator, validateMiddleware, auditMiddleware('UPDATE', 'faculties'), facultyController.update);
router.delete('/faculties/:id', writeRole, idParamValidator, validateMiddleware, auditMiddleware('DELETE', 'faculties'), facultyController.delete);

// Departments
router.get('/departments', paginationValidator, validateMiddleware, departmentController.list);
router.get('/departments/:id', idParamValidator, validateMiddleware, departmentController.getById);
router.post('/departments', writeRole, createDepartmentValidator, validateMiddleware, auditMiddleware('CREATE', 'departments'), departmentController.create);
router.put('/departments/:id', writeRole, updateDepartmentValidator, validateMiddleware, auditMiddleware('UPDATE', 'departments'), departmentController.update);
router.delete('/departments/:id', writeRole, idParamValidator, validateMiddleware, auditMiddleware('DELETE', 'departments'), departmentController.delete);

// Programs
router.get('/programs', paginationValidator, validateMiddleware, programController.list);
router.get('/programs/:id', idParamValidator, validateMiddleware, programController.getById);
router.post('/programs', writeRole, createProgramValidator, validateMiddleware, auditMiddleware('CREATE', 'programs'), programController.create);
router.put('/programs/:id', writeRole, updateProgramValidator, validateMiddleware, auditMiddleware('UPDATE', 'programs'), programController.update);
router.delete('/programs/:id', writeRole, idParamValidator, validateMiddleware, auditMiddleware('DELETE', 'programs'), programController.delete);

// Research Projects
router.get('/research', paginationValidator, validateMiddleware, researchProjectController.list);
router.get('/research/:id', idParamValidator, validateMiddleware, researchProjectController.getById);
router.post('/research', writeRole, createResearchProjectValidator, validateMiddleware, auditMiddleware('CREATE', 'research_projects'), researchProjectController.create);
router.put('/research/:id', writeRole, updateResearchProjectValidator, validateMiddleware, auditMiddleware('UPDATE', 'research_projects'), researchProjectController.update);
router.delete('/research/:id', writeRole, idParamValidator, validateMiddleware, auditMiddleware('DELETE', 'research_projects'), researchProjectController.delete);

// Publications
router.get('/publications', paginationValidator, validateMiddleware, publicationController.list);
router.get('/publications/:id', idParamValidator, validateMiddleware, publicationController.getById);
router.post('/publications', writeRole, createPublicationValidator, validateMiddleware, auditMiddleware('CREATE', 'publications'), publicationController.create);
router.put('/publications/:id', writeRole, updatePublicationValidator, validateMiddleware, auditMiddleware('UPDATE', 'publications'), publicationController.update);
router.delete('/publications/:id', writeRole, idParamValidator, validateMiddleware, auditMiddleware('DELETE', 'publications'), publicationController.delete);

module.exports = router;
