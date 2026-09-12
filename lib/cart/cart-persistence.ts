/**
 * NAMORA — SSR-Safe Client-Side Cart Persistence
 * Safely persists and restores cart state to localStorage with schema versioning,
 * hydration mismatch prevention, and corrupted payload resilience.
 */

import { CartState, CartGiftOptions } from './cart-types';
import { DEFAULT_GIFT_PACKAGING_PRICE } from './cart-calculations';

export const CART_STORAGE_KEY = 'namora_cart_v1';
export const CURRENT_CART_VERSION = 1;

export const DEFAULT_GIFT_STATE: CartGiftOptions = {
  enabled: false,
  to: '',
  from: '',
  greetingNote: '',
  price: DEFAULT_GIFT_PACKAGING_PRICE,
};

export const DEFAULT_CART_STATE: CartState = {
  version: CURRENT_CART_VERSION,
  items: [],
  gift: DEFAULT_GIFT_STATE,
  isOpen: false,
};

/**
 * Loads cart state from localStorage.
 * Always returns a valid CartState, even if storage is empty, inaccessible, or corrupted.
 */
export function loadCartFromStorage(): CartState {
  if (typeof window === 'undefined') {
    return DEFAULT_CART_STATE;
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return DEFAULT_CART_STATE;

    const parsed = JSON.parse(raw);

    // Validate schema version and required fields
    if (!parsed || parsed.version !== CURRENT_CART_VERSION || !Array.isArray(parsed.items)) {
      console.warn('Incompatible or corrupted cart schema detected. Resetting to default state.');
      return DEFAULT_CART_STATE;
    }

    return {
      version: CURRENT_CART_VERSION,
      items: parsed.items.map((item: any) => ({
        id: String(item.id || ''),
        productId: String(item.productId || ''),
        productType: item.productType === 'ready_stock' ? 'ready_stock' : 'personalized',
        title: String(item.title || ''),
        subtitle: item.subtitle ? String(item.subtitle) : undefined,
        image: String(item.image || ''),
        categoryLabel: item.categoryLabel ? String(item.categoryLabel) : undefined,
        unitPrice: Number(item.unitPrice) || 499,
        depositPrice: item.depositPrice !== undefined ? Number(item.depositPrice) : 49,
        codPrice: item.codPrice !== undefined ? Number(item.codPrice) : 450,
        quantity: Math.max(1, parseInt(item.quantity) || 1),
        customization: item.customization ? { ...item.customization } : undefined,
        createdAt: Number(item.createdAt) || Date.now(),
      })),
      gift: {
        enabled: Boolean(parsed.gift?.enabled),
        to: String(parsed.gift?.to || ''),
        from: String(parsed.gift?.from || ''),
        greetingNote: String(parsed.gift?.greetingNote || ''),
        price: Number(parsed.gift?.price) || DEFAULT_GIFT_PACKAGING_PRICE,
      },
      isOpen: false, // Always initialize drawer closed
    };
  } catch (err) {
    console.warn('Could not read cart from localStorage:', err);
    return DEFAULT_CART_STATE;
  }
}

/**
 * Persists cart state to localStorage.
 * Excludes transient UI state (e.g. isOpen).
 */
export function saveCartToStorage(state: CartState): void {
  if (typeof window === 'undefined') return;

  try {
    const payload = {
      version: CURRENT_CART_VERSION,
      items: state.items,
      gift: state.gift,
    };
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Could not save cart to localStorage:', err);
  }
}

/**
 * Clears cart state in localStorage.
 */
export function clearCartStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch (err) {
    console.warn('Could not clear cart storage:', err);
  }
}
