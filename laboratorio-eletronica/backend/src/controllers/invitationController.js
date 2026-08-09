const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { loadStudentProfile } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');

async function acceptInvitation(req, res, next) {
  try {
    const { id } = req.params;
    const student = await loadStudentProfile(req.user.id);
    if (!student) throw new AppError('Perfil de estudante não encontrado.', 404);

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            leader: { include: { user: { select: { id: true, name: true } } } }
          }
        }
      }
    });

    if (!invitation || invitation.status !== 'PENDENTE') {
      throw new AppError('Convite não encontrado ou já respondido.', 404);
    }
    if (invitation.studentId !== student.id) {
      throw new AppError('Este convite não foi enviado para você.', 403);
    }

    const alreadyMember = await prisma.teamMember.findFirst({
      where: { teamId: invitation.teamId, studentId: student.id }
    });
    if (alreadyMember) {
      await prisma.teamInvitation.delete({ where: { id: invitation.id } });
      throw new AppError('Você já faz parte desta equipe.', 409);
    }

    const [member] = await prisma.$transaction([
      prisma.teamMember.create({
        data: { teamId: invitation.teamId, studentId: student.id }
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACEITA' }
      })
    ]);

    await createNotification(
      invitation.team.leader.user.id,
      'Convite aceito',
      `${req.user.name} aceitou o convite para a equipe "${invitation.team.name}".`
    );

    await createNotification(
      req.user.id,
      'Bem-vindo à equipe',
      `Você agora faz parte da equipe "${invitation.team.name}".`
    );

    return res.json({ message: `Você entrou na equipe "${invitation.team.name}".`, member });
  } catch (err) {
    return next(err);
  }
}

async function rejectInvitation(req, res, next) {
  try {
    const { id } = req.params;
    const student = await loadStudentProfile(req.user.id);
    if (!student) throw new AppError('Perfil de estudante não encontrado.', 404);

    const invitation = await prisma.teamInvitation.findUnique({ where: { id } });
    if (!invitation || invitation.status !== 'PENDENTE') {
      throw new AppError('Convite não encontrado ou já respondido.', 404);
    }
    if (invitation.studentId !== student.id) {
      throw new AppError('Este convite não foi enviado para você.', 403);
    }

    const updated = await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'RECUSADA' }
    });

    return res.json({ message: 'Convite recusado.', invitation: updated });
  } catch (err) {
    return next(err);
  }
}

module.exports = { acceptInvitation, rejectInvitation };
