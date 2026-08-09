const prisma = require('../config/prisma');
const { loadStudentProfile, loadTeacherProfile } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

async function studentDashboard(req, res, next) {
  try {
    const student = await loadStudentProfile(req.user.id);
    if (!student) throw new AppError('Perfil de estudante não encontrado.', 404);

    const now = new Date();
    const [publishedAssignments, mySubmissions, myTeams, invitations, notifications, recent] = await Promise.all([
      prisma.assignment.findMany({
        where: { status: 'PUBLICADA' },
        include: {
          teacher: { include: { user: { select: { name: true } } } },
          submissions: { where: { studentId: student.id }, select: { id: true, status: true, grade: true, submittedAt: true } }
        },
        orderBy: { dueDate: 'asc' }
      }),
      prisma.submission.findMany({
        where: { studentId: student.id },
        include: { assignment: { select: { id: true, title: true, dueDate: true } } },
        orderBy: { submittedAt: 'desc' }
      }),
      prisma.team.findMany({
        where: {
          OR: [{ leaderId: student.id }, { members: { some: { studentId: student.id } } }]
        },
        include: {
          leader: { include: { user: { select: { name: true } } } },
          members: { include: { student: { include: { user: { select: { name: true } } } } } }
        }
      }),
      prisma.teamInvitation.findMany({
        where: { studentId: student.id, status: 'PENDENTE' },
        include: { team: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 6
      }),
      prisma.assignment.findMany({
        where: {
          status: 'PUBLICADA',
          submissions: { none: { studentId: student.id } }
        },
        select: { id: true, title: true, dueDate: true },
        orderBy: { dueDate: 'asc' }
      })
    ]);

    const gradedSubmissions = mySubmissions.filter((s) => s.grade !== null);
    const average =
      gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((acc, s) => acc + s.grade, 0) / gradedSubmissions.length
        : null;

    let completedCount = 0;
    let pendingCount = 0;
    const upcomingDeadlines = [];
    for (const a of publishedAssignments) {
      const submission = a.submissions[0];
      const isLate = !submission && new Date(a.dueDate) < now;
      if (submission) completedCount += 1;
      else pendingCount += 1;
      if (!submission) {
        upcomingDeadlines.push({ id: a.id, title: a.title, dueDate: a.dueDate, late: isLate });
      }
    }
    upcomingDeadlines.sort((x, y) => new Date(x.dueDate) - new Date(y.dueDate));

    const recentActivities = mySubmissions.slice(0, 5).map((s) => ({
      type: 'ENVIO',
      title: s.assignment.title,
      date: s.submittedAt,
      status: s.status
    }));

    const unreadNotifications = notifications.filter((n) => !n.read).length;

    return res.json({
      stats: {
        pendingCount,
        completedCount,
        teamCount: myTeams.length,
        average,
        totalLists: publishedAssignments.length
      },
      myTeams,
      invitations,
      upcomingDeadlines,
      recentActivities,
      notifications,
      unreadNotifications
    });
  } catch (err) {
    return next(err);
  }
}

async function teacherDashboard(req, res, next) {
  try {
    const teacher = await loadTeacherProfile(req.user.id);
    if (!teacher) throw new AppError('Perfil de professor não encontrado.', 404);

    const now = new Date();
    const [students, teams, assignments, submissions, ungraded, recentSubmissions, upcoming, notifications, recent] =
      await Promise.all([
        prisma.student.count(),
        prisma.team.count(),
        prisma.assignment.count({ where: { teacherId: teacher.id } }),
        prisma.submission.count({ where: { assignment: { teacherId: teacher.id } } }),
        prisma.submission.count({
          where: { assignment: { teacherId: teacher.id }, status: 'ENVIADA' }
        }),
        prisma.submission.findMany({
          where: { assignment: { teacherId: teacher.id } },
          include: {
            student: { include: { user: { select: { name: true } } } },
            assignment: { select: { title: true } }
          },
          orderBy: { submittedAt: 'desc' },
          take: 6
        }),
        prisma.assignment.findMany({
          where: { teacherId: teacher.id, status: 'PUBLICADA', dueDate: { gte: now } },
          orderBy: { dueDate: 'asc' },
          take: 6
        }),
        prisma.notification.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          take: 6
        }),
        prisma.assignment.findMany({
          where: { teacherId: teacher.id, status: 'PUBLICADA' },
          include: { _count: { select: { submissions: true } } },
          orderBy: { createdAt: 'asc' }
        })
      ]);

    const unreadNotifications = notifications.filter((n) => !n.read).length;

    const performance = recent.map((a) => ({
      title: a.title,
      submissions: a._count.submissions
    }));

    return res.json({
      stats: {
        totalStudents: students,
        totalTeams: teams,
        publishedLists: assignments,
        pendingResponses: submissions,
        pendingGrading: ungraded
      },
      recentSubmissions,
      upcomingDeadlines: upcoming,
      notifications,
      unreadNotifications,
      performance
    });
  } catch (err) {
    return next(err);
  }
}

async function dashboard(req, res, next) {
  try {
    if (req.user.role === 'ALUNO') {
      return studentDashboard(req, res, next);
    }
    return teacherDashboard(req, res, next);
  } catch (err) {
    return next(err);
  }
}

module.exports = { dashboard };
