import React from 'react';

export default function ResistorVisual({ bands = [] }) {
  const hasTransparent = bands.some((b) => !b.color || b.color === 'transparent');
  return (
    <div className="resistor-visual" aria-label="Visualização do resistor">
      <span className="resistor__lead resistor__lead--left" />
      <div className="resistor">
        <div className="resistor__body">
          {bands.map((band, i) => (
            <span
              key={i}
              className={`resistor__band ${i === bands.length - 1 ? 'resistor__band--gap' : ''} ${
                !band.color || band.color === 'transparent' ? 'resistor__band--none' : ''
              }`}
              style={band.color && band.color !== 'transparent' ? { background: band.color } : undefined}
              title={band.label}
            />
          ))}
        </div>
      </div>
      <span className="resistor__lead resistor__lead--right" />
      {hasTransparent && (
        <span className="resistor-visual__note">
          <i className="fas fa-circle-info" /> Faixa com borda tracejada representa ausência de cor (sem tolerância ±20%).
        </span>
      )}
    </div>
  );
}

export function BandLegend({ items = [] }) {
  if (items.length === 0) return null;
  return (
    <div className="band-legend">
      {items.map((item, i) => (
        <div key={i} className="band-legend__item">
          <span
            className={`band-legend__swatch ${!item.color || item.color === 'transparent' ? 'band-legend__swatch--none' : ''}`}
            style={item.color && item.color !== 'transparent' ? { background: item.color } : undefined}
          />
          <span className="band-legend__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
