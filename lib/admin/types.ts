/**
 * NAMORA — Admin Domain Types & State Invariants (Phase 10)
 * Exact representation of legacy admin models, transitions, and metrics.
 */

export type AdminRole = 'owner' | 'admin' | 'staff';

export interface AdminProfile {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export interface ProductionChecklist {
  step1?: boolean;
  step2?: boolean;
  step3?: boolean;
  step4?: boolean;
  step5?: boolean;
  step6?: boolean;
  step7?: boolean;
  step8?: boolean;
  step9?: boolean;
  step10?: boolean;
  [key: string]: boolean | undefined;
}

export interface OrderItemAdminSnapshot {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_title?: string;
  product_image?: string;
  is_ready_made?: boolean;
  category_label?: string;
  english_name?: string;
  arabic_name?: string;
  ink_style?: string;
  font_style?: string;
  text_size?: string;
  has_gift?: boolean;
  gift_to?: string;
  gift_from?: string;
  gift_message?: string;
  gift_price?: number;
  price?: number;
  deposit?: number;
  cod?: number;
  created_at?: string;
}

export interface AdminOrderRecord {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  pincode: string;
  total_amount: number;
  deposit_amount: number;
  cod_amount: number;
  status: string;
  payment_method?: string;
  payment_status?: string;
  courier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  admin_notes?: string;
  production_checklist?: ProductionChecklist;
  items?: OrderItemAdminSnapshot[];
  created_at: string;
  updated_at?: string;
  dispatched_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
}

/**
 * Strict Order Lifecycle Transition State Machine
 * Exact mirror of server.js VALID_ORDER_TRANSITIONS
 */
export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  // Canonical Lifecycle:
  pending_advance: ['advance_paid', 'confirmed', 'cancelled'],
  advance_paid: ['in_production', 'processing', 'cancelled'],
  in_production: ['ready_to_ship', 'dispatched', 'cancelled'],
  ready_to_ship: ['dispatched', 'shipped', 'cancelled'],
  dispatched: ['out_for_delivery', 'delivered', 'returned', 'cancelled'],
  out_for_delivery: ['delivered', 'returned', 'cancelled'],
  delivered: ['returned'],
  cancelled: ['in_production', 'processing'],
  returned: [],

  // Historical aliases and documented transitions for complete lifecycle compatibility:
  pending_payment: ['advance_paid', 'confirmed', 'cancelled'],
  confirmed: ['in_production', 'processing', 'personalization_review', 'cancelled'],
  processing: ['personalization_review', 'in_production', 'ready_to_ship', 'dispatched', 'cancelled'],
  personalization_review: ['in_production', 'processing', 'ready_to_ship', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'returned', 'cancelled'],
};

export const VALID_ORDER_STATUSES = [
  'pending_payment',
  'pending_advance',
  'confirmed',
  'advance_paid',
  'processing',
  'in_production',
  'personalization_review',
  'ready_to_ship',
  'shipped',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
] as const;

export function isValidOrderTransition(from: string, to: string, isAdminOverride = false): boolean {
  if (!VALID_ORDER_STATUSES.includes(to as any)) {
    return false;
  }
  if (isAdminOverride) return true;
  if (!from || from === to) return true;
  const allowed = VALID_ORDER_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export interface AnalyticsSummary {
  timeframe: string;
  total_orders: number;
  active_orders: number;
  total_revenue: number;
  deposits_collected: number;
  cod_outstanding: number;
  average_order_value: number;
  status_counts: Record<string, number>;
}

export interface CustomerProfileAdmin {
  id?: string;
  phone: string;
  name: string;
  email?: string;
  last_address?: string;
  last_pincode?: string;
  order_count: number;
  total_spent: number;
  created_at?: string;
  updated_at?: string;
}

export interface ReviewAdminItem {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  order_number?: string;
  product_title?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface StoreSettingsPayload {
  framePrice: number | string;
  deposit: number | string;
  cod: number | string;
  gift: number | string;
  waPhone: string;
  upiId: string;
}
