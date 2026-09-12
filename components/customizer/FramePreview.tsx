'use client';

import React from 'react';
import {
  CustomizationLanguage,
  CustomizationFont,
  CustomizationInk,
  CustomizationTextSize,
  CustomizationViewMode,
} from './state/customization-types';
import { PersianDesignItem } from '@/lib/storefront-data';
import { PreviewArtwork } from './PreviewArtwork';

interface FramePreviewProps {
  design: PersianDesignItem;
  language: CustomizationLanguage;
  englishName: string;
  arabicName: string;
  font: CustomizationFont;
  ink: CustomizationInk;
  customInkColor: string;
  textSize: CustomizationTextSize;
  viewMode: CustomizationViewMode;
  onChangeViewMode: (mode: CustomizationViewMode) => void;
}

export function FramePreview({
  design,
  language,
  englishName,
  arabicName,
  font,
  ink,
  customInkColor,
  textSize,
  viewMode,
  onChangeViewMode,
}: FramePreviewProps) {
  return (
    <div className="flex flex-col items-center w-full space-y-6">
      {/* View Mode Toggle */}
      <div className="inline-flex p-1 rounded-lg border border-namora-line bg-namora-card text-xs font-medium shadow-subtle">
        <button
          type="button"
          onClick={() => onChangeViewMode('wall')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
            viewMode === 'wall'
              ? 'bg-namora-gold text-black font-semibold shadow-sm'
              : 'text-namora-muted hover:text-namora-ink'
          }`}
        >
          <span>🖼️</span>
          <span>Studio Wall</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('shelf')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
            viewMode === 'shelf'
              ? 'bg-namora-gold text-black font-semibold shadow-sm'
              : 'text-namora-muted hover:text-namora-ink'
          }`}
        >
          <span>🛋️</span>
          <span>Living Room &amp; Shelf</span>
        </button>
      </div>

      {/* Ambient Preview Stage */}
      <div
        className={`w-full max-w-md p-4 sm:p-6 rounded-2xl border border-namora-line transition-all duration-500 flex flex-col items-center ${
          viewMode === 'wall'
            ? 'bg-gradient-to-b from-[#1C1814] via-[#15120F] to-[#141210]'
            : 'bg-gradient-to-b from-[#251F18] via-[#1E1914] to-[#181410]'
        }`}
      >
        {/* Physical A4 Frame Moulding (Aspect ratio 1 : 1.414 / ~0.707) */}
        <div className="relative w-full aspect-[1/1.414] rounded-lg bg-[#0F0D0B] p-3 sm:p-4 shadow-luxury border border-[#2D241C] ring-1 ring-black/80">
          {/* Inner Bevel & Mat border */}
          <div className="relative w-full h-full rounded-sm overflow-hidden border border-black shadow-inner">
            <PreviewArtwork
              design={design}
              language={language}
              englishName={englishName}
              arabicName={arabicName}
              font={font}
              ink={ink}
              customInkColor={customInkColor}
              textSize={textSize}
            />
          </div>

          {/* Wall Hook Mount detail in wall view */}
          {viewMode === 'wall' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-3 rounded-t border-t border-x border-white/15 bg-black/80" />
          )}
        </div>

        {/* Frame Format Tag Badge */}
        <div className="mt-4 flex items-center gap-2 text-xs font-mono text-namora-muted bg-namora-card px-3 py-1 rounded-full border border-namora-line-soft shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-namora-gold" />
          <span>A4 Handcrafted Matte Black Frame</span>
        </div>
      </div>

      {/* Handcrafted Specifications Grid */}
      <div className="w-full max-w-md p-5 rounded-xl border border-namora-line bg-namora-card space-y-3">
        <h4 className="font-mono text-xs uppercase tracking-widest text-namora-gold font-semibold">
          Handcrafted Specifications
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="text-base text-namora-gold">⬚</span>
            <div>
              <strong className="text-namora-ink block font-medium">Matte Black Frame</strong>
              <span className="text-[11px] text-namora-muted font-light leading-tight block">
                Solid engineered wood, satin finish
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="text-base text-namora-gold">✦</span>
            <div>
              <strong className="text-namora-ink block font-medium">Crystal Acrylic</strong>
              <span className="text-[11px] text-namora-muted font-light leading-tight block">
                Shatterproof &amp; transit safe
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="text-base text-namora-gold">⚙</span>
            <div>
              <strong className="text-namora-ink block font-medium">Dual Display</strong>
              <span className="text-[11px] text-namora-muted font-light leading-tight block">
                Wall hook + tabletop easel included
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="text-base text-namora-gold">✒</span>
            <div>
              <strong className="text-namora-ink block font-medium">300 GSM Archival</strong>
              <span className="text-[11px] text-namora-muted font-light leading-tight block">
                Rich fade-proof permanent pigments
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
