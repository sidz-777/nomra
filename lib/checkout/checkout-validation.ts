/**
 * NAMORA — Checkout Form & Payload Validation
 * Pure validation rules for customer details, Indian addresses, PIN codes,
 * and cart payload sanitization.
 */

import {
  CustomerInfo,
  DeliveryAddress,
  CheckoutFormData,
  CheckoutValidationResult,
} from './checkout-types';
import { CartItem } from '@/lib/cart/cart-types';

/**
 * Normalizes Indian phone input: strips non-digits, removes +91 country code prefix or leading 0.
 */
export function normalizeIndianMobile(phone: string): string {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Validates Indian 10-digit mobile number starting with 6, 7, 8, or 9.
 */
export function isValidIndianMobile(phone: string): boolean {
  const digits = normalizeIndianMobile(phone);
  return /^[6-9]\d{9}$/.test(digits);
}

/**
 * Validates standard Indian 6-digit postal PIN code.
 */
export function isValidIndianPincode(pincode: string): boolean {
  const digits = pincode.replace(/\D/g, '');
  return /^[1-9]\d{5}$/.test(digits);
}

/**
 * Validates email format if provided.
 */
export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return true; // Optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validates complete checkout form data.
 */
export function validateCheckoutForm(form: Partial<CheckoutFormData>): CheckoutValidationResult {
  const errors: Record<string, string> = {};

  const name = (form.name || '').trim();
  if (!name) {
    errors.name = 'Full name is required.';
  } else if (name.length < 2) {
    errors.name = 'Please enter your full name (at least 2 characters).';
  }

  const phone = (form.phone || '').trim();
  if (!phone) {
    errors.phone = 'Mobile number is required.';
  } else if (!isValidIndianMobile(phone)) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
  }

  if (form.email && !isValidEmail(form.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  const address = (form.addressLine1 || '').trim();
  if (!address) {
    errors.addressLine1 = 'Complete delivery address is required.';
  } else if (address.length < 5) {
    errors.addressLine1 = 'Please enter a complete delivery address with flat/house number.';
  }

  const pincode = (form.pincode || '').trim();
  if (!pincode) {
    errors.pincode = '6-digit PIN code is required.';
  } else if (!isValidIndianPincode(pincode)) {
    errors.pincode = 'Please enter a valid 6-digit Indian PIN code.';
  }

  const city = (form.city || '').trim();
  if (!city) {
    errors.city = 'City is required.';
  }

  const state = (form.state || '').trim();
  if (!state) {
    errors.state = 'State / Union Territory is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates checkout items array.
 */
export function validateCheckoutItems(items: CartItem[]): { isValid: boolean; error?: string } {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { isValid: false, error: 'Your cart is empty. Please select at least one frame.' };
  }

  for (const item of items) {
    if (!item.productId || typeof item.productId !== 'string') {
      return { isValid: false, error: 'Invalid product detected in cart.' };
    }
    if (!item.quantity || item.quantity < 1) {
      return { isValid: false, error: `Invalid quantity for ${item.title || 'item'}.` };
    }
    if (item.productType === 'personalized') {
      if (!item.customization || !item.customization.englishName.trim()) {
        return { isValid: false, error: `Personalized frame "${item.title}" is missing an inscribed name.` };
      }
    }
  }

  return { isValid: true };
}

/**
 * Generates an idempotency key to prevent double submissions.
 */
export function generateIdempotencyKey(): string {
  return 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}
