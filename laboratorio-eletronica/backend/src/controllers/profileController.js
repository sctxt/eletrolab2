const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const { loadStudentProfile, loadTeacherProfile } = require('../middleware/auth');

async function getProfile(req, res, next) {
  try {
    let profile = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt
    };
    if (req.user.role === 'ALUNO') {
      const student = await loadStudentProfile(req.user.id);
      if (student) {
        profile.student = {
          id: student.id,
          registrationNumber: student.registrationNumber,
          course: student.course,
          semester: student.semester
        };
      }
    } else if (req.user.role === 'PROFESSOR') {
      const teacher = await loadTeacherProfile(req.user.id);
      if (teacher) profile.teacher = { id: teacher.id };
    }
    return res.json({ user: profile });
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email, password, currentPassword, course, semester } = req.body;

    const data = {};
    if (name !== undefined) {
      if (!String(name).trim()) throw new AppError('O nome não pode ser vazio.', 400);
      data.name = String(name).trim();
    }
    if (email !== undefined) {
      const normalized = String(email).trim().toLowerCase();
      if (!normalized) throw new AppError('O e-mail não pode ser vazio.', 400);
      const exists = await prisma.user.findFirst({
        where: { email: normalized, id: { not: req.user.id } }
      });
      if (exists) throw new AppError('Este e-mail já está em uso.', 409);
      data.email = normalized;
    }
    if (password) {
      if (!currentPassword) throw new AppError('Informe a senha atual para alterá-la.', 400);
      const valid = await bcrypt.compare(currentPassword, req.user.password);
      if (!valid) throw new AppError('A senha atual está incorreta.', 401);
      if (String(password).length < 6) throw new AppError('A nova senha deve ter pelo menos 6 caracteres.', 400);
      data.password = await bcrypt.hash(password, config.bcryptRounds);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data
    });

    if (req.user.role === 'ALUNO' && (course !== undefined || semester !== undefined)) {
      await prisma.student.update({
        where: { userId: req.user.id },
        data: {
          ...(course !== undefined ? { course: String(course).trim() } : {}),
          ...(semester !== undefined ? { semester: Number(semester) } : {})
        }
      });
    }

    return res.json({ message: 'Perfil atualizado com sucesso.', user: { name: updatedUser.name, email: updatedUser.email } });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getProfile, updateProfile };
