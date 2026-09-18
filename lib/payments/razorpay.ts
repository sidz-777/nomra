import crypto from 'crypto';
import { PUBLIC_CONFIG, getServerSecrets } from '@/lib/config';

/**
 * NAMORA — Server-Authoritative Razorpay Helper Utilities
 * Strictly server-side cryptographic and monetary calculations.
 * Completely hardened against mock signature backdoors.
 */

/**
 * Converts INR to paise using exact integer arithmetic.
 * Ensures zero floating-point imprecision (e.g. ₹49 -> 4900, ₹98 -> 9800).
 */
export function toPaise(amountInr: number): number {
  if (typeof amountInr !== 'number' || isNaN(amountInr) || amountInr < 0) {
    return 4900;
  }
  return Math.floor(Math.round(amountInr * 100));
}

/**
 * Converts paise back to INR for safe display formatting.
 */
export function fromPaise(amountPaise: number): number {
  if (typeof amountPaise !== 'number' || isNaN(amountPaise)) {
    return 49;
  }
  return amountPaise / 100;
}

/**
 * Cryptographically verifies Razorpay Checkout Payment HMAC-SHA256 Signature.
 * Strictly uses constant-time comparison (crypto.timingSafeEqual).
 * Backdoors and simulation tokens are strictly prohibited.
 */
export function verifyPaymentSignature(
  params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
  customSecret?: string
): boolean {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  let secret = customSecret;
  if (!secret && typeof window === 'undefined') {
    try {
      secret = getServerSecrets().RAZORPAY_KEY_SECRET;
    } catch {
      secret = '';
    }
  }

  if (!secret) {
    console.error('Security Alert: Attempted signature verification with missing RAZORPAY_KEY_SECRET.');
    return false;
  }

  try {
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(razorpay_signature, 'utf8');

    if (expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return true;
    }
  } catch (err: any) {
    console.error('Error during payment signature verification:', err?.message);
  }

  return false;
}

/**
 * Cryptographically verifies Razorpay Webhook HMAC-SHA256 Signature using raw request body.
 * Strictly uses constant-time comparison (crypto.timingSafeEqual).
 * Backdoors and simulation tokens are strictly prohibited.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  customSecret?: string
): boolean {
  if (!rawBody || !signature) {
    return false;
  }

  let secret = customSecret;
  if (!secret && typeof window === 'undefined') {
    try {
      secret = getServerSecrets().RAZORPAY_WEBHOOK_SECRET;
    } catch {
      secret = '';
    }
  }

  if (!secret) {
    console.error('Security Alert: Attempted webhook verification with missing RAZORPAY_WEBHOOK_SECRET.');
    return false;
  }

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return true;
    }
  } catch (err: any) {
    console.error('Error during webhook signature verification:', err?.message);
  }

  return false;
}

/**
 * Creates a Razorpay Order through the gateway API.
 * Fails closed if production credentials fail or are invalid.
 */
export async function createRazorpayGatewayOrder(params: {
  amountPaise: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const { amountPaise, currency = 'INR', receipt, notes } = params;

  let keyId = PUBLIC_CONFIG.RAZORPAY_KEY_ID;
  let keySecret = '';
  try {
    keySecret = getServerSecrets().RAZORPAY_KEY_SECRET;
  } catch {
    // Client environment guard
  }

  // Attempt real Razorpay API call if secret exists
  if (keySecret && keySecret !== 'namora_dev_secret_demo' && !keyId.includes('test_namora_demo')) {
    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          notes: notes || {},
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          amount: data.amount,
          currency: data.currency || currency,
        };
      } else {
        const errText = await res.text();
        console.error('Razorpay API error response:', res.status, errText);
        throw new Error(`Razorpay API rejected order creation: ${res.status}`);
      }
    } catch (err: any) {
      console.error('Razorpay gateway fetch exception:', err?.message);
      throw err;
    }
  }

  // If on a live production domain with unconfigured or demo keys, fail closed
  const isLocalOrTest =
    PUBLIC_CONFIG.APP_URL.includes('localhost') ||
    PUBLIC_CONFIG.APP_URL.includes('127.0.0.1') ||
    process.env.APP_ENV === 'test' ||
    process.env.ALLOW_DEMO_GATEWAY === 'true';

  if (!isLocalOrTest && process.env.NODE_ENV === 'production') {
    throw new Error('Production Error: RAZORPAY_KEY_SECRET or RAZORPAY_KEY_ID is unconfigured or set to test demo values.');
  }

  // Local development mock order ID (only for offline testing)
  const mockId = 'order_' + crypto.randomBytes(8).toString('hex');
  return {
    id: mockId,
    amount: amountPaise,
    currency,
  };
}

/**
 * Fetches verified payment details from the official Razorpay Gateway API.
 * Returns null if running in offline test mode without live credentials.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<{
  id: string;
  order_id: string;
  amount: number; // in paise
  currency: string;
  status: string;
} | null> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  let keySecret = '';
  try {
    keySecret = getServerSecrets().RAZORPAY_KEY_SECRET;
  } catch {
    return null;
  }

  if (keySecret && !keyId.includes('test_namora_demo') && keySecret !== 'namora_dev_secret_demo') {
    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          order_id: data.order_id,
          amount: Number(data.amount),
          currency: data.currency,
          status: data.status,
        };
      } else {
        const errText = await res.text();
        console.error('Razorpay payment fetch error:', res.status, errText);
      }
    } catch (err: any) {
      console.error('Razorpay payment fetch network exception:', err?.message);
    }
  }

  return null;
}
