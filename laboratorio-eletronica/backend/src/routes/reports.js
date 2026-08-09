const express = require('express');
const { getReports } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('PROFESSOR'));
router.get('/', getReports);

module.exports = router;
