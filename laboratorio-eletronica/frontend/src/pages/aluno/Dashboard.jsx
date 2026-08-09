import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi, invitationApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { StatCard, PageHeader } from '../../components/ui/Page';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate, timeAgo } from '../../components/ui/format';

function InvitationCard({ invitation, onResponded }) {
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  const respond = async (action) => {
    setBusy(true);
    try {
      const res =
        action === 'accept'
          ? await invitationApi.accept(invitation.id)
          : await invitationApi.reject(invitation.id);
      show(res.message, 'success');
      onResponded();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="invitation-card">
      <div className="invitation-card__icon">
        <i className="fas fa-envelope-open-text" />
      </div>
      <div className="invitation-card__body">
        <strong>Convite para {invitation.team.name}</strong>
        <p>
          Líder: {invitation.team.leader?.user?.name || '—'} · {formatDate(invitation.createdAt)}
        </p>
      </div>
      <div className="invitation-card__actions">
        <button className="btn btn--primary btn--sm" disabled={busy} onClick={() => respond('accept')}>
          Aceitar
        </button>
        <button className="btn btn--outline btn--sm" disabled={busy} onClick={() => respond('reject')}>
          Recusar
        </button>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [reload]);

  if (loading) return <PageLoader text="Carregando seu painel..." />;
  if (error) return <EmptyState icon="fa-circle-exclamation" title="Erro ao carregar" message={error} />;
  if (!data) return null;

  const { stats, myTeams, invitations, upcomingDeadlines, recentActivities, notifications } = data;

  return (
    <div className="dashboard">
      <PageHeader
        title="Início"
        subtitle="Resumo das suas atividades no laboratório."
        icon="fa-house"
      />

      {invitations.length > 0 && (
        <div className="section-block">
          <div className="section-block__title">
            <i className="fas fa-envelope-open-text" /> Convites pendentes
            <span className="count-pill">{invitations.length}</span>
          </div>
          <div className="invitation-list">
            {invitations.map((inv) => (
              <InvitationCard key={inv.id} invitation={inv} onResponded={() => setReload((r) => r + 1)} />
            ))}
          </div>
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon="fa-list-check" label="Listas pendentes" value={stats.pendingCount} hint="Aguardando envio" />
        <StatCard icon="fa-circle-check" label="Listas concluídas" value={stats.completedCount} hint="Entregues" tone="teal" />
        <StatCard icon="fa-users" label="Minha equipe" value={myTeams.length} hint="Equipes ativas" tone="lime" />
        <StatCard icon="fa-star" label="Média geral" value={stats.average !== null ? stats.average.toLocaleString('pt-BR') : '—'} hint="Em 0 a 10" tone="dark" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title"><i className="fas fa-calendar-days" /> Próximos prazos</h3>
          </div>
          <div className="card__body">
            {upcomingDeadlines.length === 0 ? (
              <EmptyState icon="fa-calendar-check" title="Nenhum prazo próximo" message="Você está em dia com suas listas." />
            ) : (
              <ul className="deadline-list">
                {upcomingDeadlines.slice(0, 5).map((d) => (
                  <li key={d.id}>
                    <button className="deadline-list__item" onClick={() => navigate(`/aluno/listas/${d.id}`)}>
                      <div>
                        <strong>{d.title}</strong>
                        <span className={d.late ? 'text--danger' : ''}>
                          {d.late ? 'Prazo vencido' : `Entrega: ${formatDate(d.dueDate)}`}
                        </span>
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
            <h3 className="card__title"><i className="fas fa-clock-rotate-left" /> Atividades recentes</h3>
          </div>
          <div className="card__body">
            {recentActivities.length === 0 ? (
              <EmptyState icon="fa-clock" title="Sem atividades" message="Suas entregas aparecerão aqui." />
            ) : (
              <ul className="activity-list">
                {recentActivities.map((a, i) => (
                  <li key={i} className="activity-item">
                    <span className="activity-item__dot" />
                    <div className="activity-item__body">
                      <strong>{a.title}</strong>
                      <span className={a.status === 'CORRIGIDA' ? 'text--success' : ''}>
                        {a.status === 'CORRIGIDA' ? 'Corrigida' : 'Enviada'} · {timeAgo(a.date)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title"><i className="fas fa-bell" /> Notificações</h3>
            <Link to="/aluno/notificacoes" className="link">Ver todas</Link>
          </div>
          <div className="card__body">
            {notifications.length === 0 ? (
              <EmptyState icon="fa-bell-slash" title="Sem notificações" message="Você está por dentro de tudo." />
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
            <h3 className="card__title"><i className="fas fa-users" /> Minha equipe</h3>
            {myTeams.length > 0 && (
              <Link to="/aluno/equipe" className="link">Ver equipe</Link>
            )}
          </div>
          <div className="card__body">
            {myTeams.length === 0 ? (
              <EmptyState
                icon="fa-users-slash"
                title="Você ainda não está em uma equipe"
                message="Crie sua equipe ou aceite um convite para começar."
                action={<Link to="/aluno/equipe" className="btn btn--primary btn--sm">Criar equipe</Link>}
              />
            ) : (
              myTeams.map((team) => (
                <div key={team.id} className="mini-team">
                  <div className="mini-team__head">
                    <Avatar name={team.name} size="md" />
                    <div>
                      <strong>{team.name}</strong>
                      <span>Líder: {team.leader?.user?.name}</span>
                    </div>
                  </div>
                  <div className="mini-team__members">
                    {team.members.slice(0, 4).map((m) => (
                      <Avatar key={m.studentId} name={m.student?.user?.name} size="sm" />
                    ))}
                    {team.members.length > 4 && <span className="mini-team__more">+{team.members.length - 4}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
