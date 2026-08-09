const express = require('express');
const {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
  duplicateAssignment
} = require('../controllers/assignmentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', listAssignments);
router.post('/', authorize('PROFESSOR'), createAssignment);
router.get('/:id', getAssignment);
router.put('/:id', authorize('PROFESSOR'), updateAssignment);
router.delete('/:id', authorize('PROFESSOR'), deleteAssignment);
router.post('/:id/publish', authorize('PROFESSOR'), publishAssignment);
router.post('/:id/duplicate', authorize('PROFESSOR'), duplicateAssignment);

module.exports = router;
