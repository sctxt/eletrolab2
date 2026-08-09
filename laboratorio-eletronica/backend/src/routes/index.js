const express = require('express');
const authRoutes = require('./auth');
const studentRoutes = require('./students');
const teamRoutes = require('./teams');
const invitationRoutes = require('./invitations');
const assignmentRoutes = require('./assignments');
const submissionRoutes = require('./submissions');
const notificationRoutes = require('./notifications');
const profileRoutes = require('./profile');
const dashboardRoutes = require('./dashboard');
const reportRoutes = require('./reports');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API do Laboratório de Eletrônica operacional.' });
});

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/teams', teamRoutes);
router.use('/invitations', invitationRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/profile', profileRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
