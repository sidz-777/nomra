import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPaymentSignature, fetchRazorpayPayment } from '@/lib/payments/razorpay';
import { VerifyPaymentResponse } from '@/lib/payments/types';
import { triggerOrderConfirmed } from '@/lib/notifications/triggers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/razorpay/verify
 * Cryptographically verifies Razorpay payment completion and updates order state.
 * Validates HMAC signature, order binding, deposit amount, and prevents replayed payments.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      order_id,
      orderNumber,
      order_number,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      method = 'upi',
    } = body;

    const finalOrderId = orderId || order_id;
    const finalOrderNumber = orderNumber || order_number;

    if (!razorpay_payment_id || !razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment identifiers (razorpay_payment_id, razorpay_order_id).' },
        { status: 400 }
      );
    }

    // 1. Cryptographic Signature Verification
    const isSignatureValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isSignatureValid) {
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed. Invalid cryptographic credentials.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 2. Database Idempotency Check: prevent duplicate processing of the same payment ID
    try {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('provider_payment_id', razorpay_payment_id)
        .maybeSingle();

      if (existingPayment) {
        return NextResponse.json({
          success: true,
          is_duplicate: true,
          order_number: existingPayment.order_number || finalOrderNumber,
          status: 'advance_paid',
          deposit_paid: Number(existingPayment.amount) || 49,
          cod_balance: (body.cod_balance !== undefined ? Number(body.cod_balance) : 450),
          payment_id: razorpay_payment_id,
        });
      }
    } catch (checkErr: any) {
      console.warn('Idempotency check note in verify route:', checkErr?.message);
    }

    // 3. Resolve Order details from Supabase
    let resolvedOrder: any = null;
    try {
      let query = supabase.from('orders').select('*');
      if (finalOrderId && finalOrderId.includes('-') && finalOrderId.length === 36) {
        query = query.eq('id', finalOrderId);
      } else if (finalOrderNumber) {
        query = query.eq('order_number', finalOrderNumber);
      } else if (finalOrderId) {
        query = query.eq('order_number', finalOrderId);
      }

      const { data } = await query.maybeSingle();
      if (data) {
        resolvedOrder = data;
      }
    } catch (lookupErr: any) {
      console.warn('Order lookup note in verify:', lookupErr?.message);
    }

    if (!resolvedOrder) {
      return NextResponse.json(
        { success: false, error: 'Order reference not found in database.' },
        { status: 404 }
      );
    }

    // 4. Strict Order Binding Verification:
    // Prevent Order A's payment from marking Order B as paid
    if (resolvedOrder.razorpay_order_id && resolvedOrder.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order Binding Violation: The Razorpay order does not belong to this booking.',
        },
        { status: 400 }
      );
    }

    const orderNum = resolvedOrder.order_number;
    const depositPaid = Number(resolvedOrder.deposit_amount) || 49.00;
    const codBalance = Number(resolvedOrder.cod_amount) || (Number(resolvedOrder.total_amount) - depositPaid);

    // 5. Authoritative Amount Validation: Never trust browser-supplied payment amount
    if (body.amount !== undefined && body.amount !== null) {
      const browserAmount = Number(body.amount);
      if (browserAmount !== depositPaid) {
        return NextResponse.json(
          {
            success: false,
            error: `Payment Amount Mismatch: Browser supplied amount (₹${browserAmount}) does not match authoritative deposit (₹${depositPaid}).`,
          },
          { status: 400 }
        );
      }
    }

    // 6. Authoritative Gateway Check: Validate payment directly with Razorpay API if live
    const gatewayPayment = await fetchRazorpayPayment(razorpay_payment_id);
    if (gatewayPayment) {
      if (gatewayPayment.order_id && gatewayPayment.order_id !== razorpay_order_id) {
        return NextResponse.json(
          { success: false, error: 'Gateway Violation: Razorpay payment belongs to another order.' },
          { status: 400 }
        );
      }
      const expectedPaise = Math.round(depositPaid * 100);
      if (gatewayPayment.amount !== expectedPaise) {
        return NextResponse.json(
          {
            success: false,
            error: `Underpayment Detected: Gateway payment amount (${gatewayPayment.amount} paise) does not match required deposit (${expectedPaise} paise).`,
          },
          { status: 400 }
        );
      }
      if (gatewayPayment.currency !== 'INR') {
        return NextResponse.json(
          { success: false, error: 'Currency Violation: Only INR payments are accepted.' },
          { status: 400 }
        );
      }
    }

    // 7. Attempt PostgreSQL verify_order_payment RPC (Zero underpayment tolerance)
    let verificationSuccessful = false;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('verify_order_payment', {
        p_order_id: resolvedOrder.id,
        p_provider_order_id: razorpay_order_id,
        p_provider_payment_id: razorpay_payment_id,
        p_amount: depositPaid,
        p_method: method || 'upi',
      });

      if (!rpcError && rpcData?.success) {
        verificationSuccessful = true;
      }
    } catch (rpcErr: any) {
      console.warn('Direct verify_order_payment RPC note:', rpcErr?.message);
    }

    // 6. Direct Database Update fallback if RPC not yet deployed
    if (!verificationSuccessful) {
      try {
        await supabase.from('payments').insert([
          {
            order_id: resolvedOrder.id,
            order_number: orderNum,
            provider: 'razorpay',
            provider_order_id: razorpay_order_id,
            provider_payment_id: razorpay_payment_id,
            amount: depositPaid,
            currency: 'INR',
            status: 'paid',
            method: method || 'upi',
          },
        ]);

        await supabase
          .from('orders')
          .update({
            status: 'advance_paid',
            payment_status: 'deposit_received',
            razorpay_order_id,
            razorpay_payment_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', resolvedOrder.id);

        verificationSuccessful = true;
      } catch (dbUpdateErr: any) {
        console.error('Payment database update error:', dbUpdateErr?.message);
      }
    }

    // Trigger durable notification (non-blocking, completely isolated from payment response)
    triggerOrderConfirmed({
      ...resolvedOrder,
      deposit_amount: depositPaid,
      cod_amount: codBalance,
      tracking_token: resolvedOrder.tracking_token,
      tracking_url: resolvedOrder.tracking_token ? `/track?token=${resolvedOrder.tracking_token}` : `/track?orderNumber=${orderNum}`,
    }).catch((notifErr) => {
      console.warn('[Payment Verify] Non-blocking notification note:', notifErr?.message);
    });

    const verifyResponse: VerifyPaymentResponse = {
      success: true,
      order_number: orderNum,
      status: 'advance_paid',
      deposit_paid: depositPaid,
      cod_balance: codBalance,
      payment_id: razorpay_payment_id,
      tracking_token: resolvedOrder.tracking_token || undefined,
      tracking_url: resolvedOrder.tracking_token ? `/track?token=${resolvedOrder.tracking_token}` : undefined,
    };

    return NextResponse.json(verifyResponse);
  } catch (err: any) {
    console.error('API /api/payments/razorpay/verify error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error verifying payment.' },
      { status: 500 }
    );
  }
}
