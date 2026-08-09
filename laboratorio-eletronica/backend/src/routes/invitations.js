const express = require('express');
const { acceptInvitation, rejectInvitation } = require('../controllers/invitationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('ALUNO'));

router.post('/:id/accept', acceptInvitation);
router.post('/:id/reject', rejectInvitation);

module.exports = router;
