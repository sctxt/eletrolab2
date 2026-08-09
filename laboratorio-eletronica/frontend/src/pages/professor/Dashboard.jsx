import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatCard, PageHeader } from '../../components/ui/Page';
import { formatDate, timeAgo } from '../../components/ui/format';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [show]);

  if (loading) return <PageLoader text="Carregando painel..." />;
  if (!data) return null;

  const { stats, recentSubmissions, upcomingDeadlines, notifications, performance } = data;
  const maxSubmissions = Math.max(1, ...performance.map((p) => p.submissions));

  return (
    <div className="dashboard">
      <PageHeader
        title="Início"
        subtitle="Visão geral das atividades do laboratório."
        icon="fa-house"
      />

      <div className="stats-grid">
        <StatCard icon="fa-user-graduate" label="Total de alunos" value={stats.totalStudents} hint="Estudantes cadastrados" />
        <StatCard icon="fa-users" label="Total de equipes" value={stats.totalTeams} hint="Equipes ativas" tone="teal" />
        <StatCard icon="fa-list-check" label="Listas publicadas" value={stats.publishedLists} hint="Exercícios criados" tone="lime" />
        <StatCard icon="fa-paper-plane" label="Respostas pendentes" value={stats.pendingResponses} hint="Entregas recebidas" tone="dark" />
        <StatCard icon="fa-clipboard-check" label="Correções pendentes" value={stats.pendingGrading} hint="Aguardando nota" tone="amber" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title"><i className="fas fa-paper-plane" /> Envios recentes</h3>
            <Link to="/professor/correcoes" className="link">Corrigir</Link>
          </div>
          <div className="card__body">
            {recentSubmissions.length === 0 ? (
              <EmptyState icon="fa-inbox" title="Nenhum envio recente" message="As entregas dos estudantes aparecerão aqui." />
            ) : (
              <ul className="deadline-list">
                {recentSubmissions.map((s) => (
                  <li key={s.id}>
                    <button className="deadline-list__item" onClick={() => navigate('/professor/correcoes')}>
                      <div>
                        <strong>{s.student?.user?.name}</strong>
                        <span>Respondeu a lista "{s.assignment?.title}" · {timeAgo(s.submittedAt)}</span>
                      </div>
                      <i className="fas fa-chevron-right" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title"><i className="fas fa-calendar-days" /> Próximos prazos</h3>
            <Link to="/professor/listas" className="link">Listas</Link>
          </div>
          <div className="card__body">
            {upcomingDeadlines.length === 0 ? (
              <EmptyState icon="fa-calendar-check" title="Nenhum prazo próximo" />
            ) : (
              <ul className="deadline-list">
                {upcomingDeadlines.map((a) => (
                  <li key={a.id}>
                    <button className="deadline-list__item" onClick={() => navigate(`/professor/listas/${a.id}`)}>
                      <div>
                        <strong>{a.title}</strong>
                        <span>Entrega: {formatDate(a.dueDate)}</span>
                      </div>
                      <i className="fas fa-chevron-right" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title"><i className="fas fa-bell" /> Notificações</h3>
            <Link to="/professor/notificacoes" className="link">Ver todas</Link>
          </div>
          <div className="card__body">
            {notifications.length === 0 ? (
              <EmptyState icon="fa-bell-slash" title="Sem notificações" />
            ) : (
              <ul className="notification-mini">
                {notifications.slice(0, 4).map((n) => (
                  <li key={n.id} className={n.read ? '' : 'notification-mini--unread'}>
                    <div className="notification-mini__icon">
                      <i className="fas fa-circle-info" />
                    </div>
                    <div>
                      <strong>{n.title}</strong>
                      <p>{n.message}</p>
                      <span>{timeAgo(n.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title"><i className="fas fa-chart-column" /> Desempenho das listas</h3>
            <Link to="/professor/relatorios" className="link">Relatórios</Link>
          </div>
          <div className="card__body">
            {performance.length === 0 ? (
              <EmptyState icon="fa-chart-column" title="Sem dados" message="Publique listas para ver o desempenho." />
            ) : (
              <div className="bar-chart">
                {performance.map((p) => (
                  <div key={p.title} className="bar-chart__row">
                    <span className="bar-chart__label" title={p.title}>{p.title}</span>
                    <div className="bar-chart__track">
                      <div
                        className="bar-chart__fill"
                        style={{ width: `${(p.submissions / maxSubmissions) * 100}%` }}
                      />
                    </div>
                    <span className="bar-chart__value">{p.submissions}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
