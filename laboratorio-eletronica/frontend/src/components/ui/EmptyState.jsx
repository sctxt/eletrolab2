import React from 'react';

export function EmptyState({ icon = 'fa-folder-open', title = 'Nenhum dado encontrado', message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <i className={`fas ${icon}`} aria-hidden="true" />
      </div>
      <h4 className="empty-state__title">{title}</h4>
      {message && <p className="empty-state__message">{message}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
