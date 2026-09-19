/**
 * NAMORA Customer Order Tracking Types
 * Exact domain contracts for customer-facing order tracking, privacy boundaries, & status milestones.
 */

export interface TrackingItemSafe {
  product_title: string;
  product_image?: string;
  english_name?: string;
  arabic_name?: string;
  ink_style?: string;
  font_style?: string;
  has_gift?: boolean;
  gift_to?: string;
  gift_from?: string;
  gift_message?: string;
  price: number;
  quantity?: number;
}

export interface TrackingOrderSafe {
  order_number: string;
  customer_name: string;
  status: string;
  payment_status: string;
  courier_name?: string;
  carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  estimated_delivery_date?: string;
  total_amount: number;
  deposit_amount: number;
  cod_amount: number;
  created_at?: string;
  dispatched_at?: string;
  delivered_at?: string;
  destination_summary?: {
    city: string;
    state: string;
    pincode: string;
    masked_name: string;
  };
}

export interface TrackingResponse {
  found: boolean;
  order?: TrackingOrderSafe;
  items?: TrackingItemSafe[];
  message?: string;
  error?: string;
}

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  step: number;
}

export interface TrackingMilestone {
  title: string;
  desc: string;
  stepNumber: number;
  state: 'completed' | 'active' | 'upcoming';
  timestamp?: string;
}
