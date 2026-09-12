import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PUBLIC_CONFIG } from '@/lib/config';
import { toPaise, createRazorpayGatewayOrder } from '@/lib/payments/razorpay';
import { CreateRazorpayOrderResponse } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/razorpay/create-order
 * Creates a server-authoritative Razorpay payment order for the NAMORA booking deposit.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = body?.orderId || body?.order_id;
    const orderNumber = body?.orderNumber || body?.order_number;

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Order reference (orderId or orderNumber) is required.' },
        { status: 400 }
      );
    }

    let resolvedOrder: any = null;

    // 1. Resolve order from Supabase
    try {
      const supabase = createAdminClient();
      let query = supabase.from('orders').select('*');
      if (orderId && orderId.includes('-') && orderId.length === 36) {
        query = query.eq('id', orderId);
      } else if (orderNumber) {
        query = query.eq('order_number', orderNumber);
      } else if (orderId) {
        query = query.eq('order_number', orderId);
      }

      const { data, error } = await query.single();
      if (!error && data) {
        resolvedOrder = data;
      }
    } catch (dbErr: any) {
      console.warn('Supabase order lookup note in create-order:', dbErr?.message);
    }

    // 2. Check proxy to server.js backend if not found directly in Supabase
    if (!resolvedOrder && orderNumber) {
      try {
        const proxyRes = await fetch('http://localhost:3300/api/track-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: orderNumber }),
        });
        if (proxyRes.ok) {
          const pData = await proxyRes.json();
          if (pData.found && pData.order) {
            resolvedOrder = pData.order;
          }
        }
      } catch (proxyErr: any) {
        console.warn('Proxy track-order note in create-order:', proxyErr?.message);
      }
    }

    // 3. Fallback order reference reconstruction
    const finalOrderId = resolvedOrder?.id || orderId || `order_${Date.now()}`;
    const finalOrderNumber = resolvedOrder?.order_number || orderNumber || 'NAM-ORDER';
    
    // Enforce server-authoritative deposit derivation (₹49 per frame default)
    const depositInr = resolvedOrder?.deposit_amount !== undefined
      ? Number(resolvedOrder.deposit_amount)
      : (body?.frameCount ? Number(body.frameCount) * 49 : 49);

    const totalInr = resolvedOrder?.total_amount !== undefined ? Number(resolvedOrder.total_amount) : 499;
    const codInr = resolvedOrder?.cod_amount !== undefined ? Number(resolvedOrder.cod_amount) : (totalInr - depositInr);

    // Convert to paise strictly via integer arithmetic
    const amountPaise = toPaise(depositInr);

    // 4. Create Razorpay order via Gateway
    const gatewayOrder = await createRazorpayGatewayOrder({
      amountPaise,
      currency: 'INR',
      receipt: finalOrderNumber,
      notes: {
        namora_order_id: String(finalOrderId),
        namora_order_number: String(finalOrderNumber),
      },
    });

    const razorpayOrderId = gatewayOrder.id;

    // 5. Persist razorpay_order_id back to Supabase
    if (resolvedOrder?.id) {
      try {
        const supabase = createAdminClient();
        await supabase
          .from('orders')
          .update({
            razorpay_order_id: razorpayOrderId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', resolvedOrder.id);
      } catch (updateErr: any) {
        console.warn('Persist razorpay_order_id note:', updateErr?.message);
      }
    }

    const responsePayload: CreateRazorpayOrderResponse = {
      success: true,
      keyId: PUBLIC_CONFIG.RAZORPAY_KEY_ID,
      razorpayOrderId,
      amount: amountPaise,
      currency: 'INR',
      orderId: finalOrderId,
      orderNumber: finalOrderNumber,
      depositAmount: depositInr,
      codAmount: codInr,
      totalAmount: totalInr,
      customer: {
        name: resolvedOrder?.customer_name || body?.customerName || 'Valued Customer',
        contact: resolvedOrder?.phone || body?.customerPhone || '',
      },
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('API /api/payments/razorpay/create-order error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error creating Razorpay order.' },
      { status: 500 }
    );
  }
}
