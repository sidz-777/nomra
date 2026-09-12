import React from 'react';

export type BadgeVariant =
  | 'gold'
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  gold: 'bg-namora-gold/15 text-namora-gold border border-namora-gold/30',
  default: 'bg-namora-card text-namora-ink border border-namora-line',
  success: 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/40',
  warning: 'bg-amber-900/30 text-amber-300 border border-amber-700/40',
  error: 'bg-red-900/30 text-red-300 border border-red-700/40',
  neutral: 'bg-namora-soft text-namora-muted border border-namora-line-soft',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px] tracking-wider uppercase font-semibold rounded-sm',
  md: 'px-2.5 py-1 text-xs tracking-wider uppercase font-semibold rounded-md',
};

export function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono uppercase ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
