/**
 * NAMORA — Pure Cart Calculation Engine
 * Guarantees integer INR precision and enforces all commercial invariants:
 * - Subtotal = sum(unitPrice * quantity)
 * - Gift Fee = flat ₹69 if gift enabled (order-level)
 * - Grand Total = Subtotal + Gift Fee
 * - Total Deposit = sum(depositPrice * quantity) [₹49 per frame]
 * - COD Balance = Grand Total - Total Deposit
 */

import { CartItem, CartGiftOptions, CartTotals } from './cart-types';

export const DEFAULT_FRAME_PRICE = 499;
export const DEFAULT_DEPOSIT_PER_FRAME = 49;
export const DEFAULT_COD_PER_FRAME = 450;
export const DEFAULT_GIFT_PACKAGING_PRICE = 69;

/**
 * Calculates cart totals purely and deterministically using integer arithmetic.
 */
export function calculateCartTotals(
  items: CartItem[],
  gift: CartGiftOptions = { enabled: false, price: DEFAULT_GIFT_PACKAGING_PRICE }
): CartTotals {
  let subtotal = 0;
  let totalDeposit = 0;
  let totalItems = 0;
  let totalFrames = 0;

  for (const item of items) {
    const qty = Math.max(1, Math.floor(item.quantity || 1));
    const unitPrice = Math.max(0, Math.floor(item.unitPrice || DEFAULT_FRAME_PRICE));
    const depositPrice = Math.max(0, Math.floor(item.depositPrice !== undefined ? item.depositPrice : DEFAULT_DEPOSIT_PER_FRAME));

    subtotal += unitPrice * qty;
    totalDeposit += depositPrice * qty;
    totalItems += qty;
    totalFrames += qty; // Every item in catalog is an A4 physical wall frame
  }

  const giftFee = gift.enabled ? Math.max(0, Math.floor(gift.price || DEFAULT_GIFT_PACKAGING_PRICE)) : 0;
  const grandTotal = subtotal + giftFee;
  const totalCod = Math.max(0, grandTotal - totalDeposit);

  return {
    totalItems,
    totalFrames,
    subtotal,
    giftFee,
    grandTotal,
    totalDeposit,
    totalCod,
  };
}

/**
 * Formats a number to standard Indian Rupee notation (e.g. ₹1,067)
 */
export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
