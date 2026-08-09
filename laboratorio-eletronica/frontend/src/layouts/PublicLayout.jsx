import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="public-layout">
      <header className="navbar">
        <div className="container navbar__inner">
          <a href="/" className="brand">
            <span className="brand__icon">
              <i className="fas fa-microchip" />
            </span>
            <span className="brand__text">
              Lab<span>Eletrônica</span>
            </span>
          </a>
          <nav className="navbar__links" aria-label="Navegação principal">
            <a href="/#sobre">Sobre</a>
            <a href="/#funcionalidades">Funcionalidades</a>
            <a href="/#como-funciona">Como funciona</a>
            <a href="/#contato">Contato</a>
          </nav>
          <div className="navbar__actions">
            {user ? (
              <a href={user.role === 'ALUNO' ? '/aluno/dashboard' : '/professor/dashboard'} className="btn btn--primary btn--sm">
                Meu Painel
              </a>
            ) : (
              <>
                <a href="/login/aluno" className="btn btn--ghost btn--sm">
                  Área do Aluno
                </a>
                <a href="/login/professor" className="btn btn--primary btn--sm">
                  Área do Professor
                </a>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
