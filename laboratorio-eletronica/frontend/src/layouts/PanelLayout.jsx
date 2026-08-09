import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { notificationApi } from '../services/api';

export default function PanelLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      notificationApi
        .list()
        .then((data) => {
          if (mounted) setUnreadCount(data.unreadCount);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="panel">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadCount={unreadCount}
      />
      <div className="panel__main">
        <header className="panel__topbar">
          <button
            className="panel__burger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <i className="fas fa-bars" />
          </button>
          <div className="panel__topbar-title">
            <span className="panel__topbar-title-brand">
              <i className="fas fa-microchip" /> Lab Eletrônica
            </span>
          </div>
          <div className="panel__topbar-actions">
            <a href="/" className="icon-btn" title="Página inicial">
              <i className="fas fa-globe" />
            </a>
          </div>
        </header>
        <main className="panel__content">
          <div className="panel__container">
            <Outlet context={{ setUnreadCount, unreadCount }} />
          </div>
        </main>
      </div>
    </div>
  );
}
