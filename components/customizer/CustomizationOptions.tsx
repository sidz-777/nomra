'use client';

import React from 'react';
import {
  CustomizationFont,
  CustomizationTextSize,
} from './state/customization-types';

interface CustomizationOptionsProps {
  font: CustomizationFont;
  textSize: CustomizationTextSize;
  onChangeFont: (font: CustomizationFont) => void;
  onChangeTextSize: (size: CustomizationTextSize) => void;
}

const FONTS: { id: CustomizationFont; label: string; preview: string; fontClass: string }[] = [
  { id: 'classic', label: 'Classic', preview: 'Aa', fontClass: 'font-hero' },
  { id: 'royal', label: 'Royal', preview: 'Aa', fontClass: 'font-luxury' },
  { id: 'calligraphy', label: 'Calligraphy', preview: 'خط', fontClass: 'font-arabic' },
];

const SIZES: { id: CustomizationTextSize; label: string; desc: string }[] = [
  { id: 'subtle', label: 'Subtle', desc: '0.78x scale' },
  { id: 'balanced', label: 'Balanced', desc: '1.0x standard' },
  { id: 'statement', label: 'Statement', desc: '1.35x prominent' },
];

export function CustomizationOptions({
  font,
  textSize,
  onChangeFont,
  onChangeTextSize,
}: CustomizationOptionsProps) {
  return (
    <div className="space-y-4">
      {/* 5. Typography & Style */}
      <div className="space-y-2">
        <span className="block text-xs uppercase tracking-wider font-semibold text-namora-ink">
          5. Calligraphy Typography
        </span>

        <div className="grid grid-cols-3 gap-2">
          {FONTS.map((f) => {
            const isActive = font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChangeFont(f.id)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-1 transition select-none ${
                  isActive
                    ? 'bg-namora-soft border-namora-gold ring-1 ring-namora-gold/50 shadow-subtle'
                    : 'bg-namora-card border-namora-line hover:border-namora-gold/50'
                }`}
              >
                <span className={`text-base ${f.fontClass} text-namora-gold`}>
                  {f.preview}
                </span>
                <span className={`text-[11px] ${isActive ? 'text-namora-gold font-semibold' : 'text-namora-ink'}`}>
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scale / Text Size */}
      <div className="space-y-2">
        <span className="block text-xs uppercase tracking-wider font-semibold text-namora-ink">
          Scale &amp; Proportion
        </span>

        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((s) => {
            const isActive = textSize === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChangeTextSize(s.id)}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition select-none ${
                  isActive
                    ? 'bg-namora-gold text-black border-namora-gold font-semibold shadow-subtle'
                    : 'bg-namora-card text-namora-ink border-namora-line hover:border-namora-gold/50'
                }`}
              >
                <span className="text-xs font-medium">{s.label}</span>
                <span className={`text-[10px] ${isActive ? 'text-black/80 font-mono' : 'text-namora-muted font-mono'}`}>
                  {s.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Physical Standard Frame Size */}
      <div className="space-y-1.5">
        <span className="block text-xs uppercase tracking-wider font-semibold text-namora-ink">
          6. Frame Dimensions
        </span>
        <div className="p-2.5 rounded-lg border border-namora-line bg-namora-soft/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-namora-gold" />
            <span className="text-xs font-semibold text-namora-ink">A4 Standard Format</span>
          </div>
          <span className="text-[11px] font-mono text-namora-muted">
            21.0 × 29.7 cm (Universal Desk &amp; Wall)
          </span>
        </div>
      </div>
    </div>
  );
}
