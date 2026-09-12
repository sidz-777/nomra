'use client';

import React, { forwardRef } from 'react';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  badge?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, badge, className = '', id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).substring(2, 8)}`;

    return (
      <label
        htmlFor={inputId}
        className={`relative flex items-start gap-3 p-3 bg-namora-card border border-namora-line hover:border-namora-gold/60 rounded-lg cursor-pointer transition-all duration-200 select-none ${className}`}
      >
        <div className="flex items-center h-5 mt-0.5">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            className="w-4 h-4 rounded border-namora-line bg-namora-bg text-namora-gold focus:ring-2 focus:ring-namora-gold/40 focus:ring-offset-0 transition duration-150 cursor-pointer accent-namora-gold"
            {...props}
          />
        </div>
        <div className="flex-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-namora-ink">{label}</span>
            {badge && (
              <span className="text-[11px] font-mono px-2 py-0.5 bg-namora-gold/15 text-namora-gold rounded">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-namora-muted mt-0.5 font-light leading-normal">
              {description}
            </p>
          )}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
