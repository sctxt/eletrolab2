import React from 'react';

export function Spinner({ size = 'md', text }) {
  return (
    <div className={`spinner spinner--${size}`} role="status" aria-live="polite">
      <div className="spinner__ring" aria-hidden="true" />
      {text && <span className="spinner__text">{text}</span>}
    </div>
  );
}

export function PageLoader({ text = 'Carregando...' }) {
  return (
    <div className="page-loader">
      <Spinner size="lg" text={text} />
    </div>
  );
}
