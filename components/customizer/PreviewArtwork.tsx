'use client';

import React from 'react';
import {
  CustomizationLanguage,
  CustomizationFont,
  CustomizationInk,
  CustomizationTextSize,
} from './state/customization-types';
import { PersianDesignItem } from '@/lib/storefront-data';
import {
  getFontFamily,
  getFontWeight,
  getInkStyle,
  computeScaledFontSize,
} from './utils/preview-utils';

interface PreviewArtworkProps {
  design: PersianDesignItem;
  language: CustomizationLanguage;
  englishName: string;
  arabicName: string;
  font: CustomizationFont;
  ink: CustomizationInk;
  customInkColor: string;
  textSize: CustomizationTextSize;
}

export function PreviewArtwork({
  design,
  language,
  englishName,
  arabicName,
  font,
  ink,
  customInkColor,
  textSize,
}: PreviewArtworkProps) {
  const isArabic = language === 'ar';
  const nameText = isArabic
    ? arabicName.trim() || 'اسمك'
    : englishName.trim() || 'YOUR NAME';

  const o = design.overlay;
  const fontFamily = getFontFamily(font, isArabic);
  const fontWeight = getFontWeight(textSize);
  const fontSize = computeScaledFontSize(
    o,
    isArabic,
    nameText.length,
    textSize
  );

  const inkStyle = getInkStyle(
    ink,
    customInkColor,
    o.textColor,
    o.textShadow
  );

  const imageSrc = design.image ? `/${design.image}` : design.assetPath;

  return (
    <>
      <img
        className="product-img"
        src={imageSrc}
        alt={design.title}
        loading="eager"
      />
      <div
        className="overlay-layer"
        style={{
          left: `${o.posX}%`,
          top: `${o.posY}%`,
          width: `${o.maxWidth}%`,
        }}
      >
        <div
          className="overlay-text"
          dir={isArabic ? 'rtl' : 'ltr'}
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight,
            ...inkStyle,
          }}
        >
          {nameText}
        </div>
      </div>
    </>
  );
}
