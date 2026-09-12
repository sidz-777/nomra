/**
 * NAMORA — Razorpay & Payment Domain Types
 * Server-authoritative types for deposit payment orders, verification, and webhooks.
 */

export interface CreateRazorpayOrderRequest {
  orderId: string;
  orderNumber?: string;
}

export interface CreateRazorpayOrderResponse {
  success: boolean;
  error?: string;
  keyId?: string;
  razorpayOrderId?: string;
  amount?: number; // In paise (e.g. 4900 for ₹49, 9800 for ₹98)
  currency?: string;
  orderId?: string;
  orderNumber?: string;
  depositAmount?: number; // In INR for display
  codAmount?: number; // In INR for display
  totalAmount?: number; // In INR for display
  customer?: {
    name?: string;
    contact?: string;
    email?: string;
  };
}

export interface VerifyPaymentRequest {
  orderId: string;
  orderNumber?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  method?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  error?: string;
  is_duplicate?: boolean;
  order_number?: string;
  status?: string;
  deposit_paid?: number;
  cod_balance?: number;
  payment_id?: string;
}

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number; // in paise
        currency: string;
        status: string;
        method?: string;
        contact?: string;
        email?: string;
        notes?: Record<string, string>;
        created_at?: number;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        amount_paid: number;
        status: string;
        receipt?: string;
        notes?: Record<string, string>;
      };
    };
  };
  created_at: number;
}
