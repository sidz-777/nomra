'use client';

import React from 'react';

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
    <div id="arabicInputGroup">
      <label className="label" htmlFor="nameInputAr">
        Arabic Spelling (Auto-suggested &amp; Fully Editable)
      </label>
      <input
        className="input rtl"
        id="nameInputAr"
        dir="rtl"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="فاطمة"
      />
      <div className="helper-note" style={{ marginTop: '8px' }}>
        💡 <span id="arabicSuggestionNote">{note}</span>
      </div>
      {error && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}
