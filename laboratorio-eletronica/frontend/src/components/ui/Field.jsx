import React from 'react';

export function Field({ label, error, hint, children, required, htmlFor }) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="field__required"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="field__error">
          <i className="fas fa-circle-exclamation" /> {error}
        </span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function TextInput({ error, ...props }) {
  return <input className="input" {...props} />;
}

export function Textarea({ rows = 4, ...props }) {
  return <textarea className="textarea" rows={rows} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className="select" {...props}>
      {children}
    </select>
  );
}
