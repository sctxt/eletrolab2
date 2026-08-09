const prisma = require('../config/prisma');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');

async function listStudents(req, res, next) {
  try {
    const { search, course, status } = req.query;
    const where = {};

    if (search) {
      const term = String(search);
      where.OR = [
        { registrationNumber: { contains: term, mode: 'insensitive' } },
        { user: { name: { contains: term, mode: 'insensitive' } } }
      ];
    }
    if (course) where.course = String(course);
    if (status === 'ativo') where.user = { is: { active: true } };
    if (status === 'inativo') where.user = { is: { active: false } };

    const students = await prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, active: true, role: true, createdAt: true } },
        teamMembers: { include: { team: { select: { id: true, name: true } } } },
        ledTeams: { select: { id: true, name: true } }
      },
      orderBy: { user: { name: 'asc' } }
    });

    const result = students.map((s) => ({
      id: s.id,
      registrationNumber: s.registrationNumber,
      course: s.course,
      semester: s.semester,
      user: s.user,
      teams: s.teamMembers.map((tm) => tm.team),
      ledTeams: s.ledTeams
    }));

    return res.json({ students: result });
  } catch (err) {
    return next(err);
  }
}

async function searchStudents(req, res, next) {
  try {
    const { term } = req.query;
    if (!term || String(term).trim().length < 2) {
      return res.json({ students: [] });
    }
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { registrationNumber: { contains: String(term).trim(), mode: 'insensitive' } },
          { user: { name: { contains: String(term).trim(), mode: 'insensitive' } } }
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        teamMembers: { include: { team: { select: { id: true, name: true } } } }
      },
      take: 20,
      orderBy: { user: { name: 'asc' } }
    });
    return res.json({
      students: students.map((s) => ({
        id: s.id,
        registrationNumber: s.registrationNumber,
        course: s.course,
        semester: s.semester,
        user: s.user,
        teams: s.teamMembers.map((tm) => tm.team)
      }))
    });
  } catch (err) {
    return next(err);
  }
}

async function getStudent(req, res, next) {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, active: true, createdAt: true } },
        teamMembers: { include: { team: { select: { id: true, name: true, description: true } } } },
        submissions: {
          include: { assignment: { select: { id: true, title: true, dueDate: true, status: true } } },
          orderBy: { submittedAt: 'desc' }
        }
      }
    });
    if (!student) throw new AppError('Estudante não encontrado.', 404);
    return res.json({ student });
  } catch (err) {
    return next(err);
  }
}

async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, course, semester, active, password } = req.body;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError('Estudante não encontrado.', 404);

    const userData = {};
    if (name !== undefined) {
      if (!String(name).trim()) throw new AppError('O nome não pode ser vazio.', 400);
      userData.name = String(name).trim();
    }
    if (email !== undefined) {
      const normalized = String(email).trim().toLowerCase();
      if (!normalized) throw new AppError('O e-mail não pode ser vazio.', 400);
      const exists = await prisma.user.findFirst({ where: { email: normalized, id: { not: student.userId } } });
      if (exists) throw new AppError('Este e-mail já está em uso.', 409);
      userData.email = normalized;
    }
    if (active !== undefined) userData.active = Boolean(active);
    if (password) {
      if (String(password).length < 6) throw new AppError('A senha deve ter pelo menos 6 caracteres.', 400);
      userData.password = await bcrypt.hash(password, config.bcryptRounds);
    }

    const studentData = {};
    if (course !== undefined) studentData.course = String(course).trim();
    if (semester !== undefined) studentData.semester = Number(semester);

    const updated = await prisma.$transaction([
      prisma.user.update({ where: { id: student.userId }, data: userData }),
      prisma.student.update({ where: { id }, data: studentData })
    ]);

    return res.json({ message: 'Estudante atualizado com sucesso.', student: updated[1] });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listStudents, searchStudents, getStudent, updateStudent };
