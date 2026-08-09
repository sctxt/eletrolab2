const express = require('express');
const { studentLogin, teacherLogin } = require('../controllers/authController');

const router = express.Router();

router.post('/student/login', studentLogin);
router.post('/teacher/login', teacherLogin);

module.exports = router;
