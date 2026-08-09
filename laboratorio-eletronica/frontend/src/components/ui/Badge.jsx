import React from 'react';

const STATUS_CONFIG = {
  PENDENTE: { label: 'Pendente', icon: 'fa-clock', cls: 'badge--warning' },
  'EM_ANDAMENTO': { label: 'Em andamento', icon: 'fa-spinner', cls: 'badge--info' },
  ENVIADA: { label: 'Enviada', icon: 'fa-paper-plane', cls: 'badge--info' },
  CORRIGIDA: { label: 'Corrigida', icon: 'fa-check-double', cls: 'badge--success' },
  ATRASADA: { label: 'Atrasada', icon: 'fa-exclamation', cls: 'badge--danger' },
  RASCUNHO: { label: 'Rascunho', icon: 'fa-pen', cls: 'badge--neutral' },
  PUBLICADA: { label: 'Publicada', icon: 'fa-bullhorn', cls: 'badge--success' },
  ACEITA: { label: 'Aceita', icon: 'fa-check', cls: 'badge--success' },
  RECUSADA: { label: 'Recusada', icon: 'fa-xmark', cls: 'badge--danger' },
  PENDENTE_CONVITE: { label: 'Pendente', icon: 'fa-clock', cls: 'badge--warning' }
};

export function Badge({ status, label }) {
  const config = STATUS_CONFIG[status] || { label: status || label || '—', icon: 'fa-tag', cls: 'badge--neutral' };
  return (
    <span className={`badge ${config.cls}`}>
      <i className={`fas ${config.icon}`} aria-hidden="true" />
      {label || config.label}
    </span>
  );
}
