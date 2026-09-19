/**
 * NAMORA Notification Subsystem Types
 * Strict typed definitions for multi-channel notifications, durable logging, and provider abstraction.
 */

export type NotificationType =
  | 'order_confirmed'
  | 'payment_confirmed'
  | 'order_processing'
  | 'personalization_review'
  | 'ready_to_ship'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type NotificationChannel = 'email' | 'whatsapp' | 'sms';

export type NotificationStatus = 'pending' | 'sending' | 'sent' | 'failed';

export type NotificationProvider = 'mock' | 'resend' | 'meta_whatsapp' | 'twilio';

export interface NotificationLog {
  id: string;
  order_id: string;
  customer_id?: string | null;
  order_number: string;
  notification_type: NotificationType;
  channel: NotificationChannel;
  masked_recipient: string;
  status: NotificationStatus;
  provider: NotificationProvider;
  provider_message_id?: string;
  error_message?: string;
  idempotency_key: string;
  payload_summary: Record<string, any>;
  attempt_count: number;
  locked_at?: string | null;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationSetting {
  id: string;
  channel: NotificationChannel;
  is_enabled: boolean;
  provider: NotificationProvider;
  test_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  type: NotificationType;
  channel: NotificationChannel;
  trackingUrl?: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  depositAmount?: number;
  codAmount?: number;
  totalAmount?: number;
  itemsSummary?: string;
}

export interface ProviderDispatchResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface NotificationProviderAdapter {
  name: NotificationProvider;
  channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<ProviderDispatchResult>;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  order_confirmed: 'Order Confirmed',
  payment_confirmed: 'Payment Verified',
  order_processing: 'Artisan Preparation',
  personalization_review: 'Personalization Review',
  ready_to_ship: 'Packed & Quality Sealed',
  shipped: 'Dispatched with Courier',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Safely Delivered',
  cancelled: 'Order Cancelled',
  returned: 'Order Returned',
};

export const NOTIFICATION_STATUS_COLORS: Record<NotificationStatus, { bg: string; text: string; border: string }> = {
  pending: { bg: 'rgba(251, 191, 36, 0.1)', text: '#FBBF24', border: 'rgba(251, 191, 36, 0.3)' },
  sending: { bg: 'rgba(56, 189, 248, 0.1)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.3)' },
  sent: { bg: 'rgba(74, 222, 128, 0.1)', text: '#4ADE80', border: 'rgba(74, 222, 128, 0.3)' },
  failed: { bg: 'rgba(248, 113, 113, 0.1)', text: '#F87171', border: 'rgba(248, 113, 113, 0.3)' },
};
