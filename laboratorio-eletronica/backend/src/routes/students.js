const express = require('express');
const {
  listStudents,
  searchStudents,
  getStudent,
  updateStudent
} = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/search', authorize('ALUNO', 'PROFESSOR'), searchStudents);
router.get('/', authorize('PROFESSOR'), listStudents);
router.get('/:id', authorize('PROFESSOR'), getStudent);
router.put('/:id', authorize('PROFESSOR'), updateStudent);

module.exports = router;
