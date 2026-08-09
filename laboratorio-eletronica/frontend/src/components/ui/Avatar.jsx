import React from 'react';
import { initials } from './format';

const COLORS = [
  'avatar--green',
  'avatar--teal',
  'avatar--lime',
  'avatar--emerald',
  'avatar--dark'
];

export function Avatar({ name, size = 'md' }) {
  const hash = String(name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const color = COLORS[hash % COLORS.length];
  return (
    <span className={`avatar avatar--${size} ${color}`} title={name}>
      {initials(name)}
    </span>
  );
}
