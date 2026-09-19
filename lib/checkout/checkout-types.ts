/**
 * NAMORA — Checkout & Order Flow Domain Types
 * Strict contracts for customer info, delivery address, order payloads,
 * server-authoritative responses, and Phase 9 payment handoffs.
 */

import { CartItem, CartGiftOptions } from '@/lib/cart/cart-types';

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface DeliveryAddress {
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CreateOrderPayload {
  customer: CustomerInfo;
  address: DeliveryAddress;
  items: CartItem[];
  gift?: CartGiftOptions;
  idempotencyKey: string;
}

export interface PaymentHandoffContract {
  provider: 'razorpay';
  currency: 'INR';
  depositAmount: number;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  depositAmount?: number;
  codAmount?: number;
  frameCount?: number;
  status?: string;
  paymentHandoff?: PaymentHandoffContract;
  trackingToken?: string;
  trackingUrl?: string;
  error?: string;
}

export interface CheckoutValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
