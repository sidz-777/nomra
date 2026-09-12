'use client';

import React from 'react';
import { CustomizationInk } from './state/customization-types';

interface FinishSelectorProps {
  ink: CustomizationInk;
  customColor: string;
  onChangeInk: (ink: CustomizationInk) => void;
  onChangeCustomColor: (color: string) => void;
}

const INK_SWATCHES: {
  id: CustomizationInk;
  label: string;
  dotClass: string;
}[] = [
  { id: 'black', label: 'Black', dotClass: 'bg-[#1A1A1A] border-white/20' },
  {
    id: 'gold',
    label: 'Gold Foil',
    dotClass: 'bg-gradient-to-tr from-[#9E742A] via-[#D4AF6A] to-[#FFF6D6] border-amber-300/40',
  },
  { id: 'ivory', label: 'Ivory', dotClass: 'bg-[#F5EFE0] border-black/20' },
  {
    id: 'rosegold',
    label: 'Rose Gold',
    dotClass: 'bg-gradient-to-tr from-[#91542C] via-[#C88A58] to-[#FFEBE0] border-orange-300/40',
  },
  {
    id: 'custom',
    label: 'Custom',
    dotClass: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 border-white/30',
  },
];

export function FinishSelector({
  ink,
  customColor,
  onChangeInk,
  onChangeCustomColor,
}: FinishSelectorProps) {
  return (
    <div className="space-y-2">
      <span className="block text-xs uppercase tracking-wider font-semibold text-namora-ink">
        4. Text Ink Color
      </span>

      {/* Ink Swatches */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {INK_SWATCHES.map((swatch) => {
          const isActive = ink === swatch.id;
          return (
            <button
              key={swatch.id}
              type="button"
              onClick={() => onChangeInk(swatch.id)}
              className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition select-none ${
                isActive
                  ? 'bg-namora-soft border-namora-gold ring-1 ring-namora-gold/50 shadow-subtle'
                  : 'bg-namora-card border-namora-line hover:border-namora-gold/50'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full border shadow-sm ${swatch.dotClass}`}
              />
              <span className={`text-[11px] ${isActive ? 'text-namora-gold font-semibold' : 'text-namora-ink'}`}>
                {swatch.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Color Input Row (shown when 'custom' is active) */}
      {ink === 'custom' && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-namora-line bg-namora-soft animate-in fade-in duration-200 mt-2">
          <label
            htmlFor="custom-color-picker"
            className="text-xs text-namora-muted cursor-pointer"
          >
            Pick Hex Color:
          </label>
          <input
            id="custom-color-picker"
            type="color"
            value={customColor}
            onChange={(e) => onChangeCustomColor(e.target.value)}
            className="w-8 h-8 rounded border border-namora-line bg-transparent cursor-pointer"
          />
          <span className="font-mono text-xs text-namora-gold font-semibold uppercase">
            {customColor}
          </span>
        </div>
      )}
    </div>
  );
}
