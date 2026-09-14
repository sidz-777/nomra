'use client';

import React from 'react';
import { CustomizationInk } from './state/customization-types';

interface FinishSelectorProps {
  ink: CustomizationInk;
  customColor: string;
  onChangeInk: (ink: CustomizationInk) => void;
  onChangeCustomColor: (color: string) => void;
}

const INK_OPTIONS: { id: CustomizationInk; label: string }[] = [
  { id: 'black', label: 'Black' },
  { id: 'gold', label: 'Gold Foil' },
  { id: 'ivory', label: 'Ivory' },
  { id: 'rosegold', label: 'Rose Gold' },
  { id: 'custom', label: 'Custom' },
];

export function FinishSelector({
  ink,
  customColor,
  onChangeInk,
  onChangeCustomColor,
}: FinishSelectorProps) {
  return (
    <div>
      <span className="label">4. Text Ink Color</span>
      <div className="ink-picker" id="inkPicker">
        {INK_OPTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`ink-swatch ${ink === item.id ? 'active' : ''}`}
            data-ink={item.id}
            onClick={() => onChangeInk(item.id)}
          >
            <span className="ink-swatch-circle" />
            <span className="ink-swatch-label">{item.label}</span>
          </button>
        ))}
      </div>
      <div
        className={`ink-custom-row ${ink === 'custom' ? 'show' : ''}`}
        id="inkCustomRow"
        style={{ display: ink === 'custom' ? 'flex' : 'none' }}
      >
        <span className="ink-custom-label">Pick Color</span>
        <input
          type="color"
          className="ink-custom-input"
          id="inkCustomInput"
          value={customColor}
          onChange={(e) => onChangeCustomColor(e.target.value)}
        />
        <span className="ink-custom-hex" id="inkCustomHex">
          {customColor}
        </span>
      </div>
    </div>
  );
}
