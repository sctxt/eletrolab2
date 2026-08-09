const prisma = require('../config/prisma');
const { loadTeacherProfile } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

async function getReports(req, res, next) {
  try {
    const teacher = await loadTeacherProfile(req.user.id);
    if (!teacher) throw new AppError('Perfil de professor não encontrado.', 404);

    const now = new Date();

    const [students, teams, assignments, submissions] = await Promise.all([
      prisma.student.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
          submissions: {
            where: { assignment: { teacherId: teacher.id } },
            select: { id: true, grade: true, status: true, submittedAt: true }
          },
          teamMembers: { include: { team: { select: { id: true, name: true } } } }
        }
      }),
      prisma.team.findMany({
        include: {
          leader: { include: { user: { select: { name: true } } } },
          members: true,
          _count: { select: { members: true } }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.assignment.findMany({
        where: { teacherId: teacher.id },
        include: {
          _count: { select: { questions: true, submissions: true } },
          submissions: { select: { status: true, grade: true } }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.submission.findMany({
        where: { assignment: { teacherId: teacher.id } },
        include: {
          student: { include: { user: { select: { name: true } } } },
          assignment: { select: { title: true } }
        },
        orderBy: { submittedAt: 'desc' },
        take: 200
      })
    ]);

    const studentAverages = students
      .map((s) => {
        const graded = s.submissions.filter((sub) => sub.grade !== null);
        const avg = graded.length > 0 ? graded.reduce((a, b) => a + b.grade, 0) / graded.length : 0;
        const submitted = s.submissions.filter((sub) => sub.status !== 'ATRASADA').length;
        const late = s.submissions.filter((sub) => sub.status === 'ATRASADA' || sub.late).length;
        return {
          name: s.user.name,
          registrationNumber: s.registrationNumber,
          average: Math.round(avg * 100) / 100,
          submitted,
          late,
          totalLists: assignments.length,
          submissions: s.submissions.length
        };
      })
      .sort((a, b) => b.average - a.average);

    const totalPublished = assignments.filter((a) => a.status === 'PUBLICADA').length;
    const totalSubmissions = submissions.length;
    const expectedSubmissions = totalPublished * students.length;
    const deliveryRate =
      expectedSubmissions > 0 ? Math.round((totalSubmissions / expectedSubmissions) * 100) : 0;

    const lateLists = assignments.filter((a) => {
      const subs = a.submissions.length;
      return a.status === 'PUBLICADA' && subs === 0 && new Date(a.dueDate) < now;
    });

    const teamPerformance = teams.map((t) => {
      const memberIds = t.members.map((m) => m.studentId);
      const teamSubs = submissions.filter((s) => memberIds.includes(s.studentId));
      const graded = teamSubs.filter((s) => s.grade !== null);
      const avg = graded.length > 0 ? graded.reduce((a, b) => a + b.grade, 0) / graded.length : 0;
      return {
        id: t.id,
        name: t.name,
        leader: t.leader.user.name,
        membersCount: t.members.length,
        submissions: teamSubs.length,
        average: Math.round(avg * 100) / 100
      };
    });

    const activityCount = new Map();
    for (const s of submissions) {
      const name = s.student.user.name;
      activityCount.set(name, (activityCount.get(name) || 0) + 1);
    }
    const mostActive = [...activityCount.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const responsesByList = assignments.map((a) => ({
      title: a.title,
      status: a.status,
      submitted: a._count.submissions,
      questions: a._count.questions
    }));

    return res.json({
      totalStudents: students.length,
      totalTeams: teams.length,
      totalPublished,
      totalSubmissions,
      deliveryRate,
      studentAverages,
      lateLists: lateLists.map((a) => ({ id: a.id, title: a.title, dueDate: a.dueDate })),
      teamPerformance,
      mostActive,
      responsesByList
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getReports };
