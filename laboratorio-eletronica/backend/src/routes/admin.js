const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getStats,
  listAccounts,
  createAccount,
  updateAccount
} = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', getStats);
router.get('/accounts', listAccounts);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);

module.exports = router;
