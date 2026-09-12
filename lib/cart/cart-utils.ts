/**
 * NAMORA — Cart Utilities
 * ID generation, dispatch estimations, and 1-click WhatsApp order message formatting.
 */

import { CartItem, CartGiftOptions, CartTotals } from './cart-types';
import { formatINR } from './cart-calculations';

/**
 * Generates a stable unique ID for a cart line.
 */
export function generateCartItemId(prefix: 'frame' | 'ready' = 'frame'): string {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${timestamp}_${rand}`;
}

/**
 * Calculates dynamic dispatch and delivery date strings.
 */
export function getEstimatedDispatchDates(): { dispatchDate: string; deliveryDate: string } {
  const now = new Date();
  const dispatch = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const delivery = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  const optShort: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const optDay: Intl.DateTimeFormatOptions = { day: 'numeric' };
  const optMonth: Intl.DateTimeFormatOptions = { month: 'short' };

  return {
    dispatchDate: dispatch.toLocaleDateString('en-IN', optShort),
    deliveryDate: `${delivery.toLocaleDateString('en-IN', optDay)}–${new Date(delivery.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', optDay)} ${delivery.toLocaleDateString('en-IN', optMonth)}`,
  };
}

/**
 * Constructs a rich WhatsApp direct order URL encoding all cart details.
 */
export function buildCartWhatsAppUrl(
  items: CartItem[],
  gift: CartGiftOptions,
  totals: CartTotals,
  phone: string = '919305654028'
): string {
  const lines: string[] = [];

  lines.push('Assalamu Alaikum NAMORA! I would like to order the following frames:');
  lines.push('');

  items.forEach((item, idx) => {
    lines.push(`*Frame ${idx + 1}: ${item.title}*`);
    if (item.productType === 'personalized' && item.customization) {
      lines.push(`• English Name: ${item.customization.englishName}`);
      if (item.customization.arabicName && item.customization.arabicName !== item.customization.englishName) {
        lines.push(`• Arabic Script: ${item.customization.arabicName}`);
      }
      lines.push(`• Finish: ${item.customization.finishLabel}`);
      lines.push(`• Font Style: ${item.customization.fontLabel}`);
      lines.push(`• Text Scale: ${item.customization.textSizeLabel}`);
    } else if (item.categoryLabel) {
      lines.push(`• Edition: Ready-to-Ship (${item.categoryLabel})`);
      if (item.quantity > 1) {
        lines.push(`• Quantity: ${item.quantity}`);
      }
    }
    lines.push(`• Size: Standard A4 Glass Frame`);
    lines.push(`• Price: ${formatINR(item.unitPrice * item.quantity)}`);
    lines.push('');
  });

  if (gift.enabled) {
    lines.push('*🎁 Luxury Gift Packaging Included (+₹69):*');
    if (gift.to) lines.push(`• To: ${gift.to}`);
    if (gift.from) lines.push(`• From: ${gift.from}`);
    if (gift.greetingNote) lines.push(`• Card Note: "${gift.greetingNote}"`);
    lines.push('');
  }

  lines.push('--------------------------------');
  lines.push(`*Total Items:* ${totals.totalFrames} Frame${totals.totalFrames > 1 ? 's' : ''}`);
  lines.push(`*Grand Total:* ${formatINR(totals.grandTotal)}`);
  lines.push(`*Booking Deposit (Today):* ${formatINR(totals.totalDeposit)}`);
  lines.push(`*Balance due on COD:* ${formatINR(totals.totalCod)}`);
  lines.push('--------------------------------');
  lines.push('Please guide me on completing the ₹49/frame deposit reservation.');

  const encoded = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${phone}?text=${encoded}`;
}
