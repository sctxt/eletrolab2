const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

const VALID_ROLES = ['ALUNO', 'PROFESSOR', 'ADMIN'];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function getStats(req, res, next) {
  try {
    const [students, teachers, admins, activeStudents, activeTeachers] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.student.count({ where: { user: { is: { active: true } } } }),
      prisma.teacher.count({ where: { user: { is: { active: true } } } })
    ]);

    return res.json({
      stats: {
        students,
        teachers,
        admins,
        activeStudents,
        activeTeachers,
        inactiveStudents: students - activeStudents,
        inactiveTeachers: teachers - activeTeachers
      }
    });
  } catch (err) {
    return next(err);
  }
}

async function listAccounts(req, res, next) {
  try {
    const { role, status, search } = req.query;
    const where = {};

    if (role) {
      const normalizedRole = String(role).toUpperCase();
      if (VALID_ROLES.includes(normalizedRole)) where.role = normalizedRole;
    }
    if (status === 'ativo') where.active = true;
    if (status === 'inativo') where.active = false;

    if (search && String(search).trim()) {
      const term = String(search).trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { student: { is: { registrationNumber: { contains: term } } } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: { student: true, teacher: true },
      orderBy: { createdAt: 'desc' }
    });

    const accounts = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt,
      ...(u.student
        ? {
            registrationNumber: u.student.registrationNumber,
            course: u.student.course,
            semester: u.student.semester
          }
        : {}),
      ...(u.teacher ? { teacherId: u.teacher.id } : {})
    }));

    return res.json({ accounts, count: accounts.length });
  } catch (err) {
    return next(err);
  }
}

async function createAccount(req, res, next) {
  try {
    const { name, email, password, role, registrationNumber, course, semester } = req.body;

    const normalizedRole = String(role || '').toUpperCase();
    if (!VALID_ROLES.includes(normalizedRole)) {
      throw new AppError('Papel inválido. Escolha Aluno, Professor ou Administrador.', 400);
    }
    if (!name || !String(name).trim()) throw new AppError('Informe o nome.', 400);
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) throw new AppError('Informe o e-mail.', 400);
    if (!password || String(password).length < 6) {
      throw new AppError('A senha deve ter pelo menos 6 caracteres.', 400);
    }

    const emailExists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (emailExists) throw new AppError('Este e-mail já está em uso.', 409);

    const hashed = await bcrypt.hash(password, config.bcryptRounds);
    const cleanName = String(name).trim();

    let user;
    if (normalizedRole === 'ALUNO') {
      const registration = String(registrationNumber || '').trim();
      if (!registration) throw new AppError('Informe a matrícula do aluno.', 400);
      if (!course || !String(course).trim()) throw new AppError('Informe o curso do aluno.', 400);

      const regExists = await prisma.student.findUnique({ where: { registrationNumber: registration } });
      if (regExists) throw new AppError('Esta matrícula já está em uso.', 409);

      user = await prisma.user.create({
        data: {
          name: cleanName,
          email: normalizedEmail,
          password: hashed,
          role: 'ALUNO',
          student: {
            create: {
              registrationNumber: registration,
              course: String(course).trim(),
              semester: Number(semester) || 1
            }
          }
        }
      });
    } else if (normalizedRole === 'PROFESSOR') {
      user = await prisma.user.create({
        data: {
          name: cleanName,
          email: normalizedEmail,
          password: hashed,
          role: 'PROFESSOR',
          teacher: { create: {} }
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: cleanName,
          email: normalizedEmail,
          password: hashed,
          role: 'ADMIN'
        }
      });
    }

    return res.status(201).json({ message: 'Conta criada com sucesso.', account: { id: user.id } });
  } catch (err) {
    return next(err);
  }
}

async function updateAccount(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, password, active, course, semester } = req.body;

    const user = await prisma.user.findUnique({ where: { id }, include: { student: true } });
    if (!user) throw new AppError('Conta não encontrada.', 404);

    const data = {};
    if (name !== undefined) {
      if (!String(name).trim()) throw new AppError('O nome não pode ser vazio.', 400);
      data.name = String(name).trim();
    }
    if (email !== undefined) {
      const normalized = normalizeEmail(email);
      if (!normalized) throw new AppError('O e-mail não pode ser vazio.', 400);
      const exists = await prisma.user.findFirst({
        where: { email: normalized, id: { not: id } }
      });
      if (exists) throw new AppError('Este e-mail já está em uso.', 409);
      data.email = normalized;
    }
    if (password) {
      if (String(password).length < 6) {
        throw new AppError('A senha deve ter pelo menos 6 caracteres.', 400);
      }
      data.password = await bcrypt.hash(password, config.bcryptRounds);
    }
    if (active !== undefined) data.active = Boolean(active);

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id }, data });
    }

    if (user.role === 'ALUNO' && user.student) {
      const studentData = {};
      if (course !== undefined) {
        if (!String(course).trim()) throw new AppError('O curso não pode ser vazio.', 400);
        studentData.course = String(course).trim();
      }
      if (semester !== undefined) studentData.semester = Number(semester);
      if (Object.keys(studentData).length > 0) {
        await prisma.student.update({ where: { id: user.student.id }, data: studentData });
      }
    }

    return res.json({ message: 'Conta atualizada com sucesso.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getStats, listAccounts, createAccount, updateAccount };
