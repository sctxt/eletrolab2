import React from 'react';

export default function CalcResult({ label, value, hint, tone = 'green', icon }) {
  return (
    <div className={`calc-result calc-result--${tone}`}>
      <span className="calc-result__label">
        {icon && <i className={`fas ${icon}`} />} {label}
      </span>
      <strong className="calc-result__value">{value}</strong>
      {hint && <span className="calc-result__hint">{hint}</span>}
    </div>
  );
}
