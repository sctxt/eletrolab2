export const DIGIT_COLORS = [
  { label: 'Preto', value: 0, color: '#1a1a1a' },
  { label: 'Marrom', value: 1, color: '#7b4a2a' },
  { label: 'Vermelho', value: 2, color: '#d32f2f' },
  { label: 'Laranja', value: 3, color: '#f57c00' },
  { label: 'Amarelo', value: 4, color: '#fbc02d' },
  { label: 'Verde', value: 5, color: '#388e3c' },
  { label: 'Azul', value: 6, color: '#1976d2' },
  { label: 'Violeta', value: 7, color: '#7b1fa2' },
  { label: 'Cinza', value: 8, color: '#9e9e9e' },
  { label: 'Branco', value: 9, color: '#ffffff' }
];

export const MULTIPLIER_COLORS = [
  { label: 'Preto (×1)', value: 1, color: '#1a1a1a' },
  { label: 'Marrom (×10)', value: 10, color: '#7b4a2a' },
  { label: 'Vermelho (×100)', value: 100, color: '#d32f2f' },
  { label: 'Laranja (×1 kΩ)', value: 1e3, color: '#f57c00' },
  { label: 'Amarelo (×10 kΩ)', value: 1e4, color: '#fbc02d' },
  { label: 'Verde (×100 kΩ)', value: 1e5, color: '#388e3c' },
  { label: 'Azul (×1 MΩ)', value: 1e6, color: '#1976d2' },
  { label: 'Violeta (×10 MΩ)', value: 1e7, color: '#7b1fa2' },
  { label: 'Cinza (×100 MΩ)', value: 1e8, color: '#9e9e9e' },
  { label: 'Branco (×1 GΩ)', value: 1e9, color: '#ffffff' },
  { label: 'Dourado (×0,1)', value: 0.1, color: '#d4af37' },
  { label: 'Prata (×0,01)', value: 0.01, color: '#b0b0b0' }
];

export const TOLERANCES = [
  { label: '±0,1%', value: 0.001, color: '#7b1fa2' },
  { label: '±0,25%', value: 0.0025, color: '#1976d2' },
  { label: '±0,5%', value: 0.005, color: '#388e3c' },
  { label: '±1%', value: 0.01, color: '#7b4a2a' },
  { label: '±2%', value: 0.02, color: '#d32f2f' },
  { label: '±5%', value: 0.05, color: '#d4af37' },
  { label: '±10%', value: 0.1, color: '#b0b0b0' },
  { label: '±20%', value: 0.2, color: 'transparent' }
];

export const E_SERIES = {
  E12: [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2],
  E24: [
    1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
    3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1
  ],
  E96: [
    1.0, 1.02, 1.05, 1.07, 1.1, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.3,
    1.33, 1.37, 1.4, 1.43, 1.47, 1.5, 1.54, 1.58, 1.62, 1.65, 1.69, 1.74,
    1.78, 1.82, 1.87, 1.91, 1.96, 2.0, 2.05, 2.1, 2.15, 2.21, 2.26, 2.32,
    2.37, 2.43, 2.49, 2.55, 2.61, 2.67, 2.74, 2.8, 2.87, 2.94, 3.01, 3.09,
    3.16, 3.24, 3.32, 3.4, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12,
    4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49,
    5.62, 5.76, 5.9, 6.04, 6.19, 6.34, 6.49, 6.65, 6.81, 6.98, 7.15, 7.32,
    7.5, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76
  ]
};

export const E_SERIES_DESC = {
  E12: '12 valores por década (±10%)',
  E24: '24 valores por década (±5%)',
  E96: '96 valores por década (±1%)'
};

export function fmtNumber(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  const r = Math.round(n * 1e9) / 1e9;
  return String(r).replace('.', ',');
}

export function formatResistance(ohms) {
  if (!Number.isFinite(ohms)) return '—';
  const a = Math.abs(ohms);
  if (a >= 1e9) return `${fmtNumber(ohms / 1e9)} GΩ`;
  if (a >= 1e6) return `${fmtNumber(ohms / 1e6)} MΩ`;
  if (a >= 1e3) return `${fmtNumber(ohms / 1e3)} kΩ`;
  return `${fmtNumber(ohms)} Ω`;
}

export function parseResistanceInput(value, unit) {
  const num = parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(num) || num < 0) return null;
  const factor = { 'Ω': 1, 'kΩ': 1e3, 'MΩ': 1e6 }[unit] || 1;
  return num * factor;
}

export function codeToResistance(digits, multiplier, toleranceFraction) {
  const digitValue = digits.reduce((acc, d) => acc * 10 + d, 0);
  const ohms = digitValue * multiplier;
  return {
    ohms,
    min: ohms * (1 - toleranceFraction),
    max: ohms * (1 + toleranceFraction)
  };
}

export function resistanceToColors(ohms, bandCount) {
  if (!Number.isFinite(ohms) || ohms <= 0) return null;

  const n = bandCount === 5 ? 3 : 2;
  const maxDigits = Math.pow(10, n);
  let exp = Math.floor(Math.log10(ohms));
  let m = exp - (n - 1);
  let scaled = ohms / Math.pow(10, m);
  let digits = Math.round(scaled);
  let exact = Math.abs(scaled - digits) < 1e-9;

  if (digits >= maxDigits) {
    m += 1;
    digits = Math.round(ohms / Math.pow(10, m));
    exact = false;
  }

  if (m < -2 || m > 9) return { outOfRange: true, bandCount };

  const mult = Math.pow(10, m);
  const multiplierColor =
    m >= 0
      ? { color: DIGIT_COLORS[m].color, label: MULTIPLIER_COLORS[m].label }
      : m === -1
        ? { color: '#d4af37', label: 'Dourado (×0,1)' }
        : { color: '#b0b0b0', label: 'Prata (×0,01)' };

  const digitColors = String(digits)
    .padStart(n, '0')
    .split('')
    .map((ch) => DIGIT_COLORS[Number(ch)].color);

  return {
    bandCount,
    digitColors,
    multiplierColor,
    mult,
    digits,
    exact,
    value: digits * mult,
    outOfRange: false
  };
}

export function nearestInSeries(ohms, series) {
  if (!Number.isFinite(ohms) || ohms <= 0) return null;
  const exp = Math.floor(Math.log10(ohms));
  const mantissa = ohms / Math.pow(10, exp);

  let best = null;
  let bestDiff = Infinity;
  let bestLow = null;
  let bestHigh = null;

  for (const v of series) {
    const diff = Math.abs(v - mantissa);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = v;
    }
    const full = v * Math.pow(10, exp);
    if (full <= ohms + ohms * 1e-9) bestLow = full;
    else if (bestHigh === null) bestHigh = full;
  }

  const value = best * Math.pow(10, exp);
  return {
    value,
    mantissa: best,
    exact: Math.abs(value - ohms) < ohms * 1e-6,
    lower: bestLow,
    higher: bestHigh
  };
}
