import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui/Avatar';

const STUDENT_ITEMS = [
  { to: '/aluno/dashboard', label: 'Início', icon: 'fa-house' },
  { to: '/aluno/equipe', label: 'Minha Equipe', icon: 'fa-users' },
  { to: '/aluno/listas', label: 'Listas', icon: 'fa-list-check' },
  { to: '/aluno/historico', label: 'Histórico', icon: 'fa-clock-rotate-left' },
  { to: '/aluno/calculadora', label: 'Calculadora de Resistores', icon: 'fa-calculator' },
  { to: '/aluno/notificacoes', label: 'Notificações', icon: 'fa-bell' },
  { to: '/aluno/perfil', label: 'Perfil', icon: 'fa-user' }
];

const TEACHER_ITEMS = [
  { to: '/professor/dashboard', label: 'Início', icon: 'fa-house' },
  { to: '/professor/listas', label: 'Listas', icon: 'fa-list-check' },
  { to: '/professor/alunos', label: 'Alunos', icon: 'fa-user-graduate' },
  { to: '/professor/equipes', label: 'Equipes', icon: 'fa-users' },
  { to: '/professor/correcoes', label: 'Correções', icon: 'fa-clipboard-check' },
  { to: '/professor/relatorios', label: 'Relatórios', icon: 'fa-chart-line' },
  { to: '/professor/notificacoes', label: 'Notificações', icon: 'fa-bell' },
  { to: '/professor/perfil', label: 'Perfil', icon: 'fa-user' }
];

const ADMIN_ITEMS = [
  { to: '/admin/dashboard', label: 'Início', icon: 'fa-house' },
  { to: '/admin/contas', label: 'Contas', icon: 'fa-user-gear' }
];

export default function Sidebar({ open, onClose, unreadCount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'ALUNO';
  const isAdmin = user?.role === 'ADMIN';
  const items = isStudent ? STUDENT_ITEMS : isAdmin ? ADMIN_ITEMS : TEACHER_ITEMS;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`;

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="brand brand--light">
            <span className="brand__icon">
              <i className="fas fa-microchip" />
            </span>
            <span className="brand__text">
              Lab<span>Eletrônica</span>
            </span>
          </div>
          <button className="sidebar__close" onClick={onClose} aria-label="Fechar menu">
            <i className="fas fa-bars" />
          </button>
        </div>

        <div className="sidebar__user">
          <Avatar name={user?.name} size="md" />
          <div className="sidebar__user-info">
            <strong>{user?.name}</strong>
            <span>{isStudent ? 'Estudante' : isAdmin ? 'Administrador(a)' : 'Professor(a)'}</span>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Menu principal">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
              <i className={`fas ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
              {item.icon === 'fa-bell' && unreadCount > 0 && (
                <span className="sidebar__badge">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__link sidebar__link--logout" onClick={handleLogout}>
            <i className="fas fa-right-from-bracket" aria-hidden="true" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
