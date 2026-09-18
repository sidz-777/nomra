import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toPaise, createRazorpayGatewayOrder } from '@/lib/payments/razorpay';

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

    // 1. Resolve order strictly from Supabase
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

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        resolvedOrder = data;
      }
    } catch (dbErr: any) {
      console.warn('Supabase order lookup exception in create-order:', dbErr?.message);
    }

    // Fail closed if order cannot be found in database
    if (!resolvedOrder) {
      return NextResponse.json(
        { success: false, error: 'Order reference not found in database.' },
        { status: 404 }
      );
    }

    const finalOrderId = resolvedOrder.id;
    const finalOrderNumber = resolvedOrder.order_number;

    // Enforce server-authoritative deposit derivation (₹49 per frame default)
    const depositInr = resolvedOrder.deposit_amount !== undefined
      ? Number(resolvedOrder.deposit_amount)
      : 49;

    const amountPaise = toPaise(depositInr);

    // 2. Create Razorpay order via Gateway
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

    // 3. Persist razorpay_order_id back to Supabase
    try {
      const supabase = createAdminClient();
      await supabase
        .from('orders')
        .update({
          razorpay_order_id: razorpayOrderId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', finalOrderId);
    } catch (saveErr: any) {
      console.warn('Error saving razorpay_order_id to database:', saveErr?.message);
    }

    return NextResponse.json({
      success: true,
      orderId: finalOrderId,
      orderNumber: finalOrderNumber,
      razorpayOrderId,
      amount: amountPaise,
      currency: gatewayOrder.currency || 'INR',
      depositAmount: depositInr,
      totalAmount: Number(resolvedOrder.total_amount) || 499,
      codAmount: Number(resolvedOrder.cod_amount) || 450,
      customer: {
        name: resolvedOrder.customer_name || '',
        contact: resolvedOrder.phone || '',
      },
    });
  } catch (error: any) {
    console.error('API /api/payments/razorpay/create-order error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error creating payment gateway order.' },
      { status: 500 }
    );
  }
}
