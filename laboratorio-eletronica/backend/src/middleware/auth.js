const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const config = require('../config');

function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({ error: 'Sessão expirada ou token inválido. Faça login novamente.' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }
    if (!user.active) {
      return res.status(403).json({ error: 'Conta desativada. Contate a coordenação do laboratório.' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado: você não tem permissão para esta área.' });
    }
    return next();
  };
}

async function loadStudentProfile(userId) {
  return prisma.student.findUnique({ where: { userId } });
}

async function loadTeacherProfile(userId) {
  return prisma.teacher.findUnique({ where: { userId } });
}

module.exports = { signToken, authenticate, authorize, loadStudentProfile, loadTeacherProfile };
