const express = require('express');
const router = express.Router();

// TODO: implement controllers
router.get('/', (req, res) => res.json({ message: 'List schools' }));

module.exports = router;
