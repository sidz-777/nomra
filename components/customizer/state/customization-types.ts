import { PersianDesignItem } from '@/lib/storefront-data';

export type CustomizationLanguage = 'en' | 'ar';
export type CustomizationFont = 'classic' | 'royal' | 'calligraphy';
export type CustomizationInk = 'black' | 'gold' | 'ivory' | 'rosegold' | 'custom';
export type CustomizationTextSize = 'subtle' | 'balanced' | 'statement';
export type CustomizationViewMode = 'wall' | 'shelf';

export interface GiftPackagingState {
  isGift: boolean;
  to: string;
  from: string;
  message: string;
  cost: number;
}

export interface CustomizationState {
  productId: string;
  designId: string;
  activeDesign: PersianDesignItem;
  language: CustomizationLanguage;
  englishName: string;
  arabicName: string;
  arabicNameSource: 'suggested' | 'manual';
  arabicSuggestionNote: string;
  font: CustomizationFont;
  ink: CustomizationInk;
  customInkColor: string;
  textSize: CustomizationTextSize;
  viewMode: CustomizationViewMode;
  gift: GiftPackagingState;
  pincode: string;
  pincodeStatus: 'idle' | 'checking' | 'serviceable' | 'unserviceable';
}

export interface TransliterationResult {
  text: string;
  isExact: boolean;
}
