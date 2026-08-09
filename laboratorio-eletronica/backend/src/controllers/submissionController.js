const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { loadStudentProfile, loadTeacherProfile } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');

function computeAutoGrade(questions, answersMap) {
  let earned = 0;
  for (const q of questions) {
    if (q.type === 'MULTIPLA_ESCOLHA') {
      const answer = answersMap.get(q.id);
      const correct = q.options.find((o) => o.correct);
      if (answer && correct && answer === correct.text) {
        earned += q.points;
      }
    }
  }
  return earned;
}

async function submitAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const student = await loadStudentProfile(req.user.id);
    if (!student) throw new AppError('Perfil de estudante não encontrado.', 404);

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        questions: { select: { id: true, type: true } }
      }
    });
    if (!assignment) throw new AppError('Lista não encontrada.', 404);
    if (assignment.status !== 'PUBLICADA') {
      throw new AppError('Esta lista ainda não foi publicada.', 400);
    }
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new AppError('Responda ao menos uma questão antes de enviar.', 400);
    }

    const questionIds = new Set(assignment.questions.map((q) => q.id));
    const invalid = answers.filter((a) => !questionIds.has(a.questionId));
    if (invalid.length > 0) {
      throw new AppError('Uma ou mais questões não pertencem a esta lista.', 400);
    }

    const existing = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: id, studentId: student.id } }
    });
    if (existing) {
      throw new AppError('Você já enviou esta lista. O envio não pode ser alterado após a submissão.', 409);
    }

    const now = new Date();
    const late = now > new Date(assignment.dueDate);

    const submission = await prisma.submission.create({
      data: {
        assignmentId: id,
        studentId: student.id,
        status: 'ENVIADA',
        late,
        answers: {
          create: answers.map((a) => ({
            questionId: a.questionId,
            answer: String(a.answer || '')
          }))
        }
      },
      include: { answers: true }
    });

    const teacher = await prisma.teacher.findUnique({
      where: { id: assignment.teacherId },
      include: { user: { select: { id: true } } }
    });
    if (teacher) {
      await createNotification(
        teacher.user.id,
        'Nova lista respondida',
        `${req.user.name} respondeu a lista "${assignment.title}".`
      );
    }

    return res.status(201).json({
      message: late ? 'Lista enviada com atraso.' : 'Lista enviada com sucesso.',
      submission
    });
  } catch (err) {
    return next(err);
  }
}

async function listSubmissions(req, res, next) {
  try {
    const { id } = req.params;
    const teacher = await loadTeacherProfile(req.user.id);
    if (!teacher) throw new AppError('Perfil de professor não encontrado.', 404);

    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new AppError('Lista não encontrada.', 404);
    if (assignment.teacherId !== teacher.id) throw new AppError('Esta lista não pertence a você.', 403);

    const submissions = await prisma.submission.findMany({
      where: { assignmentId: id },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            teamMembers: { include: { team: { select: { id: true, name: true } } } }
          }
        },
        _count: { select: { answers: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return res.json({ submissions });
  } catch (err) {
    return next(err);
  }
}

async function getSubmission(req, res, next) {
  try {
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            teamMembers: { include: { team: { select: { id: true, name: true } } } }
          }
        },
        assignment: {
          include: {
            questions: { include: { options: true }, orderBy: { order: 'asc' } }
          }
        },
        answers: true
      }
    });
    if (!submission) throw new AppError('Entrega não encontrada.', 404);

    if (req.user.role === 'PROFESSOR') {
      const teacher = await loadTeacherProfile(req.user.id);
      if (submission.assignment.teacherId !== teacher.id) {
        throw new AppError('Esta entrega não pertence a uma lista sua.', 403);
      }
    } else {
      const student = await loadStudentProfile(req.user.id);
      if (submission.studentId !== student?.id) {
        throw new AppError('Você não pode visualizar esta entrega.', 403);
      }
    }

    const answersMap = new Map(submission.answers.map((a) => [a.questionId, a.answer]));
    const autoGrade = computeAutoGrade(submission.assignment.questions, answersMap);

    return res.json({ submission, autoGrade });
  } catch (err) {
    return next(err);
  }
}

async function gradeSubmission(req, res, next) {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;

    const teacher = await loadTeacherProfile(req.user.id);
    if (!teacher) throw new AppError('Perfil de professor não encontrado.', 404);

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { assignment: true, student: { include: { user: { select: { id: true } } } } }
    });
    if (!submission) throw new AppError('Entrega não encontrada.', 404);
    if (submission.assignment.teacherId !== teacher.id) {
      throw new AppError('Esta entrega não pertence a uma lista sua.', 403);
    }

    if (grade === undefined || grade === null || Number.isNaN(Number(grade))) {
      throw new AppError('Informe uma nota válida.', 400);
    }
    const numericGrade = Number(grade);

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        grade: numericGrade,
        feedback: feedback !== undefined ? String(feedback).trim() : submission.feedback,
        status: 'CORRIGIDA'
      }
    });

    await createNotification(
      submission.student.user.id,
      'Lista corrigida',
      `A lista "${submission.assignment.title}" foi corrigida. Sua nota: ${numericGrade}.`
    );

    return res.json({ message: 'Correção salva com sucesso.', submission: updated });
  } catch (err) {
    return next(err);
  }
}

async function mySubmissions(req, res, next) {
  try {
    const student = await loadStudentProfile(req.user.id);
    if (!student) throw new AppError('Perfil de estudante não encontrado.', 404);

    const submissions = await prisma.submission.findMany({
      where: { studentId: student.id },
      include: {
        assignment: {
          include: { teacher: { include: { user: { select: { name: true } } } } }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return res.json({ submissions });
  } catch (err) {
    return next(err);
  }
}

async function listAllSubmissions(req, res, next) {
  try {
    const teacher = await loadTeacherProfile(req.user.id);
    if (!teacher) throw new AppError('Perfil de professor não encontrado.', 404);

    const { status } = req.query;
    const where = { assignment: { teacherId: teacher.id } };
    if (status && status !== 'TODAS') where.status = String(status);

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            teamMembers: { include: { team: { select: { id: true, name: true } } } }
          }
        },
        assignment: { select: { id: true, title: true, dueDate: true, teacherId: true } }
      },
      orderBy: [{ status: 'asc' }, { submittedAt: 'desc' }]
    });

    return res.json({ submissions });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  submitAssignment,
  listSubmissions,
  getSubmission,
  gradeSubmission,
  mySubmissions,
  listAllSubmissions
};
