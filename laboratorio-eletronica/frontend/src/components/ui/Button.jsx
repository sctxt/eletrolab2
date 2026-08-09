import React from 'react';

const STYLES = {
  primary: 'btn btn--primary',
  secondary: 'btn btn--secondary',
  outline: 'btn btn--outline',
  danger: 'btn btn--danger',
  ghost: 'btn btn--ghost',
  success: 'btn btn--success'
};

const SIZES = {
  sm: 'btn--sm',
  md: '',
  lg: 'btn--lg'
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  ...props
}) {
  const classes = [STYLES[variant] || STYLES.primary, SIZES[size] || '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
