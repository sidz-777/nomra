import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { adminOrdersStore } from '@/lib/admin/order-memory-store';
import { TrackingOrderSafe, TrackingItemSafe, TrackingResponse } from '@/lib/tracking/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = ((body && body.query) || '').toString().trim();

    if (!query) {
      return NextResponse.json(
        { found: false, error: 'Query required' },
        { status: 400 }
      );
    }

    let foundOrder: any = null;
    let foundItems: any[] = [];

    const qUpper = query.toUpperCase();
    const isOrderNumber = qUpper.startsWith('NAM-');
    const digits = query.replace(/\D/g, '').slice(-10);

    // 1. Query Supabase
    try {
      const supabase = createAdminClient();

      // 1a. Try Supabase RPC if exists
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('track_customer_order', {
          p_query: query,
        });
        if (!rpcError && rpcData && rpcData.found && rpcData.order) {
          foundOrder = rpcData.order;
          foundItems = rpcData.items || [];
        }
      } catch {
        // RPC fallback to direct select
      }

      // 1b. Direct table select if RPC didn't return
      if (!foundOrder) {
        let orderQuery = supabase.from('orders').select('*');
        if (isOrderNumber) {
          orderQuery = orderQuery.ilike('order_number', qUpper);
        } else if (digits.length >= 10) {
          orderQuery = orderQuery.ilike('phone', `%${digits}`);
        } else {
          orderQuery = orderQuery.ilike('order_number', `%${query}%`);
        }

        const { data: dbOrders, error: dbError } = await orderQuery.limit(1);
        if (!dbError && dbOrders && dbOrders.length > 0) {
          foundOrder = dbOrders[0];

          // Query items
          const { data: dbItems } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', foundOrder.id);
          foundItems = Array.isArray(dbItems) ? dbItems : [];
        }
      }
    } catch (dbErr: any) {
      console.warn('Database lookup note for track-order, falling back to memory store:', dbErr?.message);
    }

    // 2. Query in-memory admin store
    if (!foundOrder) {
      const allOrders = adminOrdersStore.getAllOrders();
      if (isOrderNumber) {
        foundOrder = allOrders.find(
          (o) => o.order_number && o.order_number.toUpperCase() === qUpper
        );
      } else if (digits.length >= 10) {
        foundOrder = allOrders.find(
          (o) => o.phone && o.phone.replace(/\D/g, '').endsWith(digits)
        );
      } else {
        foundOrder = allOrders.find(
          (o) => o.order_number && o.order_number.toUpperCase().includes(qUpper)
        );
      }

      if (foundOrder) {
        foundItems = foundOrder.items || [];
      }
    }

    // 3. Fallback to legacy server (port 3300) proxy if still not found
    if (!foundOrder) {
      try {
        const legacyRes = await fetch('http://localhost:3300/api/track-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          // Short timeout so it doesn't hang if server is not reachable
          signal: AbortSignal.timeout(1500),
        });
        if (legacyRes.ok) {
          const legacyData = await legacyRes.json();
          if (legacyData && legacyData.found && legacyData.order) {
            foundOrder = legacyData.order;
            foundItems = legacyData.items || [];
          }
        }
      } catch {
        // Port 3300 unavailable or timed out
      }
    }

    // If order found, construct sanitized customer-safe payload
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
        gift_to: it.gift_to || '',
        gift_from: it.gift_from || '',
        gift_message: it.gift_message || '',
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
        message: 'No order found matching your inquiry.',
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('API /api/track-order uncaught error:', err?.message);
    return NextResponse.json(
      { found: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
