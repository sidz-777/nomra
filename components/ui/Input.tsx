'use client';

import React, { forwardRef } from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  isArabic?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      error = false,
      isArabic = false,
      leftIcon,
      rightIcon,
      className = '',
      dir,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative w-full flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-namora-muted pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          dir={dir || (isArabic ? 'rtl' : 'ltr')}
          className={`w-full px-4 py-3 bg-namora-bg text-namora-ink border rounded-md text-sm placeholder:text-namora-muted/60 transition-colors duration-200 focus:outline-none ${
            isArabic ? 'font-arabic text-base' : 'font-sans'
          } ${
            error
              ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30'
              : 'border-namora-line focus:border-namora-gold focus:ring-2 focus:ring-namora-gold/20'
          } ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 text-namora-muted pointer-events-none flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
