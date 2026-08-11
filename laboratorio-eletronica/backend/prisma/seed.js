const bcrypt = require('bcryptjs');
const db = require('../src/db/firestore');

const ORDER = [
  'answer',
  'submission',
  'questionOption',
  'question',
  'assignment',
  'teamInvitation',
  'teamMember',
  'team',
  'notification',
  'student',
  'teacher',
  'user'
];

async function main() {
  console.log('Limpando dados existentes no Firestore...');
  await db.$transaction(ORDER.map((model) => db[model].deleteMany()));

  console.log('Criando senha padrão...');
  const password = await bcrypt.hash('123456', 10);

  const daysFromNow = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  console.log('Criando professor...');
  const teacherUser = await db.user.create({
    data: {
      name: 'Prof. Carlos Mendes',
      email: 'professor@lab.com',
      password,
      role: 'PROFESSOR'
    }
  });
  const teacher = await db.teacher.create({ data: { userId: teacherUser.id } });

  console.log('Criando administrador...');
  await db.user.create({
    data: {
      name: 'Administrador do Laboratório',
      email: 'admin@lab.com',
      password,
      role: 'ADMIN'
    }
  });

  console.log('Criando estudantes...');
  const studentsData = [
    { name: 'Ana Beatriz Souza', registrationNumber: '2024101001', course: 'Engenharia de Computação', semester: 4 },
    { name: 'Bruno Oliveira', registrationNumber: '2024101002', course: 'Engenharia de Computação', semester: 4 },
    { name: 'Carla Fernanda Lima', registrationNumber: '2024101003', course: 'Eletrônica Industrial', semester: 3 },
    { name: 'Diego Almeida', registrationNumber: '2024101004', course: 'Eletrônica Industrial', semester: 3 },
    { name: 'Eduarda Santos', registrationNumber: '2024101005', course: 'Engenharia de Computação', semester: 4 }
  ];

  const students = [];
  for (const data of studentsData) {
    const email = `${data.registrationNumber}@aluno.ifce.edu.br`;
    const user = await db.user.create({
      data: {
        name: data.name,
        email,
        password,
        role: 'ALUNO'
      }
    });
    const student = await db.student.create({
      data: {
        userId: user.id,
        registrationNumber: data.registrationNumber,
        course: data.course,
        semester: data.semester
      }
    });
    students.push(student);
  }

  console.log('Criando equipes...');
  const team1 = await db.team.create({
    data: {
      name: 'Circuito Vivo',
      description: 'Equipe focada em projetos de circuitos analógicos e sensores.',
      leaderId: students[0].id,
      members: {
        create: [{ studentId: students[0].id }, { studentId: students[1].id }]
      }
    }
  });

  const team2 = await db.team.create({
    data: {
      name: 'Núcleo Digital',
      description: 'Grupo de estudos em sistemas digitais e microcontroladores.',
      leaderId: students[2].id,
      members: {
        create: [{ studentId: students[2].id }, { studentId: students[3].id }, { studentId: students[4].id }]
      }
    }
  });

  console.log('Criando listas de exercícios...');
  const assignment1 = await db.assignment.create({
    data: {
      title: 'Leis de Kirchhoff',
      description: 'Exercícios sobre análise de circuitos com malhas e nós.',
      instructions: 'Resolva as questões e apresente o desenvolvimento. Lista individual.',
      teacherId: teacher.id,
      dueDate: daysFromNow(3),
      status: 'PUBLICADA',
      questions: {
        create: [
          {
            text: 'Enuncie a 1ª Lei de Kirchhoff (Lei dos Nós) e dê um exemplo prático de aplicação.',
            type: 'TEXTO',
            points: 2,
            order: 0
          },
          {
            text: 'Em um nó do circuito entram 2A e 3A. Qual corrente deve sair do nó?',
            type: 'RESPOSTA_CURTA',
            points: 1,
            order: 1
          },
          {
            text: 'Qual é a unidade de resistência elétrica no Sistema Internacional?',
            type: 'MULTIPLA_ESCOLHA',
            points: 1,
            order: 2,
            options: {
              create: [
                { text: 'Volt', correct: false },
                { text: 'Ohm', correct: true },
                { text: 'Ampere', correct: false },
                { text: 'Watt', correct: false }
              ]
            }
          },
          {
            text: 'Quais destes componentes são componentes passivos? (Selecione todos que se aplicam)',
            type: 'MULTIPLAS_RESPOSTAS',
            points: 2,
            order: 3,
            options: {
              create: [
                { text: 'Resistor', correct: true },
                { text: 'Capacitor', correct: true },
                { text: 'Diodo', correct: false },
                { text: 'Indutor', correct: true }
              ]
            }
          }
        ]
      }
    },
    include: { questions: true }
  });

  const assignment2 = await db.assignment.create({
    data: {
      title: 'Circuitos com Resistores',
      description: 'Associação de resistores em série, paralelo e mista.',
      instructions: 'Mostre todos os cálculos realizados.',
      teacherId: teacher.id,
      dueDate: daysFromNow(7),
      status: 'PUBLICADA',
      questions: {
        create: [
          {
            text: 'Dois resistores de 6Ω em série resultam em qual resistência equivalente?',
            type: 'RESPOSTA_CURTA',
            points: 1,
            order: 0
          },
          {
            text: 'Dois resistores de 6Ω em paralelo resultam em qual resistência equivalente?',
            type: 'MULTIPLA_ESCOLHA',
            points: 1,
            order: 1,
            options: {
              create: [
                { text: '12Ω', correct: false },
                { text: '6Ω', correct: false },
                { text: '3Ω', correct: true },
                { text: '1,5Ω', correct: false }
              ]
            }
          },
          {
            text: 'Explique o comportamento da corrente em um circuito em série.',
            type: 'TEXTO',
            points: 2,
            order: 2
          }
        ]
      }
    },
    include: { questions: true }
  });

  const assignment3 = await db.assignment.create({
    data: {
      title: 'Projeto: Fonte de Alimentação',
      description: 'Projeto prático de uma fonte de alimentação regulada.',
      instructions: 'Entregue o esquemático e a descrição do projeto. Trabalho em equipe.',
      teacherId: teacher.id,
      dueDate: daysFromNow(-2),
      status: 'PUBLICADA',
      questions: {
        create: [
          {
            text: 'Descreva a topologia da fonte escolhida e justifique a escolha dos componentes.',
            type: 'TEXTO',
            points: 3,
            order: 0
          },
          {
            text: 'Qual a tensão de saída regulada do seu projeto?',
            type: 'RESPOSTA_CURTA',
            points: 1,
            order: 1
          }
        ]
      }
    }
  });

  const assignment4 = await db.assignment.create({
    data: {
      title: 'Rascunho: Amplificador Operacional',
      description: 'Lista em rascunho sobre amplificadores operacionais.',
      instructions: 'Ainda não publicada.',
      teacherId: teacher.id,
      dueDate: daysFromNow(10),
      status: 'RASCUNHO',
      questions: {
        create: [
          {
            text: 'Qual a diferença entre ganho em malha aberta e malha fechada?',
            type: 'TEXTO',
            points: 2,
            order: 0
          }
        ]
      }
    }
  });

  console.log('Criando submissões de exemplo...');
  const q1 = await db.question.findMany({ where: { assignmentId: assignment1.id }, orderBy: { order: 'asc' } });
  const q2 = await db.question.findMany({ where: { assignmentId: assignment2.id }, orderBy: { order: 'asc' } });
  const q3 = await db.question.findMany({ where: { assignmentId: assignment3.id }, orderBy: { order: 'asc' } });

  const submission1 = await db.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: students[0].id,
      submittedAt: daysFromNow(-1),
      status: 'CORRIGIDA',
      grade: 5.5,
      feedback: 'Bom desenvolvimento nas questões objetivas. Reforçar o enunciado da Lei dos Nós com um exemplo numérico.',
      answers: {
        create: [
          { questionId: q1[0].id, answer: 'A soma das correntes que entram em um nó é igual à soma das correntes que saem. Exemplo: em uma junção entram 2A e saem 2A.' },
          { questionId: q1[1].id, answer: '5A' },
          { questionId: q1[2].id, answer: 'Ohm' },
          { questionId: q1[3].id, answer: 'Resistor, Capacitor, Indutor' }
        ]
      }
    }
  });

  const submission2 = await db.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: students[2].id,
      submittedAt: daysFromNow(0),
      status: 'ENVIADA',
      answers: {
        create: [
          { questionId: q1[0].id, answer: 'A soma algébrica das correntes em um nó é zero.' },
          { questionId: q1[1].id, answer: '5A' },
          { questionId: q1[2].id, answer: 'Ohm' },
          { questionId: q1[3].id, answer: 'Resistor e Capacitor' }
        ]
      }
    }
  });

  await db.submission.create({
    data: {
      assignmentId: assignment2.id,
      studentId: students[1].id,
      submittedAt: daysFromNow(-2),
      status: 'CORRIGIDA',
      grade: 4,
      feedback: 'Cuidado com os cálculos de associação mista.',
      answers: {
        create: [
          { questionId: q2[0].id, answer: '12Ω' },
          { questionId: q2[1].id, answer: '3Ω' },
          { questionId: q2[2].id, answer: 'A corrente é a mesma em todos os componentes do circuito série.' }
        ]
      }
    }
  });

  await db.submission.create({
    data: {
      assignmentId: assignment3.id,
      studentId: students[3].id,
      submittedAt: daysFromNow(-5),
      late: true,
      status: 'CORRIGIDA',
      grade: 3.5,
      feedback: 'Projeto entregue com atraso. Refinar a justificativa dos componentes.',
      answers: {
        create: [
          { questionId: q3[0].id, answer: 'Fonte linear com regulador 7805 e retificador de ponte.' },
          { questionId: q3[1].id, answer: '5V' }
        ]
      }
    }
  });

  console.log('Criando notificações de exemplo...');
  const names = studentsData.map((d) => d.name);

  await db.notification.createMany({
    data: [
      {
        userId: teacherUser.id,
        title: 'Nova lista respondida',
        message: `${names[0]} respondeu a lista "Leis de Kirchhoff".`
      },
      {
        userId: teacherUser.id,
        title: 'Lista aguardando correção',
        message: 'Existem listas enviadas aguardando correção.'
      },
      { userId: students[0].userId, title: 'Lista corrigida', message: `A lista "Leis de Kirchhoff" foi corrigida. Sua nota: ${submission1.grade}.`, read: true },
      { userId: students[1].userId, title: 'Nova lista publicada', message: 'A lista "Circuitos com Resistores" foi publicada e está disponível.' },
      { userId: students[2].userId, title: 'Prazo próximo', message: 'A lista "Leis de Kirchhoff" termina em breve. Não deixe para a última hora.' },
      {
        userId: students[3].userId,
        title: 'Convite para equipe',
        message: 'Você foi convidado para a equipe "Circuito Vivo".'
      }
    ]
  });

  const pendingInvitation = await db.teamInvitation.create({
    data: {
      teamId: team1.id,
      studentId: students[3].id,
      status: 'PENDENTE'
    }
  });

  console.log('Seed concluído com sucesso!');
  console.log('--------------------------------------------');
  console.log('Credenciais de teste:');
  console.log('Admin:      admin@lab.com / 123456');
  console.log('Professor:  professor@lab.com / 123456');
  for (let i = 0; i < students.length; i++) {
    console.log(`Aluno:      ${students[i].registrationNumber} / 123456  (${names[i]})`);
  }
  console.log('--------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
