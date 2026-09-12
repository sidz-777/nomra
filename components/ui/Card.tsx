import React from 'react';

export type CardVariant =
  | 'standard'
  | 'elevated'
  | 'product'
  | 'glass'
  | 'editorial';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  standard:
    'bg-namora-card border border-namora-line rounded-lg shadow-subtle',
  elevated:
    'bg-namora-card border border-namora-line rounded-xl shadow-elevated',
  product:
    'bg-namora-card border border-namora-line rounded-lg shadow-card overflow-hidden hover:border-namora-gold/60 transition-all duration-300',
  glass:
    'bg-namora-card/70 backdrop-blur-md border border-namora-line/80 rounded-xl shadow-luxury',
  editorial:
    'bg-namora-soft border border-namora-line-soft rounded-2xl p-6 sm:p-8 relative overflow-hidden',
};

export function Card({
  variant = 'standard',
  interactive = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`${variantStyles[variant]} ${
        interactive
          ? 'cursor-pointer hover:border-namora-gold hover:shadow-luxury transition-all duration-300 active:scale-[0.995]'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
