import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature, fromPaise } from '@/lib/payments/razorpay';
import { RazorpayWebhookPayload } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

/**
 * Set of processed webhook payment IDs for memory-level deduplication
 */
const processedWebhooks = new Set<string>();

/**
 * POST /api/payments/razorpay/webhook
 * Receives and cryptographically reconciles asynchronous Razorpay webhook events.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Read raw text body for pristine cryptographic verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // 2. Cryptographic signature check
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return new NextResponse('Invalid webhook signature', { status: 400 });
    }

    // 3. Parse JSON body
    let payload: RazorpayWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new NextResponse('Malformed JSON payload', { status: 400 });
    }

    const event = payload?.event;

    // Handle payment capture and order paid events
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payload?.payment?.entity;
      const orderEntity = payload?.payload?.order?.entity;

      const providerPaymentId = paymentEntity?.id;
      const providerOrderId = paymentEntity?.order_id || orderEntity?.id;
      const amountPaise = paymentEntity?.amount || orderEntity?.amount || 4900;
      const depositInr = fromPaise(amountPaise);
      const method = paymentEntity?.method || 'upi';

      if (!providerPaymentId && !providerOrderId) {
        return NextResponse.json({ status: 'ignored', reason: 'No payment or order entity found' });
      }

      // Memory idempotency check
      if (providerPaymentId && processedWebhooks.has(providerPaymentId)) {
        return NextResponse.json({ status: 'ok', deduplicated: true });
      }

      // Database idempotency & reconciliation
      try {
        const supabase = createAdminClient();

        // Check if payment was already recorded
        if (providerPaymentId) {
          const { data: existingPay } = await supabase
            .from('payments')
            .select('id, order_number')
            .eq('provider_payment_id', providerPaymentId)
            .maybeSingle();

          if (existingPay) {
            processedWebhooks.add(providerPaymentId);
            return NextResponse.json({ status: 'ok', already_processed: true });
          }
        }

        // Find associated NAMORA order by razorpay_order_id or notes
        let matchedOrder: any = null;
        if (providerOrderId) {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('razorpay_order_id', providerOrderId)
            .maybeSingle();
          matchedOrder = data;
        }

        if (!matchedOrder && paymentEntity?.notes?.namora_order_id) {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('id', paymentEntity.notes.namora_order_id)
            .maybeSingle();
          matchedOrder = data;
        }

        if (matchedOrder) {
          // Attempt RPC verification
          let rpcSuccess = false;
          try {
            const { data: rpcRes, error: rpcErr } = await supabase.rpc('verify_order_payment', {
              p_order_id: matchedOrder.id,
              p_provider_order_id: providerOrderId || '',
              p_provider_payment_id: providerPaymentId || `pay_wh_${Date.now()}`,
              p_amount: depositInr,
              p_method: method,
            });
            if (!rpcErr && rpcRes?.success) {
              rpcSuccess = true;
            }
          } catch {
            // RPC fallback
          }

          if (!rpcSuccess) {
            // Direct insert into payments
            if (providerPaymentId) {
              await supabase.from('payments').insert([
                {
                  order_id: matchedOrder.id,
                  order_number: matchedOrder.order_number,
                  provider: 'razorpay',
                  provider_order_id: providerOrderId || '',
                  provider_payment_id: providerPaymentId,
                  amount: depositInr,
                  currency: 'INR',
                  status: 'paid',
                  method,
                },
              ]);
            }

            // Update order status
            await supabase
              .from('orders')
              .update({
                status: 'advance_paid',
                payment_status: 'deposit_received',
                razorpay_order_id: providerOrderId || matchedOrder.razorpay_order_id,
                razorpay_payment_id: providerPaymentId || matchedOrder.razorpay_payment_id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', matchedOrder.id);
          }
        }

        if (providerPaymentId) {
          processedWebhooks.add(providerPaymentId);
        }
      } catch (dbErr: any) {
        console.warn('Webhook DB reconciliation note:', dbErr?.message);
      }
    }

    return NextResponse.json({ status: 'ok', processed: true });
  } catch (err: any) {
    console.error('API /api/payments/razorpay/webhook error:', err);
    return new NextResponse('Webhook processing error', { status: 500 });
  }
}
