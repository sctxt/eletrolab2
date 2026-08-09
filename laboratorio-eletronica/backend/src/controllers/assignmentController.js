const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { loadTeacherProfile, loadStudentProfile } = require('../middleware/auth');
const { notifyStudents } = require('../services/notificationService');

const questionInclude = {
  questions: {
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { order: 'asc' }
  }
};

function sanitizeAssignment(assignment, includeCorrectAnswers) {
  const { questions, ...rest } = assignment;
  const sanitizedQuestions = questions.map((q) => {
    if (includeCorrectAnswers) {
      return q;
    }
    return {
      ...q,
      options: q.options.map(({ correct, ...opt }) => opt)
    };
  });
  return { ...rest, questions: sanitizedQuestions };
}

async function getTeacherProfile(req, res, next) {
  try {
    const teacher = await loadTeacherProfile(req.user.id);
    if (!teacher) throw new AppError('Perfil de professor não encontrado.', 404);
    return teacher;
  } catch (err) {
    throw err;
  }
}

async function listAssignments(req, res, next) {
  try {
    if (req.user.role === 'PROFESSOR') {
      const teacher = await getTeacherProfile(req, res);
      const { status } = req.query;
      const where = { teacherId: teacher.id };
      if (status) where.status = String(status);

      const assignments = await prisma.assignment.findMany({
        where,
        include: {
          _count: { select: { questions: true, submissions: true } },
          submissions: { select: { status: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ assignments });
    }

    const student = await loadStudentProfile(req.user.id);
    if (!student) throw new AppError('Perfil de estudante não encontrado.', 404);

    const now = new Date();
    const assignments = await prisma.assignment.findMany({
      where: { status: 'PUBLICADA' },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { questions: true } },
        submissions: {
          where: { studentId: student.id },
          select: { id: true, status: true, grade: true, submittedAt: true, late: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    const result = assignments.map((a) => {
      const submission = a.submissions[0] || null;
      let status = 'PENDENTE';
      if (submission) {
        if (submission.status === 'CORRIGIDA') status = 'CORRIGIDA';
        else if (submission.late) status = 'ATRASADA';
        else status = 'ENVIADA';
      } else if (new Date(a.dueDate) < now) {
        status = 'ATRASADA';
      }
      const questionCount = a._count.questions;
      const { submissions, questions, _count, ...rest } = a;
      return {
        ...rest,
        questionCount,
        submission,
        status
      };
    });

    return res.json({ assignments: result });
  } catch (err) {
    return next(err);
  }
}

async function getAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        ...questionInclude,
        teacher: { include: { user: { select: { name: true } } } }
      }
    });
    if (!assignment) throw new AppError('Lista não encontrada.', 404);

    if (req.user.role === 'PROFESSOR') {
      const teacher = await getTeacherProfile(req, res);
      if (assignment.teacherId !== teacher.id) {
        throw new AppError('Esta lista não pertence a você.', 403);
      }
      return res.json({ assignment: sanitizeAssignment(assignment, true) });
    }

    if (assignment.status !== 'PUBLICADA') {
      throw new AppError('Esta lista ainda não foi publicada.', 404);
    }

    const student = await loadStudentProfile(req.user.id);
    const submission = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: id, studentId: student.id } },
      include: { answers: true }
    });

    return res.json({
      assignment: sanitizeAssignment(assignment, false),
      submission
    });
  } catch (err) {
    return next(err);
  }
}

async function createAssignment(req, res, next) {
  try {
    const teacher = await getTeacherProfile(req, res);
    const { title, description, instructions, turma, dueDate, status, questions } = req.body;

    if (!title || !String(title).trim()) throw new AppError('Informe o título da lista.', 400);
    if (!dueDate) throw new AppError('Informe o prazo de entrega.', 400);
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new AppError('Adicione ao menos uma questão.', 400);
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: String(title).trim(),
        description: String(description || '').trim(),
        instructions: String(instructions || '').trim(),
        turma: String(turma || '').trim(),
        teacherId: teacher.id,
        dueDate: new Date(dueDate),
        status: status === 'PUBLICADA' ? 'PUBLICADA' : 'RASCUNHO',
        questions: {
          create: questions.map((q, index) => ({
            text: String(q.text || '').trim(),
            type: String(q.type || 'TEXTO'),
            points: Number(q.points || 1),
            order: index,
            options:
              Array.isArray(q.options) && q.options.length > 0
                ? {
                    create: q.options.map((opt) => ({
                      text: String(opt.text || ''),
                      correct: Boolean(opt.correct)
                    }))
                  }
                : undefined
          }))
        }
      },
      include: questionInclude
    });

    if (assignment.status === 'PUBLICADA') {
      const students = await prisma.student.findMany({ select: { userId: true } });
      await notifyStudents(
        students,
        'Nova lista publicada',
        `A lista "${assignment.title}" foi publicada e está disponível.`
      );
    }

    return res.status(201).json({ message: 'Lista criada com sucesso.', assignment });
  } catch (err) {
    return next(err);
  }
}

