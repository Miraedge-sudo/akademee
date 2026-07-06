/**
 * Public app configuration routes
 */

const express = require('express');
const { getPublicDomainConfig, resolveSubdomain } = require('../utils/domainHelper');
const response = require('../utils/response');

const router = express.Router();

router.get('/', (req, res) => {
  response.success(res, 'App configuration', {
    appName: 'Akademee',
    version: '1.0.0',
    languages: ['en', 'fr'],
    defaultLanguage: 'en',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@akademee.com',
    plans: [
      { code: 'free', name: 'Free', maxStudents: 50, price: 0 },
      { code: 'basic', name: 'Basic', maxStudents: 200, price: 29 },
      { code: 'premium', name: 'Premium', maxStudents: 1000, price: 79 },
      { code: 'enterprise', name: 'Enterprise', maxStudents: -1, price: 199 },
    ],
  });
});

router.get('/domains', (req, res) => {
  response.success(res, 'Domain configuration retrieved', getPublicDomainConfig());
});

router.get('/tenant', (req, res) => {
  const subdomain = resolveSubdomain(req);

  response.success(res, 'Tenant resolution check', {
    host: req.get('host'),
    subdomain: subdomain || null,
    schoolId: req.schoolId || null,
    schoolName: req.school?.name || null,
    resolved: Boolean(req.schoolId),
  });
});

/**
 * @openapi
 * /api/config:
 *   get:
 *     tags: [Config]
 *     summary: Get public app configuration
 *     responses:
 *       200:
 *         description: App configuration
 *
 * /api/config/domains:
 *   get:
 *     tags: [Config]
 *     summary: Get domain configuration
 *     responses:
 *       200:
 *         description: Domain configuration
 *
 * /api/config/tenant:
 *   get:
 *     tags: [Config]
 *     summary: Resolve tenant from subdomain
 *     responses:
 *       200:
 *         description: Tenant resolution
 */
module.exports = router;
