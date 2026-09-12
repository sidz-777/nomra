import { CustomizationState } from '../state/customization-types';

export interface ValidationErrors {
  englishName?: string;
  arabicName?: string;
  pincode?: string;
}

export function validateCustomization(state: CustomizationState): {
  isValid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  if (!state.englishName.trim()) {
    errors.englishName = 'Please enter a name for the calligraphy frame.';
  }

  if (state.language === 'ar' && !state.arabicName.trim()) {
    errors.arabicName = 'Please verify or enter the Arabic calligraphy name.';
  }

  if (state.pincode && !/^\d{6}$/.test(state.pincode.trim())) {
    errors.pincode = 'Please enter a valid 6-digit Indian PIN code.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
