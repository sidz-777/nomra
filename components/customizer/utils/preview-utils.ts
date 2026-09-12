import React from 'react';
import {
  CustomizationFont,
  CustomizationInk,
  CustomizationTextSize,
} from '../state/customization-types';
import { PersianDesignItem } from '@/lib/storefront-data';

export function getFontFamily(font: CustomizationFont, isArabic: boolean): string {
  if (isArabic) {
    if (font === 'royal') {
      return 'var(--font-reem-kufi), sans-serif';
    }
    return 'var(--font-amiri), serif';
  }

  if (font === 'classic') {
    return 'var(--font-playfair), Georgia, serif';
  }
  if (font === 'royal') {
    return 'var(--font-cinzel), serif';
  }
  return 'var(--font-amiri), serif';
}

export function getFontWeight(textSize: CustomizationTextSize): number {
  return textSize === 'statement' ? 800 : 600;
}

export function getSizeMultiplier(textSize: CustomizationTextSize): number {
  if (textSize === 'subtle') return 0.78;
  if (textSize === 'statement') return 1.35;
  return 1.0;
}

export function getInkStyle(
  ink: CustomizationInk,
  customColor: string,
  defaultColor: string,
  defaultShadow: string
): React.CSSProperties {
  if (ink === 'gold') {
    return {
      backgroundImage:
        'linear-gradient(135deg, #FFF6D6 0%, #D4AF6A 45%, #9E742A 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.65))',
    };
  }

  if (ink === 'rosegold') {
    return {
      backgroundImage:
        'linear-gradient(135deg, #FFEBE0 0%, #C88A58 50%, #91542C 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.65))',
    };
  }

  if (ink === 'black') {
    return {
      color: '#1A1A1A',
      textShadow: '0 1px 3px rgba(255,255,255,0.7)',
    };
  }

  if (ink === 'ivory') {
    return {
      color: '#F5EFE0',
      textShadow: '0 2px 6px rgba(0,0,0,0.75)',
    };
  }

  if (ink === 'custom') {
    const isLight = ['#D4AF6A', '#FFFFFF', '#F2EBDD', '#F5EFE0'].some((c) =>
      customColor.toLowerCase().includes(c.toLowerCase().slice(1, 4))
    );
    return {
      color: customColor,
      textShadow: isLight
        ? '0 2px 6px rgba(0,0,0,0.7)'
        : '0 1px 3px rgba(255,255,255,0.6)',
    };
  }

  return {
    color: defaultColor,
    textShadow: defaultShadow,
  };
}

export function computeScaledFontSize(
  overlay: PersianDesignItem['overlay'],
  isArabic: boolean,
  textLength: number,
  textSize: CustomizationTextSize
): number {
  let baseSize = isArabic ? overlay.fontSizeAr : overlay.fontSizeEn;

  // Length scaling from legacy implementation
  if (textLength > 10) baseSize *= 0.85;
  if (textLength > 15) baseSize *= 0.75;

  // Multiplier from text size choice
  baseSize *= getSizeMultiplier(textSize);

  return Math.round(baseSize);
}
