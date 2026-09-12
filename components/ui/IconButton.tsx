'use client';

import React from 'react';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // Required for accessibility
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'ghost' | 'primary' | 'card';
  shape?: 'circle' | 'rounded';
  children: React.ReactNode;
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const variantStyles = {
  outline:
    'bg-transparent border border-namora-line hover:border-namora-gold text-namora-ink hover:text-namora-gold',
  ghost: 'bg-transparent border-transparent hover:bg-namora-soft text-namora-muted hover:text-namora-ink',
  primary: 'bg-namora-gold text-[#141210] hover:bg-namora-gold-hover border border-namora-gold',
  card: 'bg-namora-card border border-namora-line hover:border-namora-gold text-namora-ink',
};

export function IconButton({
  label,
  size = 'md',
  variant = 'outline',
  shape = 'circle',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-namora-gold/50 disabled:opacity-40 disabled:cursor-not-allowed ${
        shape === 'circle' ? 'rounded-full' : 'rounded-md'
      } ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
