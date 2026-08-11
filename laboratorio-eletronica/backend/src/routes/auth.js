const express = require('express');
const { studentLogin, teacherLogin, adminLogin } = require('../controllers/authController');

const router = express.Router();

router.post('/student/login', studentLogin);
router.post('/teacher/login', teacherLogin);
router.post('/admin/login', adminLogin);

module.exports = router;
