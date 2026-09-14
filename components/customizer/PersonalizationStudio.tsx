'use client';

import React, { useState, useEffect } from 'react';
import { Toast, ToastType } from '@/components/ui';
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
import { useCart } from '@/components/cart';

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

  const cart = useCart();

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

  // Listen for design selection events from gallery
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const designId = customEvent.detail;
      const found = PERSIAN_DESIGNS.find((d) => d.id === designId);
      if (found) {
        setState((prev) => ({
          ...prev,
          productId: found.id,
          designId: found.id,
          activeDesign: found,
        }));
      }
    };
    window.addEventListener('namora-select-design', handler);
    return () => window.removeEventListener('namora-select-design', handler);
  }, []);

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

  // Handler: Add to Cart
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

    // Add personalized item to cart
    cart.addPersonalizedItem({
      design: state.activeDesign,
      customization: state,
      gift: state.gift,
    });

    if (onAddToCartSuccess) {
      onAddToCartSuccess(state);
    }

    setToast({
      isVisible: true,
      type: 'success',
      message: `✓ Added "${state.englishName}" (${state.activeDesign.title}) to cart!`,
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
    <section id="create" className="section">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Customize</div>
          <h2>Personalize Your Frame</h2>
          <p>Enter the name exactly as you&apos;d like it written. Switch between English and Arabic anytime.</p>
        </div>

        <div className="builder-grid reveal">
          <div className="panel">
            <DesignSelector
              selectedDesign={state.activeDesign}
              onSelectDesign={handleSelectDesign}
            />

            <LanguageSelector
              language={state.language}
              onChangeLanguage={handleChangeLanguage}
            />

            <NameInput
              value={state.englishName}
              onChange={handleEnglishNameChange}
              onSelectQuickName={handleSelectQuickName}
              error={errors.englishName}
            />

            {state.language === 'ar' && (
              <ArabicNameEditor
                value={state.arabicName}
                onChange={handleArabicNameChange}
                note={state.arabicSuggestionNote}
                error={errors.arabicName}
              />
            )}

            <FinishSelector
              ink={state.ink}
              customColor={state.customInkColor}
              onChangeInk={handleChangeInk}
              onChangeCustomColor={handleChangeCustomColor}
            />

            <CustomizationOptions
              font={state.font}
              textSize={state.textSize}
              onChangeFont={handleChangeFont}
              onChangeTextSize={handleChangeTextSize}
            />

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
