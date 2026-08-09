const express = require('express');
const { dashboard } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', dashboard);

module.exports = router;
