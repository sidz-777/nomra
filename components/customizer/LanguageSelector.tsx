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
    <div>
      <span className="label">2. Language</span>
      <div className="option-row">
        <button
          type="button"
          className={`chip ${language === 'en' ? 'active' : ''}`}
          id="btnLangEn"
          onClick={() => onChangeLanguage('en')}
        >
          English
        </button>
        <button
          type="button"
          className={`chip ${language === 'ar' ? 'active' : ''}`}
          id="btnLangAr"
          onClick={() => onChangeLanguage('ar')}
        >
          Arabic
        </button>
      </div>
    </div>
  );
}
