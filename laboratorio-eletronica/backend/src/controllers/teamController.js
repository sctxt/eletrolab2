const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { loadStudentProfile } = require('../middleware/auth');
const { createNotification, notifyStudents } = require('../services/notificationService');

const teamInclude = {
  leader: {
    include: { user: { select: { id: true, name: true } } }
  },
  members: {
    include: {
      student: {
        include: { user: { select: { id: true, name: true, email: true } } }
      }
    },
    orderBy: { joinedAt: 'asc' }
  },
  invitations: {
    include: {
      student: { include: { user: { select: { id: true, name: true, email: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  }
};

async function listTeams(req, res, next) {
  try {
    if (req.user.role === 'PROFESSOR') {
      const teams = await prisma.team.findMany({
        include: teamInclude,
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ teams });
    }

    const student = await loadStudentProfile(req.user.id);
    if (!student) throw new AppError('Perfil de estudante não encontrado.', 404);

    const [asMember, asLeader] = await Promise.all([
      prisma.team.findMany({
        where: { members: { some: { studentId: student.id } } },
        include: teamInclude
      }),
      prisma.team.findMany({
        where: { leaderId: student.id },
        include: teamInclude
      })
    ]);

    const teams = [...asLeader, ...asMember];
    const seen = new Set();
    const unique = [];
    for (const t of teams) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
    }

    return res.json({ teams: unique });
  } catch (err) {
    return next(err);
  }
}

async function getTeam(req, res, next) {
  try {
    const { id } = req.params;
    const team = await prisma.team.findUnique({
      where: { id },
      include: teamInclude
    });
    if (!team) throw new AppError('Equipe não encontrada.', 404);

    if (req.user.role === 'ALUNO') {
      const student = await loadStudentProfile(req.user.id);
      const isLeader = team.leaderId === student?.id;
      const isMember = team.members.some((m) => m.studentId === student?.id);
      if (!isLeader && !isMember) {
        throw new AppError('Você não faz parte desta equipe.', 403);
      }
    }

    return res.json({ team });
  } catch (err) {
    return next(err);
  }
}

async function createTeam(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) throw new AppError('Informe o nome da equipe.', 400);

    const student = await loadStudentProfile(req.user.id);
    if (!student) throw new AppError('Perfil de estudante não encontrado.', 404);

    const existing = await prisma.team.findFirst({
      where: { leaderId: student.id }
    });
    if (existing) throw new AppError('Você já é líder de uma equipe. Saia ou exclua a equipe atual para criar outra.', 409);

    const team = await prisma.team.create({
      data: {
        name: String(name).trim(),
        description: String(description || '').trim(),
        leaderId: student.id,
        members: { create: { studentId: student.id } }
      },
      include: teamInclude
    });

    const teacher = await prisma.teacher.findFirst({
      include: { user: { select: { id: true } } }
    });
    if (teacher) {
      await createNotification(
        teacher.user.id,
        'Nova equipe criada',
        `A equipe "${team.name}" foi criada por ${req.user.name}.`
      );
    }

    return res.status(201).json({ message: 'Equipe criada com sucesso.', team });
  } catch (err) {
    return next(err);
  }
}

async function updateTeam(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) throw new AppError('Equipe não encontrada.', 404);

    if (req.user.role === 'ALUNO') {
      const student = await loadStudentProfile(req.user.id);
      if (team.leaderId !== student?.id) {
        throw new AppError('Somente o líder pode editar a equipe.', 403);
      }
    }

    const data = {};
    if (name !== undefined) {
      if (!String(name).trim()) throw new AppError('O nome da equipe não pode ser vazio.', 400);
      data.name = String(name).trim();
    }
    if (description !== undefined) data.description = String(description).trim();

    const updated = await prisma.team.update({
      where: { id },
      data,
      include: teamInclude
    });

    return res.json({ message: 'Equipe atualizada com sucesso.', team: updated });
  } catch (err) {
    return next(err);
  }
}

async function deleteTeam(req, res, next) {
  try {
    const { id } = req.params;
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) throw new AppError('Equipe não encontrada.', 404);

    if (req.user.role === 'ALUNO') {
      const student = await loadStudentProfile(req.user.id);
      if (team.leaderId !== student?.id) {
        throw new AppError('Somente o líder pode excluir a equipe.', 403);
      }
    }

    await prisma.team.delete({ where: { id } });
    return res.json({ message: 'Equipe excluída com sucesso.' });
  } catch (err) {
    return next(err);
  }
}

