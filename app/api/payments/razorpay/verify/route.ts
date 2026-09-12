import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPaymentSignature } from '@/lib/payments/razorpay';
import { VerifyPaymentResponse } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

/**
 * In-memory idempotency cache for fast deduplication across rapid duplicate callbacks
 */
const verifiedPaymentsCache = new Map<string, VerifyPaymentResponse>();

/**
 * POST /api/payments/razorpay/verify
 * Cryptographically verifies Razorpay payment completion and updates order state.
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

    // 1. In-memory deduplication check
    if (verifiedPaymentsCache.has(razorpay_payment_id)) {
      const cached = verifiedPaymentsCache.get(razorpay_payment_id)!;
      return NextResponse.json({
        ...cached,
        is_duplicate: true,
      });
    }

    // 2. Cryptographic Signature Verification
    const isSignatureValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isSignatureValid) {
      // Record failed attempt in payments table if possible
      try {
        const supabase = createAdminClient();
        await supabase.from('payments').insert([
          {
            order_id: finalOrderId && finalOrderId.length === 36 ? finalOrderId : null,
            order_number: finalOrderNumber || 'UNKNOWN',
            provider: 'razorpay',
            provider_order_id: razorpay_order_id,
            provider_payment_id: razorpay_payment_id,
            amount: 49.00,
            status: 'failed',
            method,
          },
        ]);
      } catch {
        // Ignore failure logging errors
      }

      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed. Invalid cryptographic credentials.' },
        { status: 400 }
      );
    }

    // 3. Database Idempotency Check
    try {
      const supabase = createAdminClient();
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('provider_payment_id', razorpay_payment_id)
        .maybeSingle();

      if (existingPayment) {
        const dupResponse: VerifyPaymentResponse = {
          success: true,
          is_duplicate: true,
          order_number: existingPayment.order_number || finalOrderNumber,
          status: 'advance_paid',
          deposit_paid: Number(existingPayment.amount) || 49,
          cod_balance: (body.cod_balance !== undefined ? Number(body.cod_balance) : 450),
          payment_id: razorpay_payment_id,
        };
        verifiedPaymentsCache.set(razorpay_payment_id, dupResponse);
        return NextResponse.json(dupResponse);
      }
    } catch (checkErr: any) {
      console.warn('Idempotency check note in verify route:', checkErr?.message);
    }

    // 4. Resolve Order details from Supabase
    let resolvedOrder: any = null;
    let supabase = createAdminClient();
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

    const orderNum = resolvedOrder?.order_number || finalOrderNumber || 'NAM-VERIFIED';
    const depositPaid = resolvedOrder?.deposit_amount !== undefined
      ? Number(resolvedOrder.deposit_amount)
      : (body.amount ? Number(body.amount) : 49.00);
    const codBalance = resolvedOrder?.cod_amount !== undefined
      ? Number(resolvedOrder.cod_amount)
      : 450.00;

    let verificationSuccessful = false;

    // 5. Attempt PostgreSQL verify_order_payment RPC
    if (resolvedOrder?.id && resolvedOrder.id.length === 36) {
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
    }

    // 6. Direct Database Update / Fallback Table Mutation
    if (!verificationSuccessful) {
      try {
        // Record in payments table
        await supabase.from('payments').insert([
          {
            order_id: resolvedOrder?.id && resolvedOrder.id.length === 36 ? resolvedOrder.id : null,
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

        // Update orders table
        if (resolvedOrder?.id) {
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
        }

        verificationSuccessful = true;
      } catch (dbUpdateErr: any) {
        console.warn('Direct payment table update note:', dbUpdateErr?.message);
      }
    }

    // 7. Reconcile with legacy server.js on port 3300 if running
    try {
      await fetch('http://localhost:3300/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: resolvedOrder?.id || finalOrderId,
          order_number: orderNum,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          method,
        }),
      });
    } catch {
      // Legacy server proxy is optional
    }

    const responsePayload: VerifyPaymentResponse = {
      success: true,
      is_duplicate: false,
      order_number: orderNum,
      status: 'advance_paid',
      deposit_paid: depositPaid,
      cod_balance: codBalance,
      payment_id: razorpay_payment_id,
    };

    verifiedPaymentsCache.set(razorpay_payment_id, responsePayload);

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('API /api/payments/razorpay/verify error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error verifying payment.' },
      { status: 500 }
    );
  }
}
