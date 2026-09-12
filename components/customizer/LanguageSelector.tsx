'use client';

import React from 'react';
import { CustomizationLanguage } from './state/customization-types';

interface LanguageSelectorProps {
  language: CustomizationLanguage;
  onChangeLanguage: (lang: CustomizationLanguage) => void;
}

export function LanguageSelector({
  language,
  onChangeLanguage,
}: LanguageSelectorProps) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs uppercase tracking-wider font-semibold text-namora-ink">
        2. Language
      </span>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChangeLanguage('en')}
          className={`py-2 px-4 rounded-md border text-xs sm:text-sm font-medium transition select-none flex items-center justify-center gap-2 ${
            language === 'en'
              ? 'bg-namora-gold text-black border-namora-gold font-semibold shadow-subtle'
              : 'bg-namora-card text-namora-ink border-namora-line hover:border-namora-gold/60'
          }`}
        >
          English
        </button>

        <button
          type="button"
          onClick={() => onChangeLanguage('ar')}
          className={`py-2 px-4 rounded-md border text-xs sm:text-sm font-medium transition select-none flex items-center justify-center gap-2 font-arabic ${
            language === 'ar'
              ? 'bg-namora-gold text-black border-namora-gold font-semibold shadow-subtle'
              : 'bg-namora-card text-namora-ink border-namora-line hover:border-namora-gold/60'
          }`}
        >
          العربية (Arabic)
        </button>
      </div>
    </div>
  );
}
