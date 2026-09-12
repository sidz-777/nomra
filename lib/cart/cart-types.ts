/**
 * NAMORA — Cart & State Management Domain Types
 * Strict, serializable contracts for multi-item cart, personalization snapshots,
 * gift packaging, and financial breakdowns.
 */

export type CartItemType = 'personalized' | 'ready_stock';

export interface CartPersonalizationSnapshot {
  designId: string;
  designTitle: string;
  language: 'en' | 'ar';
  englishName: string;
  arabicName: string;
  arabicNameSource: 'suggested' | 'manual';
  finish: string; // obsidian | gold | ivory | rosegold | custom
  finishLabel: string;
  finishColor: string;
  font: string; // classic | royal | calligraphy
  fontLabel: string;
  textSize: string; // subtle | balanced | statement
  textSizeLabel: string;
  size: 'A4';
  overlayPosition?: {
    posX: number;
    posY: number;
    maxWidth: number;
  };
}

export interface CartItem {
  id: string; // Stable unique cart-line ID (e.g. frame_<timestamp>_<rand> or ready_<timestamp>_<rand>)
  productId: string; // Authoritative catalog product ID
  productType: CartItemType;
  title: string;
  subtitle?: string;
  image: string; // Canonical asset path
  categoryLabel?: string;
  unitPrice: number; // Current authoritative unit price in integer INR
  depositPrice: number; // Deposit amount per unit (default ₹49)
  codPrice: number; // COD balance per unit (unitPrice - depositPrice)
  quantity: number; // Integer >= 1
  customization?: CartPersonalizationSnapshot;
  createdAt: number;
}

export interface CartGiftOptions {
  enabled: boolean;
  to?: string;
  from?: string;
  greetingNote?: string;
  price: number; // Fixed at ₹69
}

export interface CartState {
  version: number; // Schema version (v1)
  items: CartItem[];
  gift: CartGiftOptions;
  isOpen: boolean;
}

export interface CartTotals {
  totalItems: number; // Sum of item quantities
  totalFrames: number; // Frame count for deposit calculation
  subtotal: number; // Sum of unitPrice * quantity
  giftFee: number; // ₹69 if gift.enabled, else 0
  grandTotal: number; // subtotal + giftFee
  totalDeposit: number; // Sum of depositPrice * quantity (₹49 * totalFrames)
  totalCod: number; // grandTotal - totalDeposit
}
