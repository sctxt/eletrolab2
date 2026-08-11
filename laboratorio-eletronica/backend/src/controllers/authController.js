const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const config = require('../config');
const { signToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function studentLogin(req, res, next) {
  try {
    const { registrationNumber, password } = req.body;
    if (!registrationNumber || !password) {
      throw new AppError('Informe a matrícula e a senha.', 400);
    }

    const student = await prisma.student.findUnique({
      where: { registrationNumber: String(registrationNumber).trim() },
      include: { user: true }
    });

    if (!student || !student.user.active) {
      throw new AppError('Matrícula ou senha inválidos.', 401);
    }

    const valid = await bcrypt.compare(password, student.user.password);
    if (!valid) {
      throw new AppError('Matrícula ou senha inválidos.', 401);
    }

    const token = signToken({ id: student.user.id, role: student.user.role });

    return res.json({
      token,
      user: {
        id: student.user.id,
        name: student.user.name,
        email: student.user.email,
        role: student.user.role,
        student: {
          id: student.id,
          registrationNumber: student.registrationNumber,
          course: student.course,
          semester: student.semester
        }
      }
    });
  } catch (err) {
    return next(err);
  }
}

async function adminLogin(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new AppError('Informe o usuário e a senha.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(username) }
    });

    if (!user || user.role !== 'ADMIN' || !user.active) {
      throw new AppError('Usuário ou senha inválidos.', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError('Usuário ou senha inválidos.', 401);
    }

    const token = signToken({ id: user.id, role: user.role });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return next(err);
  }
}

async function teacherLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Informe o e-mail e a senha.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      include: { teacher: true }
    });

    if (!user || user.role !== 'PROFESSOR' || !user.active) {
      throw new AppError('E-mail ou senha inválidos.', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError('E-mail ou senha inválidos.', 401);
    }

    const token = signToken({ id: user.id, role: user.role });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teacher: { id: user.teacher.id }
      }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { studentLogin, teacherLogin, adminLogin };
