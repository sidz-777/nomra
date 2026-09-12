'use client';

import React from 'react';

export interface PillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
  children: React.ReactNode;
}

export function Pill({
  active = false,
  count,
  className = '',
  children,
  ...props
}: PillProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-namora-gold/50 ${
        active
          ? 'bg-namora-gold text-[#141210] font-semibold shadow-subtle border border-namora-gold'
          : 'bg-namora-card text-namora-muted hover:text-namora-ink hover:border-namora-gold/50 border border-namora-line'
      } ${className}`}
      {...props}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            active ? 'bg-[#141210]/20 text-[#141210]' : 'bg-namora-soft text-namora-muted'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
