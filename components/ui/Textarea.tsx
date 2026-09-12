'use client';

import React, { forwardRef } from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  isArabic?: boolean;
  maxLength?: number;
  currentLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      error = false,
      isArabic = false,
      maxLength,
      currentLength,
      className = '',
      dir,
      rows = 4,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          dir={dir || (isArabic ? 'rtl' : 'ltr')}
          rows={rows}
          maxLength={maxLength}
          className={`w-full px-4 py-3 bg-namora-bg text-namora-ink border rounded-md text-sm placeholder:text-namora-muted/60 transition-colors duration-200 focus:outline-none resize-y ${
            isArabic ? 'font-arabic text-base' : 'font-sans'
          } ${
            error
              ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30'
              : 'border-namora-line focus:border-namora-gold focus:ring-2 focus:ring-namora-gold/20'
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {maxLength !== undefined && (
          <div className="text-[11px] text-namora-muted text-right mt-1">
            {currentLength ?? 0} / {maxLength}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
