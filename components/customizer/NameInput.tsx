'use client';

import React from 'react';

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
    <div>
      <div className="quick-names-wrap">
        <div className="quick-names-header">
          <label className="label" htmlFor="nameInputEn" style={{ marginBottom: 0 }}>
            3. English Name
          </label>
          <span className="quick-try-hint">✦ Quick Try:</span>
        </div>
        <div className="quick-names-row">
          {QUICK_NAMES.map((name) => {
            const isActive = value.trim().toLowerCase() === name.toLowerCase();
            return (
              <button
                key={name}
                type="button"
                className={`quick-name-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectQuickName(name)}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
      <input
        className="input"
        id="nameInputEn"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Fatima"
      />
      {error && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}
