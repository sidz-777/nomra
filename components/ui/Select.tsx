'use client';

import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, error = false, className = '', ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={`w-full px-4 py-3 bg-namora-bg text-namora-ink border rounded-md text-sm transition-colors duration-200 focus:outline-none appearance-none cursor-pointer ${
            error
              ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30'
              : 'border-namora-line focus:border-namora-gold focus:ring-2 focus:ring-namora-gold/20'
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-namora-card text-namora-ink">
              {opt.label}
            </option>
          ))}
        </select>
        {/* Dropdown Chevron Icon */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-namora-muted">
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
