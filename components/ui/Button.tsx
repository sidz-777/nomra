'use client';

import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-namora-gold hover:bg-namora-gold-hover text-[#141210] font-semibold border border-namora-gold shadow-subtle hover:shadow-luxury active:scale-[0.99]',
  secondary:
    'bg-namora-card hover:bg-namora-soft text-namora-ink border border-namora-line hover:border-namora-gold active:scale-[0.99]',
  outline:
    'bg-transparent hover:bg-namora-gold-soft text-namora-ink hover:text-namora-gold border border-namora-line hover:border-namora-gold active:scale-[0.99]',
  ghost:
    'bg-transparent hover:bg-namora-soft text-namora-muted hover:text-namora-ink border border-transparent',
  danger:
    'bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-700/50',
  success:
    'bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-700/50',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-md gap-2 tracking-wide',
  lg: 'px-7 py-3.5 text-base rounded-md gap-2.5 tracking-wider font-serif',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-namora-gold/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}
