/**
 * Website routes — public school sites resolved by subdomain
 */

const express = require('express');
const websiteController = require('../controllers/website.controller');

const router = express.Router();

router.get('/public', websiteController.getWebsiteData);
router.get('/data', websiteController.getWebsiteData);

router.post('/template/update', websiteController.updateWebsiteTemplate);

/**
 * @openapi
 * /api/website/public:
 *   get:
 *     tags: [Website]
 *     summary: Get public website data by subdomain
 *     parameters:
 *       - in: query
 *         name: subdomain
 *         schema:
 *           type: string
 *         required: true
 *         description: School subdomain
 *     responses:
 *       200:
 *         description: Website data
 *
 * /api/website/data:
 *   get:
 *     tags: [Website]
 *     summary: Get website data (alias)
 *     parameters:
 *       - in: query
 *         name: subdomain
 *         schema:
 *           type: string
 *         required: true
 *         description: School subdomain
 *     responses:
 *       200:
 *         description: Website data
 *
 * /api/website/template/update:
 *   post:
 *     tags: [Website]
 *     summary: Update website template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Template updated
 */
module.exports = router;
