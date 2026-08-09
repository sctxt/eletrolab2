import React, { useEffect, useState } from 'react';
import { notificationApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/Page';
import { Button } from '../../components/ui/Button';
import { timeAgo } from '../../components/ui/format';

const ICONS = {
  'Convite para equipe': 'fa-envelope-open-text',
  'Convite aceito': 'fa-handshake',
  'Nova lista': 'fa-list-check',
  'Nova lista publicada': 'fa-bullhorn',
  'Nova lista respondida': 'fa-paper-plane',
  'Prazo próximo': 'fa-clock',
  'Lista corrigida': 'fa-check-double',
  'Nova nota': 'fa-star',
  'Comentário do professor': 'fa-comment',
  'Nova equipe': 'fa-users',
  'Nova equipe criada': 'fa-users',
  'Novo integrante': 'fa-user-plus',
  'Lista aguardando correção': 'fa-clipboard-check',
  'Removido da equipe': 'fa-user-minus',
  'Membro saiu da equipe': 'fa-right-from-bracket',
  'Nova liderança': 'fa-crown',
  'Bem-vindo à equipe': 'fa-handshake'
};

export default function Notificacoes() {
  const { show } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationApi
      .list()
      .then((res) => setNotifications(res.notifications))
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleRead = async (n) => {
    if (n.read) return;
    try {
      await notificationApi.markRead(n.id);
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  };

  const handleReadAll = async () => {
    try {
      const res = await notificationApi.markAllRead();
      show(res.message, 'success');
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notificações"
        subtitle="Avisos e atualizações do laboratório."
        icon="fa-bell"
        actions={
          unread > 0 ? (
            <Button variant="outline" size="sm" onClick={handleReadAll}>
              <i className="fas fa-check-double" /> Marcar todas como lidas
            </Button>
          ) : null
        }
      />

      {loading ? (
        <PageLoader text="Carregando notificações..." />
      ) : notifications.length === 0 ? (
        <EmptyState icon="fa-bell-slash" title="Nenhuma notificação" message="Você está por dentro de tudo." />
      ) : (
        <ul className="notification-list">
          {notifications.map((n) => {
            const icon = ICONS[n.title] || 'fa-circle-info';
            return (
              <li key={n.id}>
                <button
                  className={`notification-item ${n.read ? '' : 'notification-item--unread'}`}
                  onClick={() => handleRead(n)}
                >
                  <span className="notification-item__icon">
                    <i className={`fas ${icon}`} />
                  </span>
                  <div className="notification-item__body">
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <span>{timeAgo(n.createdAt)}</span>
                  </div>
                  {!n.read && <span className="notification-item__dot" title="Não lida" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
