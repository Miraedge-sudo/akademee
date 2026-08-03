const { body, param, query } = require('express-validator');

// ── Common ──
const uuidParamValidator = (name = 'id') => [
  param(name).isUUID().withMessage(`${name} must be a valid UUID`),
];

const idParamValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
];

const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

// ── Faculties ──
const createFacultyValidator = [
  body('name').trim().notEmpty().withMessage('Faculty name is required').isLength({ max: 255 }),
  body('name_fr').optional().trim().isLength({ max: 255 }),
  body('code').trim().notEmpty().withMessage('Faculty code is required').isLength({ max: 20 }),
  body('dean_name').optional().trim().isLength({ max: 255 }),
  body('description').optional().trim(),
  body('phone').optional().trim().isLength({ max: 50 }),
  body('email').optional().trim().isEmail().withMessage('Invalid email'),
  body('building').optional().trim().isLength({ max: 255 }),
  body('established_year').optional().isInt({ min: 1500, max: 2200 }).withMessage('Invalid year'),
  body('is_active').optional().isBoolean(),
];

const updateFacultyValidator = [
  ...idParamValidator,
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('name_fr').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('code').optional().trim().notEmpty().isLength({ max: 20 }),
  body('dean_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('phone').optional({ values: 'null' }).trim().isLength({ max: 50 }),
  body('email').optional({ values: 'null' }).trim().isEmail(),
  body('building').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('established_year').optional({ values: 'null' }).isInt({ min: 1500, max: 2200 }),
  body('is_active').optional().isBoolean(),
];

// ── Departments ──
const createDepartmentValidator = [
  body('faculty_id').isUUID().withMessage('faculty_id must be a valid UUID'),
  body('name').trim().notEmpty().withMessage('Department name is required').isLength({ max: 255 }),
  body('name_fr').optional().trim().isLength({ max: 255 }),
  body('code').trim().notEmpty().withMessage('Department code is required').isLength({ max: 20 }),
  body('head_name').optional().trim().isLength({ max: 255 }),
  body('description').optional().trim(),
  body('phone').optional().trim().isLength({ max: 50 }),
  body('email').optional().trim().isEmail(),
  body('is_active').optional().isBoolean(),
];

const updateDepartmentValidator = [
  ...idParamValidator,
  body('faculty_id').optional().isUUID(),
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('name_fr').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('code').optional().trim().notEmpty().isLength({ max: 20 }),
  body('head_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('phone').optional({ values: 'null' }).trim().isLength({ max: 50 }),
  body('email').optional({ values: 'null' }).trim().isEmail(),
  body('is_active').optional().isBoolean(),
];

// ── Programs ──
const createProgramValidator = [
  body('department_id').optional({ values: 'null' }).isUUID(),
  body('faculty_id').optional({ values: 'null' }).isUUID(),
  body('name').trim().notEmpty().withMessage('Program name is required').isLength({ max: 255 }),
  body('name_fr').optional().trim().isLength({ max: 255 }),
  body('code').trim().notEmpty().withMessage('Program code is required').isLength({ max: 20 }),
  body('cycle').isIn(['LICENCE', 'MASTER', 'DOCTORATE']).withMessage('Invalid cycle'),
  body('duration_years').isInt({ min: 1, max: 10 }).withMessage('duration_years must be 1-10'),
  body('credits_total').optional({ values: 'null' }).isInt({ min: 0 }),
  body('description').optional({ values: 'null' }).trim(),
  body('admission_requirements').optional({ values: 'null' }).trim(),
  body('career_opportunities').optional({ values: 'null' }).trim(),
  body('language').optional().isIn(['FR', 'EN', 'BILINGUAL']).withMessage('Invalid language'),
  body('is_active').optional().isBoolean(),
];

const updateProgramValidator = [
  ...idParamValidator,
  body('department_id').optional({ values: 'null' }).isUUID(),
  body('faculty_id').optional({ values: 'null' }).isUUID(),
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('name_fr').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('code').optional().trim().notEmpty().isLength({ max: 20 }),
  body('cycle').optional().isIn(['LICENCE', 'MASTER', 'DOCTORATE']),
  body('duration_years').optional().isInt({ min: 1, max: 10 }),
  body('credits_total').optional({ values: 'null' }).isInt({ min: 0 }),
  body('description').optional({ values: 'null' }).trim(),
  body('admission_requirements').optional({ values: 'null' }).trim(),
  body('career_opportunities').optional({ values: 'null' }).trim(),
  body('language').optional().isIn(['FR', 'EN', 'BILINGUAL']),
  body('is_active').optional().isBoolean(),
];

// ── Research Projects ──
const createResearchProjectValidator = [
  body('department_id').optional({ values: 'null' }).isUUID(),
  body('faculty_id').optional({ values: 'null' }).isUUID(),
  body('title').trim().notEmpty().withMessage('Project title is required').isLength({ max: 500 }),
  body('title_fr').optional().trim().isLength({ max: 500 }),
  body('status').optional().isIn(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']),
  body('start_date').optional({ values: 'null' }).isISO8601(),
  body('end_date').optional({ values: 'null' }).isISO8601(),
  body('funding_source').optional({ values: 'null' }).trim().isLength({ max: 500 }),
  body('budget').optional({ values: 'null' }).isFloat({ min: 0 }),
  body('principal_investigator').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('investigators').optional().isArray(),
  body('summary').optional({ values: 'null' }).trim(),
  body('keywords').optional().isArray(),
  body('is_published').optional().isBoolean(),
];

const updateResearchProjectValidator = [
  ...idParamValidator,
  body('department_id').optional({ values: 'null' }).isUUID(),
  body('faculty_id').optional({ values: 'null' }).isUUID(),
  body('title').optional().trim().notEmpty().isLength({ max: 500 }),
  body('title_fr').optional({ values: 'null' }).trim().isLength({ max: 500 }),
  body('status').optional().isIn(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']),
  body('start_date').optional({ values: 'null' }).isISO8601(),
  body('end_date').optional({ values: 'null' }).isISO8601(),
  body('funding_source').optional({ values: 'null' }).trim().isLength({ max: 500 }),
  body('budget').optional({ values: 'null' }).isFloat({ min: 0 }),
  body('principal_investigator').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('investigators').optional().isArray(),
  body('summary').optional({ values: 'null' }).trim(),
  body('keywords').optional().isArray(),
  body('is_published').optional().isBoolean(),
];

// ── Publications ──
const createPublicationValidator = [
  body('research_project_id').optional({ values: 'null' }).isUUID(),
  body('department_id').optional({ values: 'null' }).isUUID(),
  body('faculty_id').optional({ values: 'null' }).isUUID(),
  body('title').trim().notEmpty().withMessage('Publication title is required').isLength({ max: 500 }),
  body('title_fr').optional().trim().isLength({ max: 500 }),
  body('type').isIn(['JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'THESIS', 'BOOK', 'BOOK_CHAPTER', 'REPORT', 'OTHER']),
  body('authors').isArray({ min: 1 }).withMessage('authors must be a non-empty array'),
  body('journal_name').optional({ values: 'null' }).trim().isLength({ max: 500 }),
  body('publisher').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('doi').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('issn').optional({ values: 'null' }).trim().isLength({ max: 20 }),
  body('isbn').optional({ values: 'null' }).trim().isLength({ max: 20 }),
  body('publication_date').optional({ values: 'null' }).isISO8601(),
  body('volume').optional({ values: 'null' }).trim().isLength({ max: 50 }),
  body('issue').optional({ values: 'null' }).trim().isLength({ max: 50 }),
  body('pages').optional({ values: 'null' }).trim().isLength({ max: 50 }),
  body('abstract').optional({ values: 'null' }).trim(),
  body('keywords').optional().isArray(),
  body('url').optional({ values: 'null' }).trim().isLength({ max: 500 }),
  body('citation').optional({ values: 'null' }).trim(),
  body('is_published').optional().isBoolean(),
];

const updatePublicationValidator = [
  ...idParamValidator,
  body('research_project_id').optional({ values: 'null' }).isUUID(),
  body('department_id').optional({ values: 'null' }).isUUID(),
  body('faculty_id').optional({ values: 'null' }).isUUID(),
  body('title').optional().trim().notEmpty().isLength({ max: 500 }),
  body('title_fr').optional({ values: 'null' }).trim().isLength({ max: 500 }),
  body('type').optional().isIn(['JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'THESIS', 'BOOK', 'BOOK_CHAPTER', 'REPORT', 'OTHER']),
  body('authors').optional().isArray({ min: 1 }),
  body('journal_name').optional({ values: 'null' }).trim().isLength({ max: 500 }),
  body('publisher').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('doi').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('issn').optional({ values: 'null' }).trim().isLength({ max: 20 }),
  body('isbn').optional({ values: 'null' }).trim().isLength({ max: 20 }),
  body('publication_date').optional({ values: 'null' }).isISO8601(),
  body('volume').optional({ values: 'null' }).trim().isLength({ max: 50 }),
  body('issue').optional({ values: 'null' }).trim().isLength({ max: 50 }),
  body('pages').optional({ values: 'null' }).trim().isLength({ max: 50 }),
  body('abstract').optional({ values: 'null' }).trim(),
  body('keywords').optional().isArray(),
  body('url').optional({ values: 'null' }).trim().isLength({ max: 500 }),
  body('citation').optional({ values: 'null' }).trim(),
  body('is_published').optional().isBoolean(),
];

module.exports = {
  idParamValidator,
  uuidParamValidator,
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
};
