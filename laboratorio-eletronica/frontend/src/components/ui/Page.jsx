import React from 'react';

export function PageHeader({ title, subtitle, icon, actions }) {
  return (
    <div className="page-header">
      <div className="page-header__info">
        {icon && (
          <span className="page-header__icon">
            <i className={`fas ${icon}`} />
          </span>
        )}
        <div>
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, hint, tone = 'green' }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">
        <i className={`fas ${icon}`} />
      </div>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <strong className="stat-card__value">{value}</strong>
        {hint && <span className="stat-card__hint">{hint}</span>}
      </div>
    </div>
  );
}
