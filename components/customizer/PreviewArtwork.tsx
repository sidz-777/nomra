import React from 'react';
import Image from 'next/image';
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

  return (
    <div className="relative w-full h-full overflow-hidden bg-namora-card select-none">
      {/* Background Persian Artwork */}
      <Image
        src={design.assetPath}
        alt={design.title}
        fill
        priority
        className="object-cover pointer-events-none"
        sizes="(max-width: 1024px) 100vw, 500px"
      />

      {/* Positioned Live Calligraphy Overlay */}
      <div
        className="absolute flex items-center justify-center pointer-events-none text-center"
        style={{
          left: `${o.posX}%`,
          top: `${o.posY}%`,
          width: `${o.maxWidth}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="w-full text-center tracking-wide break-words transition-all duration-150"
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight,
            lineHeight: 1.3,
            ...inkStyle,
          }}
        >
          {nameText}
        </div>
      </div>

      {/* Real Museum-Grade Acrylic Glass Glare Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-transparent pointer-events-none" />
    </div>
  );
}
