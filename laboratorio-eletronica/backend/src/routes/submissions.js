const express = require('express');
const {
  submitAssignment,
  listSubmissions,
  getSubmission,
  gradeSubmission,
  mySubmissions,
  listAllSubmissions
} = require('../controllers/submissionController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/mine', authorize('ALUNO'), mySubmissions);
router.get('/', authorize('PROFESSOR'), listAllSubmissions);
router.post('/assignments/:id/submit', authorize('ALUNO'), submitAssignment);
router.get('/assignments/:id/submissions', authorize('PROFESSOR'), listSubmissions);
router.get('/:id', getSubmission);
router.put('/:id/grade', authorize('PROFESSOR'), gradeSubmission);

module.exports = router;