async function inviteStudents(req, res, next) {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    const team = await prisma.team.findUnique({
      where: { id },
      include: { members: { select: { studentId: true } } }
    });
    if (!team) throw new AppError('Equipe não encontrada.', 404);

    if (req.user.role === 'ALUNO') {
      const student = await loadStudentProfile(req.user.id);
      if (team.leaderId !== student?.id) {
        throw new AppError('Somente o líder pode convidar estudantes.', 403);
      }
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new AppError('Selecione ao menos um estudante para convidar.', 400);
    }

    const memberIds = new Set(team.members.map((m) => m.studentId));
    const results = [];
    const toNotify = [];

    for (const studentId of studentIds) {
      const target = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: { select: { id: true, name: true } } }
      });
      if (!target) continue;
      if (memberIds.has(studentId)) continue;

      const existing = await prisma.teamInvitation.findFirst({
        where: { teamId: id, studentId, status: 'PENDENTE' }
      });
      if (existing) continue;

      const invitation = await prisma.teamInvitation.create({
        data: { teamId: id, studentId, status: 'PENDENTE' }
      });
      results.push(invitation);
      toNotify.push({
        userId: target.user.id,
        title: 'Convite para equipe',
        message: `Você foi convidado para a equipe "${team.name}".`
      });
    }

    if (toNotify.length > 0) {
      await prisma.notification.createMany({ data: toNotify });
    }

    return res.status(201).json({
      message: results.length > 0
        ? `${results.length} convite(s) enviado(s) com sucesso.`
        : 'Nenhum convite novo foi enviado (estudantes já convidados ou membros).',
      invitations: results
    });
  } catch (err) {
    return next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const { id, studentId } = req.params;
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) throw new AppError('Equipe não encontrada.', 404);

    if (req.user.role === 'ALUNO') {
      const student = await loadStudentProfile(req.user.id);
      if (team.leaderId !== student?.id) {
        throw new AppError('Somente o líder pode remover membros.', 403);
      }
    }

    if (team.leaderId === studentId) {
      throw new AppError('O líder não pode ser removido da própria equipe.', 400);
    }

    const member = await prisma.teamMember.findFirst({ where: { teamId: id, studentId } });
    if (!member) throw new AppError('Este estudante não faz parte da equipe.', 404);

    await prisma.teamMember.delete({ where: { id: member.id } });

    const removed = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true } } }
    });
    if (removed) {
      await createNotification(
        removed.user.id,
        'Removido da equipe',
        `Você foi removido da equipe "${team.name}".`
      );
    }

    return res.json({ message: 'Membro removido da equipe com sucesso.' });
  } catch (err) {
    return next(err);
  }
}

async function leaveTeam(req, res, next) {
  try {
    const { id } = req.params;
    const student = await loadStudentProfile(req.user.id);
    if (!student) throw new AppError('Perfil de estudante não encontrado.', 404);

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) throw new AppError('Equipe não encontrada.', 404);

    if (team.leaderId === student.id) {
      throw new AppError('O líder não pode sair da equipe. Transfira a liderança ou exclua a equipe.', 400);
    }

    const member = await prisma.teamMember.findFirst({ where: { teamId: id, studentId: student.id } });
    if (!member) throw new AppError('Você não faz parte desta equipe.', 404);

    await prisma.teamMember.delete({ where: { id: member.id } });

    const leader = await prisma.student.findUnique({
      where: { id: team.leaderId },
      include: { user: { select: { id: true } } }
    });
    if (leader) {
      await createNotification(
        leader.user.id,
        'Membro saiu da equipe',
        `${req.user.name} saiu da equipe "${team.name}".`
      );
    }

    return res.json({ message: 'Você saiu da equipe com sucesso.' });
  } catch (err) {
    return next(err);
  }
}

async function transferLeadership(req, res, next) {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    const student = await loadStudentProfile(req.user.id);
    if (!student) throw new AppError('Perfil de estudante não encontrado.', 404);

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) throw new AppError('Equipe não encontrada.', 404);
    if (team.leaderId !== student.id) throw new AppError('Somente o líder pode transferir a liderança.', 403);

    const member = await prisma.teamMember.findFirst({ where: { teamId: id, studentId } });
    if (!member) throw new AppError('O novo líder precisa ser membro da equipe.', 404);

    const updated = await prisma.team.update({
      where: { id },
      data: { leaderId: studentId },
      include: teamInclude
    });

    const newLeader = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true } } }
    });
    if (newLeader) {
      await createNotification(
        newLeader.user.id,
        'Nova liderança',
        `Você agora é o(a) líder da equipe "${team.name}".`
      );
    }

    return res.json({ message: 'Liderança transferida com sucesso.', team: updated });
  } catch (err) {
    return next(err);
  }
}

async function listMyInvitations(req, res, next) {
  try {
    const student = await loadStudentProfile(req.user.id);
    if (!student) throw new AppError('Perfil de estudante não encontrado.', 404);

    const invitations = await prisma.teamInvitation.findMany({
      where: { studentId: student.id, status: 'PENDENTE' },
      include: {
        team: {
          include: {
            leader: { include: { user: { select: { name: true } } } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ invitations });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  inviteStudents,
  removeMember,
  leaveTeam,
  transferLeadership,
  listMyInvitations
};
