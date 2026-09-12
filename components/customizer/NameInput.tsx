'use client';

import React from 'react';
import { Field, Input } from '@/components/ui';

interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectQuickName: (name: string) => void;
  error?: string;
}

const QUICK_NAMES = ['Fatima', 'Zayd', 'Aisha', 'Ayaan', 'Noor', 'Omar'];

export function NameInput({
  value,
  onChange,
  onSelectQuickName,
  error,
}: NameInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="text-xs uppercase tracking-wider font-semibold text-namora-ink">
          3. English Name
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-namora-gold font-mono uppercase tracking-wider">
            ✦ Quick Try:
          </span>
          <div className="flex flex-wrap gap-1">
            {QUICK_NAMES.map((name) => {
              const isActive = value.trim().toLowerCase() === name.toLowerCase();
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelectQuickName(name)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    isActive
                      ? 'bg-namora-gold text-black font-semibold shadow-sm'
                      : 'bg-namora-soft text-namora-muted hover:text-namora-ink border border-namora-line-soft'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Field error={error}>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Fatima or Zayd"
          error={!!error}
          className="font-medium text-sm sm:text-base tracking-wide"
        />
      </Field>
    </div>
  );
}
