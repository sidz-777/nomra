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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div className={`frame-stage view-${viewMode}`} id="frameStage">
        <div className="view-mode-toggle" id="viewModeToggle">
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'wall' ? 'active' : ''}`}
            data-view="wall"
            onClick={() => onChangeViewMode('wall')}
            title="Preview frame hung on wall"
          >
            <span className="view-mode-icon">🖼️</span> Studio Wall
          </button>
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'shelf' ? 'active' : ''}`}
            data-view="shelf"
            onClick={() => onChangeViewMode('shelf')}
            title="Preview frame on wooden tabletop/shelf"
          >
            <span className="view-mode-icon">🛋️</span> Living Room &amp; Shelf
          </button>
        </div>

        {/* Authentic A4 Portrait Aspect Ratio (1 / 1.414) */}
        <div className="product-display" id="customizerDisplay" style={{ aspectRatio: '1 / 1.414' }}>
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

        <div className="frame-tag-badge" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
          <span className="frame-tag-dot" /> A4 Handcrafted Matte Black Frame
        </div>
      </div>

      <div className="craft-specs">
        <div className="craft-specs-title">Handcrafted Specifications</div>
        <div className="craft-specs-grid">
          <div className="craft-spec-item">
            <div className="craft-spec-icon">⬚</div>
            <div>
              <div className="craft-spec-name">Matte Black Frame</div>
              <div className="craft-spec-detail">Solid engineered wood with satin luxury finish</div>
            </div>
          </div>
          <div className="craft-spec-item">
            <div className="craft-spec-icon">✦</div>
            <div>
              <div className="craft-spec-name">Crystal Acrylic</div>
              <div className="craft-spec-detail">Shatterproof, ultra-clear &amp; safe in transit</div>
            </div>
          </div>
          <div className="craft-spec-item">
            <div className="craft-spec-icon">⚙</div>
            <div>
              <div className="craft-spec-name">Dual Display</div>
              <div className="craft-spec-detail">Wall hook + desktop easel stand included</div>
            </div>
          </div>
          <div className="craft-spec-item">
            <div className="craft-spec-icon">✒</div>
            <div>
              <div className="craft-spec-name">300 GSM Archival</div>
              <div className="craft-spec-detail">Heavyweight textured paper &amp; rich fade-proof ink</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
