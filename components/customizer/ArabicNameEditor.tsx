'use client';

import React from 'react';
import { Field, Input } from '@/components/ui';

interface ArabicNameEditorProps {
  value: string;
  onChange: (value: string) => void;
  note: string;
  error?: string;
}

export function ArabicNameEditor({
  value,
  onChange,
  note,
  error,
}: ArabicNameEditorProps) {
  return (
    <div className="space-y-1.5 p-3.5 rounded-lg border border-namora-gold/30 bg-namora-gold/5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-namora-gold">
          Arabic Spelling (Auto-Suggested &amp; Fully Editable)
        </span>
        <span className="text-[10px] font-mono text-namora-muted">RTL Native</span>
      </div>

      <Field error={error}>
        <Input
          dir="rtl"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="فاطمة"
          error={!!error}
          className="font-arabic text-xl sm:text-2xl text-right tracking-wide h-12"
        />
      </Field>

      <div className="flex items-start gap-1.5 text-[11px] text-namora-muted font-light leading-snug">
        <span className="text-namora-gold">💡</span>
        <span>{note}</span>
      </div>
    </div>
  );
}
