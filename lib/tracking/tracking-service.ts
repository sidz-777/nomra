/**
 * NAMORA Customer Order Tracking Service
 * Client-side tracking caller with robust error handling.
 */

import { TrackingResponse } from './types';

export async function trackCustomerOrder(query: string): Promise<TrackingResponse> {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) {
    return { found: false, message: 'Please enter your 10-digit mobile number or Order ID' };
  }

  try {
    const res = await fetch('/api/track-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: cleanQuery }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        found: false,
        message: errorData.message || errorData.error || 'Unable to retrieve order details.',
      };
    }

    const data: TrackingResponse = await res.json();
    return data;
  } catch (err: any) {
    console.error('Tracking service network note:', err?.message);
    return {
      found: false,
      message: 'Unable to reach tracking service. Please verify your connection or reach out on WhatsApp.',
    };
  }
}
