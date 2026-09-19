/**
 * NAMORA Customer Order Tracking Service
 * Client-side tracking caller supporting direct token authorization or dual-verification manual lookups.
 */

import { TrackingResponse } from './types';

export interface TrackOrderParams {
  token?: string;
  orderNumber?: string;
  verification?: string; // Last 4 digits of phone OR delivery PIN
  query?: string; // Legacy fallback
}

export async function trackCustomerOrder(
  paramsOrQuery: string | TrackOrderParams
): Promise<TrackingResponse> {
  let bodyPayload: Record<string, any> = {};

  if (typeof paramsOrQuery === 'string') {
    const clean = paramsOrQuery.trim();
    if (!clean) {
      return { found: false, message: 'Tracking credentials required.' };
    }
    // If it looks like a 32-char hex token:
    if (/^[0-9a-fA-F]{32}$/.test(clean)) {
      bodyPayload = { token: clean };
    } else {
      bodyPayload = { query: clean };
    }
  } else {
    bodyPayload = { ...paramsOrQuery };
  }

  try {
    const res = await fetch('/api/track-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        found: false,
        message: errorData.message || errorData.error || 'Verification failed. Please verify your order details.',
      };
    }

    const data: TrackingResponse = await res.json();
    return data;
  } catch (err: any) {
    console.error('Tracking service network error:', err?.message);
    return {
      found: false,
      message: 'Unable to reach tracking service. Please check your connection or inquire with NAMORA Concierge.',
    };
  }
}