async function updateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const teacher = await getTeacherProfile(req, res);
    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new AppError('Lista não encontrada.', 404);
    if (assignment.teacherId !== teacher.id) throw new AppError('Esta lista não pertence a você.', 403);

    const { title, description, instructions, turma, dueDate, status, questions } = req.body;

    const data = {};
    if (title !== undefined) {
      if (!String(title).trim()) throw new AppError('O título não pode ser vazio.', 400);
      data.title = String(title).trim();
    }
    if (description !== undefined) data.description = String(description).trim();
    if (instructions !== undefined) data.instructions = String(instructions).trim();
    if (turma !== undefined) data.turma = String(turma).trim();
    if (dueDate !== undefined) data.dueDate = new Date(dueDate);
    if (status !== undefined) {
      if (status !== 'RASCUNHO' && status !== 'PUBLICADA') {
        throw new AppError('Status inválido.', 400);
      }
      data.status = status;
    }

    if (Array.isArray(questions)) {
      if (questions.length === 0) throw new AppError('Adicione ao menos uma questão.', 400);
      await prisma.$transaction([
        prisma.question.deleteMany({ where: { assignmentId: id } }),
        prisma.assignment.update({
          where: { id },
          data: {
            questions: {
              create: questions.map((q, index) => ({
                text: String(q.text || '').trim(),
                type: String(q.type || 'TEXTO'),
                points: Number(q.points || 1),
                order: index,
                options:
                  Array.isArray(q.options) && q.options.length > 0
                    ? {
                        create: q.options.map((opt) => ({
                          text: String(opt.text || ''),
                          correct: Boolean(opt.correct)
                        }))
                      }
                    : undefined
              }))
            }
          }
        })
      ]);
    } else {
      await prisma.assignment.update({ where: { id }, data });
    }

    const updated = await prisma.assignment.findUnique({
      where: { id },
      include: questionInclude
    });

    return res.json({ message: 'Lista atualizada com sucesso.', assignment: updated });
  } catch (err) {
    return next(err);
  }
}

async function deleteAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const teacher = await getTeacherProfile(req, res);
    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new AppError('Lista não encontrada.', 404);
    if (assignment.teacherId !== teacher.id) throw new AppError('Esta lista não pertence a você.', 403);

    await prisma.assignment.delete({ where: { id } });
    return res.json({ message: 'Lista excluída com sucesso.' });
  } catch (err) {
    return next(err);
  }
}

async function publishAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const teacher = await getTeacherProfile(req, res);
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } }
    });
    if (!assignment) throw new AppError('Lista não encontrada.', 404);
    if (assignment.teacherId !== teacher.id) throw new AppError('Esta lista não pertence a você.', 403);
    if (assignment._count.questions === 0) throw new AppError('A lista precisa ter ao menos uma questão.', 400);

    const updated = await prisma.assignment.update({
      where: { id },
      data: { status: 'PUBLICADA' }
    });

    const students = await prisma.student.findMany({ select: { userId: true } });
    await notifyStudents(
      students,
      'Nova lista publicada',
      `A lista "${assignment.title}" foi publicada e está disponível.`
    );

    return res.json({ message: 'Lista publicada com sucesso.', assignment: updated });
  } catch (err) {
    return next(err);
  }
}

async function duplicateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const teacher = await getTeacherProfile(req, res);
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: questionInclude
    });
    if (!assignment) throw new AppError('Lista não encontrada.', 404);
    if (assignment.teacherId !== teacher.id) throw new AppError('Esta lista não pertence a você.', 403);

    const copy = await prisma.assignment.create({
      data: {
        title: `${assignment.title} (cópia)`,
        description: assignment.description,
        instructions: assignment.instructions,
        turma: assignment.turma,
        teacherId: teacher.id,
        dueDate: assignment.dueDate,
        status: 'RASCUNHO',
        questions: {
          create: assignment.questions.map((q) => ({
            text: q.text,
            type: q.type,
            points: q.points,
            order: q.order,
            options:
              q.options.length > 0
                ? {
                    create: q.options.map((opt) => ({
                      text: opt.text,
                      correct: opt.correct
                    }))
                  }
                : undefined
          }))
        }
      },
      include: questionInclude
    });

    return res.status(201).json({ message: 'Lista duplicada com sucesso.', assignment: copy });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
  duplicateAssignment
};
