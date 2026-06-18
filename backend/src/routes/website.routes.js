/**
 * Website routes — public school sites resolved by subdomain
 */

const express = require('express');
const websiteController = require('../controllers/website.controller');

const router = express.Router();

router.get('/public', websiteController.getWebsiteData);
router.get('/data', websiteController.getWebsiteData);

router.post('/template/update', websiteController.updateWebsiteTemplate);

module.exports = router;
