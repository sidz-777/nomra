/**
 * NAMORA — Core Foundational Domain Types (Phase 2 Baseline)
 */

export type CalligraphyLanguage = 'en' | 'ar';
export type CalligraphyFont = 'classic' | 'royal' | 'calligraphy';
export type InkStyle = 'black' | 'gold' | 'ivory' | 'rosegold' | 'custom';
export type TextSize = 'subtle' | 'balanced' | 'statement';

export interface OverlayConfig {
  posX: number;
  posY: number;
  maxWidth: number;
  rotate?: number;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  categoryLabel?: string;
  price: number;
  deposit_price?: number;
  cod_price?: number;
  image_url: string;
  in_stock: boolean;
  stock_quantity?: number;
  tags?: string[];
  is_featured?: boolean;
  overlay?: OverlayConfig;
}

export interface GiftOption {
  isGift: boolean;
  to?: string;
  from?: string;
  message?: string;
  cost: number;
}

export interface CartItem {
  id: string;
  isReadyMade: boolean;
  productId: string;
  productTitle: string;
  productImage: string;
  categoryLabel?: string;
  size: 'A4 Size Only';
  price: number;
  deposit: number;
  cod: number;
  language?: 'English' | 'Arabic';
  englishName?: string;
  arabicName?: string;
  ink?: InkStyle;
  inkLabel?: string;
  inkColor?: string;
  font?: CalligraphyFont;
  fontLabel?: string;
  textSize?: TextSize;
  textSizeLabel?: string;
  gift?: GiftOption;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  pincode: string;
  city?: string;
  state?: string;
  email?: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'pending_advance'
  | 'confirmed'
  | 'advance_paid'
  | 'processing'
  | 'in_production'
  | 'personalization_review'
  | 'ready_to_ship'
  | 'shipped'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid_in_full' | 'refunded';

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  custom_text?: string;
  arabic_text?: string;
  font_id?: string;
  ink_color?: string;
  size_multiplier?: number;
  has_gift?: boolean;
  gift_message?: string;
  gift_wrap?: boolean;
  image_url?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  pincode: string;
  city?: string;
  state?: string;
  total_amount: number;
  deposit_amount: number;
  cod_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  tracking_number?: string;
  courier_name?: string;
  tracking_url?: string;
  checklist?: Record<string, boolean>;
  notes?: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}
