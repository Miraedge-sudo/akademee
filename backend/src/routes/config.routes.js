/**
 * Public app configuration routes
 */

const express = require('express');
const { getPublicDomainConfig, resolveSubdomain } = require('../utils/domainHelper');
const response = require('../utils/response');

const router = express.Router();

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

module.exports = router;
