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

export function CustomizationOptions({
  font,
  textSize,
  onChangeFont,
  onChangeTextSize,
}: CustomizationOptionsProps) {
  return (
    <>
      <div>
        <span className="label">5. Text Style</span>
        <div className="style-block">
          <div className="style-row-label">Font</div>
          <div className="style-chips" id="fontChips">
            <button
              type="button"
              className={`style-chip ${font === 'classic' ? 'active' : ''}`}
              data-font="classic"
              onClick={() => onChangeFont('classic')}
            >
              <span className="font-preview">Aa</span>
              Classic
            </button>
            <button
              type="button"
              className={`style-chip ${font === 'royal' ? 'active' : ''}`}
              data-font="royal"
              onClick={() => onChangeFont('royal')}
            >
              <span className="font-preview">Aa</span>
              Royal
            </button>
            <button
              type="button"
              className={`style-chip ${font === 'calligraphy' ? 'active' : ''}`}
              data-font="calligraphy"
              onClick={() => onChangeFont('calligraphy')}
            >
              <span className="font-preview">Aa</span>
              Calligraphy
            </button>
          </div>
        </div>

        <div className="style-block">
          <div className="style-row-label">Size</div>
          <div className="style-chips" id="sizeChips">
            <button
              type="button"
              className={`style-chip ${textSize === 'subtle' ? 'active' : ''}`}
              data-size="subtle"
              onClick={() => onChangeTextSize('subtle')}
            >
              Subtle
            </button>
            <button
              type="button"
              className={`style-chip ${textSize === 'balanced' ? 'active' : ''}`}
              data-size="balanced"
              onClick={() => onChangeTextSize('balanced')}
            >
              Balanced
            </button>
            <button
              type="button"
              className={`style-chip ${textSize === 'statement' ? 'active' : ''}`}
              data-size="statement"
              onClick={() => onChangeTextSize('statement')}
            >
              Statement
            </button>
          </div>
        </div>
      </div>

      <div>
        <span className="label">6. Size</span>
        <div className="option-row">
          <button type="button" className="chip chip-static">A4 Size Only</button>
        </div>
      </div>
    </>
  );
}
