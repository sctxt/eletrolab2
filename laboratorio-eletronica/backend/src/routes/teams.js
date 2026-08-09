const express = require('express');
const {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  inviteStudents,
  removeMember,
  leaveTeam,
  transferLeadership,
  listMyInvitations
} = require('../controllers/teamController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/invitations', authorize('ALUNO'), listMyInvitations);
router.post('/', authorize('ALUNO'), createTeam);
router.get('/', listTeams);
router.get('/:id', getTeam);
router.put('/:id', authorize('ALUNO', 'PROFESSOR'), updateTeam);
router.delete('/:id', authorize('ALUNO', 'PROFESSOR'), deleteTeam);
router.post('/:id/invitations', authorize('ALUNO', 'PROFESSOR'), inviteStudents);
router.post('/:id/leave', authorize('ALUNO'), leaveTeam);
router.post('/:id/transfer', authorize('ALUNO'), transferLeadership);
router.delete('/:id/members/:studentId', authorize('ALUNO', 'PROFESSOR'), removeMember);

module.exports = router;
