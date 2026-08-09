import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import PanelLayout from '../layouts/PanelLayout';
import ProtectedRoute from '../components/ProtectedRoute';

import Landing from '../pages/public/Landing';
import LoginAluno from '../pages/public/LoginAluno';
import LoginProfessor from '../pages/public/LoginProfessor';

import StudentDashboard from '../pages/aluno/Dashboard';
import StudentEquipe from '../pages/aluno/Equipe';
import StudentListas from '../pages/aluno/Listas';
import StudentListaDetalhe from '../pages/aluno/ListaDetalhe';
import StudentHistorico from '../pages/aluno/Historico';
import StudentPerfil from '../pages/aluno/Perfil';

import TeacherDashboard from '../pages/professor/Dashboard';
import TeacherListas from '../pages/professor/Listas';
import TeacherListaForm from '../pages/professor/ListaForm';
import TeacherListaDetalhe from '../pages/professor/ListaDetalhe';
import TeacherAlunos from '../pages/professor/Alunos';
import TeacherEquipes from '../pages/professor/Equipes';
import TeacherCorrecoes from '../pages/professor/Correcoes';
import TeacherCorrecaoDetalhe from '../pages/professor/CorrecaoDetalhe';
import TeacherRelatorios from '../pages/professor/Relatorios';
import TeacherPerfil from '../pages/professor/Perfil';

import Notificacoes from '../pages/shared/Notificacoes';

const studentRoutes = [
  { path: '/aluno/dashboard', element: <StudentDashboard /> },
  { path: '/aluno/equipe', element: <StudentEquipe /> },
  { path: '/aluno/listas', element: <StudentListas /> },
  { path: '/aluno/listas/:id', element: <StudentListaDetalhe /> },
  { path: '/aluno/historico', element: <StudentHistorico /> },
  { path: '/aluno/notificacoes', element: <Notificacoes /> },
  { path: '/aluno/perfil', element: <StudentPerfil /> }
];

const teacherRoutes = [
  { path: '/professor/dashboard', element: <TeacherDashboard /> },
  { path: '/professor/listas', element: <TeacherListas /> },
  { path: '/professor/listas/criar', element: <TeacherListaForm /> },
  { path: '/professor/listas/:id/editar', element: <TeacherListaForm /> },
  { path: '/professor/listas/:id', element: <TeacherListaDetalhe /> },
  { path: '/professor/alunos', element: <TeacherAlunos /> },
  { path: '/professor/equipes', element: <TeacherEquipes /> },
  { path: '/professor/correcoes', element: <TeacherCorrecoes /> },
  { path: '/professor/correcoes/:id', element: <TeacherCorrecaoDetalhe /> },
  { path: '/professor/relatorios', element: <TeacherRelatorios /> },
  { path: '/professor/notificacoes', element: <Notificacoes /> },
  { path: '/professor/perfil', element: <TeacherPerfil /> }
];

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'login/aluno', element: <LoginAluno /> },
      { path: 'login/professor', element: <LoginProfessor /> }
    ]
  },
  {
    path: '/aluno',
    element: (
      <ProtectedRoute role="ALUNO">
        <PanelLayout />
      </ProtectedRoute>
    ),
    children: studentRoutes
  },
  {
    path: '/professor',
    element: (
      <ProtectedRoute role="PROFESSOR">
        <PanelLayout />
      </ProtectedRoute>
    ),
    children: teacherRoutes
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;
