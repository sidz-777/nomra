import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TrackingOrderSafe, TrackingItemSafe, TrackingResponse } from '@/lib/tracking/types';
import { maskCustomerName } from '@/lib/notifications/masking';

export const dynamic = 'force-dynamic';

// Sliding-window rate limiter for public tracking endpoint (Max 15 inquiries per minute per IP)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 15;

  const record = rateLimitMap.get(ip);
  if (!record || record.expiresAt < now) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
    return false;
  }

  record.count += 1;
  return record.count > maxRequests;
}

// Generic privacy-preserving failure message (Prevents order number enumeration)
const GENERIC_VERIFICATION_FAILURE =
  'Verification failed. For your privacy and gift confidentiality, tracking requires a valid Tracking Token OR your Order Reference along with the last 4 digits of your mobile number or delivery PIN.';

async function handleTrackingRequest(request: NextRequest, body: any) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { found: false, error: 'Too many tracking inquiries. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const token = (body.token || '').toString().trim();
    const orderNumber = (body.orderNumber || body.order_number || body.query || '').toString().trim();
    const verification = (body.verification || body.pin || body.last4 || body.phone_last_4 || '').toString().trim();

    // 1. REJECT UNSAFE QUERIES
    // Strict enforcement: Phone-only lookups are explicitly rejected to prevent gift scraping.
    const isDigitsOnly = /^\d{10}$/.test(orderNumber);
    if (isDigitsOnly && !token) {
      return NextResponse.json(
        {
          found: false,
          message:
            'For customer security and gift confidentiality, tracking by phone number alone is disabled. Please use your secure tracking link or enter your Order Reference (e.g. NAM-8429) with verification.',
        },
        { status: 200 }
      );
    }

    // Must have either a valid token OR (orderNumber AND verification)
    if (!token && (!orderNumber || !verification)) {
      return NextResponse.json(
        {
          found: false,
          message: GENERIC_VERIFICATION_FAILURE,
        },
        { status: 200 }
      );
    }

    const supabase = createAdminClient();
    let foundOrder: any = null;
    let foundItems: any[] = [];

    // 2. PATH A: Direct Token Lookup
    if (token) {
      // Validate token structure (hex string, at least 16 chars)
      if (!/^[0-9a-fA-F]{16,64}$/.test(token)) {
        return NextResponse.json(
          { found: false, message: 'Invalid or malformed tracking token.' },
          { status: 200 }
        );
      }

      try {
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('tracking_token', token)
          .limit(1);

        if (dbOrders && dbOrders.length > 0) {
          foundOrder = dbOrders[0];
        }
      } catch (e: any) {
        console.warn('Orders tracking_token query note:', e?.message);
      }

      // Fallback: Check settings table if tracking_token column is pending remote migration
      if (!foundOrder) {
        try {
          const { data: settingRow } = await supabase
            .from('settings')
            .select('value')
            .eq('key', `tracking_token:${token}`)
            .maybeSingle();

          if (settingRow && settingRow.value) {
            const parsed = typeof settingRow.value === 'string' ? JSON.parse(settingRow.value) : settingRow.value;
            const targetOrderId = parsed?.order_id;
            const targetOrderNum = parsed?.order_number;

            let fallbackQuery = supabase.from('orders').select('*');
            if (targetOrderId) {
              fallbackQuery = fallbackQuery.eq('id', targetOrderId);
            } else if (targetOrderNum) {
              fallbackQuery = fallbackQuery.eq('order_number', targetOrderNum);
            }
            const { data: fallbackOrders } = await fallbackQuery.limit(1);
            if (fallbackOrders && fallbackOrders.length > 0) {
              foundOrder = fallbackOrders[0];
            }
          }
        } catch (setErr: any) {
          console.warn('Settings token fallback query note:', setErr?.message);
        }
      }
    }

    // 3. PATH B: Dual-Verification Manual Lookup
    if (!foundOrder && orderNumber && verification) {
      const qUpper = orderNumber.toUpperCase().trim();
      const cleanVerif = verification.replace(/\D/g, '');

      if (cleanVerif.length < 4) {
        return NextResponse.json(
          { found: false, message: GENERIC_VERIFICATION_FAILURE },
          { status: 200 }
        );
      }

      const { data: dbOrders } = await supabase
        .from('orders')
        .select('*')
        .ilike('order_number', qUpper)
        .limit(1);

      if (dbOrders && dbOrders.length > 0) {
        const candidate = dbOrders[0];
        const phoneDigits = (candidate.phone || '').replace(/\D/g, '');
        const pincodeDigits = (candidate.pincode || '').replace(/\D/g, '');

        const phoneLast4 = phoneDigits.slice(-4);
        const matchesPhone = phoneLast4.length === 4 && cleanVerif.endsWith(phoneLast4);
        const matchesPincode = pincodeDigits.length >= 4 && (pincodeDigits === cleanVerif || cleanVerif === pincodeDigits);

        if (matchesPhone || matchesPincode) {
          foundOrder = candidate;
        }
      }
    }

    // If verification failed or order not found, return generic message (Zero enumeration leakage)
    if (!foundOrder) {
      return NextResponse.json(
        {
          found: false,
          message: GENERIC_VERIFICATION_FAILURE,
        },
        { status: 200 }
      );
    }

    // Query associated order items
    try {
      const { data: dbItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', foundOrder.id);
      foundItems = Array.isArray(dbItems) ? dbItems : [];
    } catch (e: any) {
      console.warn('Item lookup warning in track-order:', e?.message);
    }

    // 4. STRICT PRIVACY SANITIZATION:
    // Never expose:
    // - tracking_token
    // - full phone number
    // - full email
    // - complete street address
    // - internal admin notes
    // - internal audit logs
    // - payment secrets or razorpay keys
    const safeOrder: TrackingOrderSafe = {
      order_number: String(foundOrder.order_number || ''),
      customer_name: maskCustomerName(foundOrder.customer_name),
      status: String(foundOrder.status || 'confirmed'),
      payment_status: String(foundOrder.payment_status || 'paid'),
      courier_name: foundOrder.courier_name || '',
      carrier: foundOrder.carrier || foundOrder.courier_name || '',
      tracking_number: foundOrder.tracking_number || '',
      tracking_url: foundOrder.tracking_url || '',
      estimated_delivery_date: foundOrder.estimated_delivery_date || undefined,
      total_amount: Number(foundOrder.total_amount) || 0,
      deposit_amount: Number(foundOrder.deposit_amount) || 0,
      cod_amount: Number(foundOrder.cod_amount) || 0,
      created_at: foundOrder.created_at,
      dispatched_at: foundOrder.dispatched_at,
      delivered_at: foundOrder.delivered_at,
      destination_summary: {
        city: foundOrder.city || '',
        state: foundOrder.state || '',
        pincode: foundOrder.pincode || '',
        masked_name: maskCustomerName(foundOrder.customer_name),
      },
    };

    const safeItems: TrackingItemSafe[] = (foundItems || []).map((it: any) => ({
      product_title: it.product_title || it.title || 'Handcrafted Bespoke Frame',
      product_image: it.product_image || it.image || '',
      english_name: it.english_name || '',
      arabic_name: it.arabic_name || '',
      ink_style: it.ink_style || '',
      font_style: it.font_style || '',
      has_gift: Boolean(it.has_gift),
      gift_to: '', // Redacted for gift confidentiality
      gift_from: '', // Redacted for gift confidentiality
      gift_message: '', // Redacted for gift confidentiality
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
    }));

    const responsePayload: TrackingResponse = {
      found: true,
      order: safeOrder,
      items: safeItems,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: any) {
    console.error('API /api/track-order exception:', err?.message);
    return NextResponse.json(
      { found: false, error: 'Server error processing tracking inquiry.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const orderNumber =
    request.nextUrl.searchParams.get('orderNumber') ||
    request.nextUrl.searchParams.get('query') ||
    '';
  const verification =
    request.nextUrl.searchParams.get('verification') ||
    request.nextUrl.searchParams.get('pin') ||
    request.nextUrl.searchParams.get('last4') ||
    '';

  return handleTrackingRequest(request, { token, orderNumber, verification });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return handleTrackingRequest(request, body);
}
