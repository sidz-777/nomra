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

export const CHECKLIST_STEPS = [
  { id: 'step1', label: '1. Customer contact & shipping address verified' },
  { id: 'step2', label: '2. Frame design & size (A4) confirmed' },
  { id: 'step3', label: '3. English spelling verified' },
  { id: 'step4', label: '4. Arabic calligraphy spelling verified' },
  { id: 'step5', label: '5. Font style & layout checked' },
  { id: 'step6', label: '6. Finish & moulding quality inspected' },
  { id: 'step7', label: '7. Live preview alignment matched' },
  { id: 'step8', label: '8. Frame assembled with crystal acrylic glass' },
  { id: 'step9', label: '9. Final quality check & scratch inspection' },
  { id: 'step10', label: '10. Gift ribbon / packaging & note card placed' },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  pending_advance: 'Pending Advance',
  confirmed: 'Confirmed',
  advance_paid: 'Advance Paid',
  processing: 'Processing',
  in_production: 'In Production',
  personalization_review: 'Studio Review',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  dispatched: 'Dispatched',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending_payment: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  pending_advance: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  confirmed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  advance_paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  in_production: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  personalization_review: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  ready_to_ship: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  shipped: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  dispatched: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  out_for_delivery: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  delivered: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  returned: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export const COURIERS = [
  'BlueDart Air',
  'Delhivery Express',
  'DTDC Prime',
  'India Post Speed Post',
  'Shadowfax',
  'Ekart Logistics',
  'Self Handover',
] as const;
