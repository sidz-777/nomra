'use client';

import React, { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { SectionHeading, Toast, ToastType } from '@/components/ui';
import { PERSIAN_DESIGNS, PersianDesignItem } from '@/lib/storefront-data';
import {
  CustomizationState,
  CustomizationLanguage,
  CustomizationFont,
  CustomizationInk,
  CustomizationTextSize,
  CustomizationViewMode,
  GiftPackagingState,
} from './state/customization-types';
import {
  suggestArabicSpelling,
  getArabicSuggestionNote,
} from './utils/arabic-transliteration';
import { validateCustomization } from './utils/customization-validation';
import { DesignSelector } from './DesignSelector';
import { LanguageSelector } from './LanguageSelector';
import { NameInput } from './NameInput';
import { ArabicNameEditor } from './ArabicNameEditor';
import { FinishSelector } from './FinishSelector';
import { CustomizationOptions } from './CustomizationOptions';
import { FramePreview } from './FramePreview';
import { CustomizerSummary } from './CustomizerSummary';

export interface PersonalizationStudioProps {
  initialDesignId?: string;
  onAddToCartSuccess?: (customization: CustomizationState) => void;
}

export function PersonalizationStudio({
  initialDesignId,
  onAddToCartSuccess,
}: PersonalizationStudioProps) {
  // Find initial design or default to first
  const defaultDesign =
    (initialDesignId && PERSIAN_DESIGNS.find((d) => d.id === initialDesignId)) ||
    PERSIAN_DESIGNS[0];

  // Unified Customization State
  const [state, setState] = useState<CustomizationState>({
    productId: defaultDesign.id,
    designId: defaultDesign.id,
    activeDesign: defaultDesign,
    language: 'en',
    englishName: 'Fatima',
    arabicName: 'فاطمة',
    arabicNameSource: 'suggested',
    arabicSuggestionNote:
      'Matched from dictionary. Feel free to edit or refine the spelling above.',
    font: 'classic',
    ink: 'black',
    customInkColor: '#8C6A3B',
    textSize: 'balanced',
    viewMode: 'wall',
    gift: {
      isGift: false,
      to: '',
      from: '',
      message: '',
      cost: 69,
    },
    pincode: '',
    pincodeStatus: 'idle',
  });

  // Inline Validation Errors
  const [errors, setErrors] = useState<{
    englishName?: string;
    arabicName?: string;
    pincode?: string;
  }>({});

  // Toast Notification
  const [toast, setToast] = useState<{
    isVisible: boolean;
    type: ToastType;
    message: string;
  }>({
    isVisible: false,
    type: 'success',
    message: '',
  });

  // Handler: Select Design
  const handleSelectDesign = (design: PersianDesignItem) => {
    setState((prev) => ({
      ...prev,
      productId: design.id,
      designId: design.id,
      activeDesign: design,
    }));
  };

  // Handler: Change Language
  const handleChangeLanguage = (lang: CustomizationLanguage) => {
    setState((prev) => {
      let arName = prev.arabicName;
      let arNote = prev.arabicSuggestionNote;
      let arSource = prev.arabicNameSource;

      if (lang === 'ar' && (!arName || arSource === 'suggested')) {
        const suggestion = suggestArabicSpelling(prev.englishName);
        arName = suggestion.text;
        arNote = getArabicSuggestionNote(suggestion.isExact);
        arSource = 'suggested';
      }

      return {
        ...prev,
        language: lang,
        arabicName: arName,
        arabicSuggestionNote: arNote,
        arabicNameSource: arSource,
      };
    });
  };

  // Handler: English Name Input
  const handleEnglishNameChange = (val: string) => {
    setErrors((prev) => ({ ...prev, englishName: undefined }));
    setState((prev) => {
      let arName = prev.arabicName;
      let arNote = prev.arabicSuggestionNote;

      // Auto-update suggested Arabic spelling only if not manually edited
      if (prev.arabicNameSource === 'suggested') {
        const suggestion = suggestArabicSpelling(val);
        arName = suggestion.text;
        arNote = getArabicSuggestionNote(suggestion.isExact);
      }

      return {
        ...prev,
        englishName: val,
        arabicName: arName,
        arabicSuggestionNote: arNote,
      };
    });
  };

  // Handler: Quick Try Name
  const handleSelectQuickName = (name: string) => {
    setErrors((prev) => ({ ...prev, englishName: undefined, arabicName: undefined }));
    const suggestion = suggestArabicSpelling(name);
    setState((prev) => ({
      ...prev,
      englishName: name,
      arabicName: suggestion.text,
      arabicSuggestionNote: getArabicSuggestionNote(suggestion.isExact),
      arabicNameSource: 'suggested',
    }));
  };

  // Handler: Manual Arabic Name Edit
  const handleArabicNameChange = (val: string) => {
    setErrors((prev) => ({ ...prev, arabicName: undefined }));
    setState((prev) => ({
      ...prev,
      arabicName: val,
      arabicNameSource: 'manual',
      arabicSuggestionNote: 'Custom manual Arabic inscription entered.',
    }));
  };

  // Handler: Ink & Finishes
  const handleChangeInk = (ink: CustomizationInk) => {
    setState((prev) => ({ ...prev, ink }));
  };

  const handleChangeCustomColor = (customInkColor: string) => {
    setState((prev) => ({ ...prev, customInkColor }));
  };

  const handleChangeFont = (font: CustomizationFont) => {
    setState((prev) => ({ ...prev, font }));
  };

  const handleChangeTextSize = (textSize: CustomizationTextSize) => {
    setState((prev) => ({ ...prev, textSize }));
  };

  const handleChangeViewMode = (viewMode: CustomizationViewMode) => {
    setState((prev) => ({ ...prev, viewMode }));
  };

  const handleChangeGift = (gift: GiftPackagingState) => {
    setState((prev) => ({ ...prev, gift }));
  };

  const handleChangePincode = (pincode: string) => {
    setState((prev) => ({ ...prev, pincode, pincodeStatus: 'idle' }));
  };

  const handleCheckPincode = (pin: string) => {
    if (/^\d{6}$/.test(pin.trim())) {
      setState((prev) => ({ ...prev, pincodeStatus: 'serviceable' }));
    } else {
      setState((prev) => ({ ...prev, pincodeStatus: 'unserviceable' }));
    }
  };

  // Handler: Add to Cart (Phase 6 preparation & validation)
  const handleAddToCart = () => {
    const { isValid, errors: valErrors } = validateCustomization(state);
    if (!isValid) {
      setErrors(valErrors);
      setToast({
        isVisible: true,
        type: 'error',
        message: valErrors.englishName || valErrors.arabicName || 'Please check the required fields.',
      });
      return;
    }

    // Call optional parent handler or show success feedback
    if (onAddToCartSuccess) {
      onAddToCartSuccess(state);
    }

    setToast({
      isVisible: true,
      type: 'success',
      message: `✓ Custom ${state.activeDesign.title} (${state.englishName}) ready for cart!`,
    });
  };

  // Handler: 1-Click WhatsApp Order
  const handleWhatsAppOrder = () => {
    const { isValid, errors: valErrors } = validateCustomization(state);
    if (!isValid) {
      setErrors(valErrors);
      return;
    }

    const nameToPrint =
      state.language === 'ar'
        ? `${state.arabicName} (${state.englishName})`
        : state.englishName;

    const msg = [
      `*NAMORA CUSTOM ORDER INQUIRY*`,
      `Frame Design: ${state.activeDesign.title}`,
      `Language: ${state.language === 'ar' ? 'Arabic' : 'English'}`,
      `Name to Inscribe: ${nameToPrint}`,
      `Typography Style: ${state.font}`,
      `Ink Finish: ${state.ink}`,
      `Frame Size: A4 Standard (21x29.7cm)`,
      `Send as Gift? ${state.gift.isGift ? 'Yes (+₹69)' : 'No'}`,
      state.gift.isGift && state.gift.to ? `Gift To: ${state.gift.to}` : '',
      state.gift.isGift && state.gift.from ? `Gift From: ${state.gift.from}` : '',
      `Total: ₹${499 + (state.gift.isGift ? 69 : 0)} (Pay ₹49 deposit, balance on COD)`,
      state.pincode ? `Delivery Pincode: ${state.pincode}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    window.open(
      `https://wa.me/919305654028?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  return (
    <section id="create" className="py-16 sm:py-24 border-b border-namora-line scroll-mt-20">
      <Container width="wide">
        <SectionHeading
          eyebrow="Bespoke Calligraphy"
          title="Personalize Your Frame"
          arabicTitle="خصّص لوحتك بالخط العربي الفاخر"
          subtitle="Enter the name exactly as you would like it inscribed. Preview live on authentic Persian artwork and customize every detail with museum-grade precision."
        />

        {/* Two-Column Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start max-w-7xl mx-auto">
          {/* Left Column: Interactive Controls Panel */}
          <div className="lg:col-span-7 space-y-6 p-6 sm:p-8 rounded-2xl border border-namora-line bg-namora-card/70 shadow-card">
            {/* 1. Design Selector */}
            <DesignSelector
              selectedDesign={state.activeDesign}
              onSelectDesign={handleSelectDesign}
            />

            {/* 2. Language Selector */}
            <LanguageSelector
              language={state.language}
              onChangeLanguage={handleChangeLanguage}
            />

            {/* 3. English Name Input */}
            <NameInput
              value={state.englishName}
              onChange={handleEnglishNameChange}
              onSelectQuickName={handleSelectQuickName}
              error={errors.englishName}
            />

            {/* 4. Arabic Name Editor (shown when Arabic mode is selected) */}
            {state.language === 'ar' && (
              <ArabicNameEditor
                value={state.arabicName}
                onChange={handleArabicNameChange}
                note={state.arabicSuggestionNote}
                error={errors.arabicName}
              />
            )}

            {/* 5. Ink Finish Selector */}
            <FinishSelector
              ink={state.ink}
              customColor={state.customInkColor}
              onChangeInk={handleChangeInk}
              onChangeCustomColor={handleChangeCustomColor}
            />

            {/* 6. Typography, Text Size & Frame Dimensions */}
            <CustomizationOptions
              font={state.font}
              textSize={state.textSize}
              onChangeFont={handleChangeFont}
              onChangeTextSize={handleChangeTextSize}
            />

            {/* 7. Summary, Packaging Addon, Estimator, and Actions */}
            <CustomizerSummary
              gift={state.gift}
              onChangeGift={handleChangeGift}
              pincode={state.pincode}
              pincodeStatus={state.pincodeStatus}
              onChangePincode={handleChangePincode}
              onCheckPincode={handleCheckPincode}
              onAddToCart={handleAddToCart}
              onWhatsAppOrder={handleWhatsAppOrder}
            />
          </div>

          {/* Right Column: Live Frame Preview Stage (Sticky on desktop) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <FramePreview
              design={state.activeDesign}
              language={state.language}
              englishName={state.englishName}
              arabicName={state.arabicName}
              font={state.font}
              ink={state.ink}
              customInkColor={state.customInkColor}
              textSize={state.textSize}
              viewMode={state.viewMode}
              onChangeViewMode={handleChangeViewMode}
            />
          </div>
        </div>
      </Container>

      {/* Toast Feedback */}
      <Toast
        isVisible={toast.isVisible}
        onDismiss={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        type={toast.type}
        message={toast.message}
      />
    </section>
  );
}
