import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TrackingOrderSafe, TrackingItemSafe, TrackingResponse } from '@/lib/tracking/types';

export const dynamic = 'force-dynamic';

// Sliding-window rate limiter for public tracking endpoint (Max 15 inquiries per minute per IP)
// Note: In distributed multi-instance deployment, rate limiting should be backed by an edge store (e.g. Upstash Redis).
// This in-memory instance limiter isolates single-node abuse.
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

async function handleTrackingRequest(request: NextRequest, rawQuery: string) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { found: false, error: 'Too many tracking inquiries. Please wait a moment before checking again.' },
        { status: 429 }
      );
    }

    const query = (rawQuery || '').trim();

    if (!query) {
      return NextResponse.json(
        { found: false, error: 'Order reference required (e.g. NAM-8429).' },
        { status: 400 }
      );
    }

    const qUpper = query.toUpperCase();
    const isOrderNumber = qUpper.startsWith('NAM-');

    // PRIVACY ENFORCEMENT:
    // Reject arbitrary phone-only queries to prevent public scraping and enumeration of customer gift records.
    if (!isOrderNumber) {
      return NextResponse.json(
        {
          found: false,
          message:
            'For your security and privacy, order tracking requires your unique Order Reference (e.g. NAM-8429) provided at booking.',
        },
        { status: 200 }
      );
    }

    let foundOrder: any = null;
    let foundItems: any[] = [];

    // Query Supabase directly
    try {
      const supabase = createAdminClient();

      const { data: dbOrders, error: dbError } = await supabase
        .from('orders')
        .select('*')
        .ilike('order_number', qUpper)
        .limit(1);

      if (!dbError && dbOrders && dbOrders.length > 0) {
        foundOrder = dbOrders[0];

        // Query associated order items
        const { data: dbItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', foundOrder.id);
        foundItems = Array.isArray(dbItems) ? dbItems : [];
      }
    } catch (dbErr: any) {
      console.warn('Database lookup exception in track-order:', dbErr?.message);
    }

    // If order found, construct sanitized customer-safe payload
    // STRICT PII REDACTION:
    // Exclude customer delivery address, phone, email, admin notes, production checklist, and gift recipient notes
    if (foundOrder) {
      const safeOrder: TrackingOrderSafe = {
        order_number: String(foundOrder.order_number || ''),
        customer_name: String(foundOrder.customer_name || 'Valued Customer'),
        status: String(foundOrder.status || 'confirmed'),
        payment_status: String(foundOrder.payment_status || 'paid'),
        courier_name: foundOrder.courier_name || '',
        tracking_number: foundOrder.tracking_number || '',
        tracking_url: foundOrder.tracking_url || '',
        total_amount: Number(foundOrder.total_amount) || 0,
        deposit_amount: Number(foundOrder.deposit_amount) || 0,
        cod_amount: Number(foundOrder.cod_amount) || 0,
        created_at: foundOrder.created_at,
        dispatched_at: foundOrder.dispatched_at,
        delivered_at: foundOrder.delivered_at,
      };

      const safeItems: TrackingItemSafe[] = (foundItems || []).map((it: any) => ({
        product_title: it.product_title || it.title || 'Handcrafted Frame',
        product_image: it.product_image || it.image || '',
        english_name: it.english_name || '',
        arabic_name: it.arabic_name || '',
        ink_style: it.ink_style || '',
        font_style: it.font_style || '',
        has_gift: Boolean(it.has_gift),
        gift_to: '', // Redacted for privacy
        gift_from: '', // Redacted for privacy
        gift_message: '', // Redacted for privacy
        price: Number(it.price) || 0,
      }));

      const responsePayload: TrackingResponse = {
        found: true,
        order: safeOrder,
        items: safeItems,
      };

      return NextResponse.json(responsePayload, { status: 200 });
    }

    return NextResponse.json(
      {
        found: false,
        message: 'No order found matching your inquiry. Please check your order reference (e.g. NAM-8429).',
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('API /api/track-order error:', err?.message);
    return NextResponse.json(
      { found: false, error: 'Server error processing tracking inquiry.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const query =
    request.nextUrl.searchParams.get('orderNumber') ||
    request.nextUrl.searchParams.get('query') ||
    '';
  return handleTrackingRequest(request, query);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const query = ((body && body.query) || '').toString().trim();
  return handleTrackingRequest(request, query);
}
