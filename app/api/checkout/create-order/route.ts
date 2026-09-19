import { NextResponse } from 'next/server';
import { CreateOrderPayload, CreateOrderResponse } from '@/lib/checkout/checkout-types';
import {
  validateCheckoutForm,
  validateCheckoutItems,
  normalizeIndianMobile,
} from '@/lib/checkout/checkout-validation';
import { createAdminClient } from '@/lib/supabase/admin';
import { PERSIAN_DESIGNS } from '@/lib/storefront-data';
import crypto from 'crypto';
import { triggerOrderConfirmed } from '@/lib/notifications/triggers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body: CreateOrderPayload = await req.json();
    const { customer, address, items, gift, idempotencyKey } = body;

    const supabase = createAdminClient();

    // 1. Authoritative Database Idempotency Check (Never rely on in-memory memory map)
    if (idempotencyKey && idempotencyKey.trim().length > 0) {
      const key = idempotencyKey.trim();

      // Check primary checkout_requests table
      const { data: existingReq, error: idempErr } = await supabase
        .from('checkout_requests')
        .select('response_payload, status')
        .eq('idempotency_key', key)
        .maybeSingle();

      if (!idempErr && existingReq && existingReq.status === 'completed' && existingReq.response_payload) {
        return NextResponse.json(existingReq.response_payload);
      } else if (idempErr && idempErr.code === 'PGRST205') {
        // Table checkout_requests not yet migrated on live Supabase; check database settings store
        const { data: setRow, error: setErr } = await supabase
          .from('settings')
          .select('value')
          .eq('key', `idemp:${key}`)
          .maybeSingle();

        if (setErr) {
          console.error('Database idempotency check failed in settings store:', setErr.message);
          return NextResponse.json(
            { success: false, error: 'Database idempotency check unavailable. Order cannot be securely verified.' },
            { status: 503 }
          );
        }

        if (setRow && setRow.value) {
          try {
            const cached = JSON.parse(setRow.value);
            return NextResponse.json(cached);
          } catch {}
        }
      } else if (idempErr) {
        // Database offline or query failure: strictly FAIL CLOSED to prevent duplicate orders
        console.error('Database idempotency check error:', idempErr.message);
        return NextResponse.json(
          { success: false, error: 'Database idempotency check unavailable. Order placement aborted.' },
          { status: 503 }
        );
      }
    }

    // 2. Server-side form validation and sanitization
    const normalizedPhone = normalizeIndianMobile(customer?.phone || '');
    const formValidation = validateCheckoutForm({
      name: customer?.name,
      phone: normalizedPhone,
      email: customer?.email,
      addressLine1: address?.addressLine1,
      addressLine2: address?.addressLine2,
      landmark: address?.landmark,
      city: address?.city,
      state: address?.state,
      pincode: address?.pincode,
    });

    if (!formValidation.isValid) {
      const firstError = Object.values(formValidation.errors)[0];
      return NextResponse.json(
        { success: false, error: firstError || 'Invalid checkout information.' },
        { status: 400 }
      );
    }

    const itemsValidation = validateCheckoutItems(items);
    if (!itemsValidation.isValid) {
      return NextResponse.json(
        { success: false, error: itemsValidation.error || 'Invalid items in cart.' },
        { status: 400 }
      );
    }

    // 3. Server-Authoritative Price Calculation
    // Never trust client prices, static files, or disk overrides during checkout.
    // Price and inventory MUST be verified directly against the Supabase database.
    // If Supabase is unavailable, FAIL CLOSED.
    const { data: productsDb, error: prodErr } = await supabase
      .from('products')
      .select('id, title, price, deposit_price, cod_price, in_stock, stock_quantity, is_stock_managed, image_url, category_label');

    if (prodErr || !productsDb || !Array.isArray(productsDb) || productsDb.length === 0) {
      console.error('Authoritative pricing error: failed to fetch products from Supabase:', prodErr?.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Authoritative pricing service currently unavailable. Please try again in a few moments.',
        },
        { status: 503 }
      );
    }

    let subtotal = 0;
    let totalDeposit = 0;
    let totalFrames = 0;

    const flattenedItems: any[] = [];

    for (const item of items) {
      const qty = Math.max(1, Math.floor(item.quantity || 1));
      const pId = item.productId || (item as any).product_id;

      if (!pId) {
        return NextResponse.json(
          { success: false, error: 'Product ID is missing from cart item.' },
          { status: 400 }
        );
      }

      // Resolve canonical database ID for Persian designs if slug passed
      let lookupId = pId;
      const designIdx = PERSIAN_DESIGNS.findIndex((d) => d.id === pId);
      if (designIdx >= 0) {
        lookupId = `design-${designIdx + 1}`;
      }

      const dbMatch = productsDb.find((p) => p.id === lookupId || p.id === pId);

      // Fail closed if product does not exist in authoritative database
      if (!dbMatch) {
        return NextResponse.json(
          { success: false, error: `Product "${pId}" does not exist or has been discontinued.` },
          { status: 400 }
        );
      }

      // Check product active status (in_stock)
      if (dbMatch.in_stock === false) {
        return NextResponse.json(
          { success: false, error: `Product "${dbMatch.title}" is currently unavailable.` },
          { status: 400 }
        );
      }

      // Check stock if inventory is managed
      if (dbMatch.is_stock_managed && typeof dbMatch.stock_quantity === 'number' && dbMatch.stock_quantity < qty) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for "${dbMatch.title}". Only ${dbMatch.stock_quantity} available.` },
          { status: 400 }
        );
      }

      // Authoritative Price: database ONLY. ZERO arbitrary fallback.
      const basePrice = Number(dbMatch.price);
      if (isNaN(basePrice) || basePrice <= 0) {
        return NextResponse.json(
          { success: false, error: `Authoritative price unavailable for product "${pId}".` },
          { status: 400 }
        );
      }

      const baseDeposit = dbMatch.deposit_price !== undefined && dbMatch.deposit_price !== null
        ? Number(dbMatch.deposit_price)
        : 49;

      const hasItemGift = gift?.enabled || false;

      for (let i = 0; i < qty; i++) {
        subtotal += basePrice;
        totalDeposit += baseDeposit;
        totalFrames += 1;

        flattenedItems.push({
          productId: pId,
          product_id: pId,
          basePrice,
          deposit: baseDeposit,
          cod: basePrice - baseDeposit,
          productTitle: item.title || dbMatch.title || 'A4 Handmade Frame',
          productImage: item.image || dbMatch.image_url || 'design1.jpg',
          isReadyMade: item.productType === 'ready_stock',
          categoryLabel: item.categoryLabel || dbMatch.category_label || 'A4 Frame',
          englishName: item.customization?.englishName || '',
          arabicName: item.customization?.arabicName || '',
          inkLabel: item.customization?.finishLabel || 'Obsidian Black',
          fontLabel: item.customization?.fontLabel || 'Classic',
          textSizeLabel: item.customization?.textSizeLabel || 'Balanced',
          gift: hasItemGift
            ? {
                isGift: true,
                to: gift?.to || '',
                from: gift?.from || '',
                message: gift?.greetingNote || '',
              }
            : null,
        });
      }
    }

    const giftFee = gift?.enabled ? 69 : 0;
    const grandTotal = subtotal + giftFee;
    const codAmount = Math.max(0, grandTotal - totalDeposit);

    const fullAddress = [
      address.addressLine1,
      address.addressLine2,
      address.landmark ? `Near ${address.landmark}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const phoneDigits = normalizedPhone;
    const pincodeDigits = address.pincode.replace(/\D/g, '');

    const pCustomer = {
      name: customer.name.trim(),
      phone: phoneDigits,
      address: fullAddress,
      pincode: pincodeDigits,
      city: address.city.trim(),
      state: address.state.trim(),
    };

    let orderId: string | null = null;
    let orderNumber: string | null = null;

    const trackingToken = crypto.randomBytes(16).toString('hex');

    // 4. Primary: Invoke PostgreSQL RPC create_secure_order
    try {
      const supabase = createAdminClient();
      const { data: rpcData, error: rpcErr } = await supabase.rpc('create_secure_order', {
        p_customer: pCustomer,
        p_items: flattenedItems,
        p_idempotency_key: idempotencyKey || null,
      });

      if (!rpcErr && rpcData && rpcData.success) {
        orderId = rpcData.order_id;
        orderNumber = rpcData.order_number;

        // Persist tracking_token to orders or settings fallback
        const { error: tokenUpdateErr } = await supabase
          .from('orders')
          .update({ tracking_token: trackingToken })
          .eq('id', orderId);

        if (tokenUpdateErr) {
          await supabase.from('settings').upsert(
            {
              key: `tracking_token:${trackingToken}`,
              value: JSON.stringify({ order_id: orderId, order_number: orderNumber }),
              description: `Tracking token for order ${orderNumber}`,
            },
            { onConflict: 'key' }
          );
        }
      } else if (rpcErr) {
        console.warn('create_secure_order RPC note:', rpcErr.message);
      }
    } catch (e: any) {
      console.warn('Direct RPC call note:', e?.message);
    }

    // 5. Secondary: Direct Database Insert if RPC not yet deployed to remote Supabase
    if (!orderId || !orderNumber) {
      try {
        const supabase = createAdminClient();

        // Atomically claim idempotency key before creating order
        if (idempotencyKey && idempotencyKey.trim().length > 0) {
          const key = idempotencyKey.trim();

          const { error: crClaimErr } = await supabase
            .from('checkout_requests')
            .insert({
              idempotency_key: key,
              status: 'processing',
            });

          if (crClaimErr && crClaimErr.code === '23505') {
            // Concurrent request already claimed this key! Wait for completion
            for (let wait = 0; wait < 12; wait++) {
              await new Promise((r) => setTimeout(r, 250));
              const { data: existing } = await supabase
                .from('checkout_requests')
                .select('status, response_payload')
                .eq('idempotency_key', key)
                .maybeSingle();

              if (existing && existing.status === 'completed' && existing.response_payload) {
                return NextResponse.json(existing.response_payload);
              }
            }
          } else if (crClaimErr && crClaimErr.code === 'PGRST205') {
            // Table not yet migrated: use persistent database settings table for atomic claim
            const { error: setClaimErr } = await supabase
              .from('settings')
              .insert({
                key: `idemp_claim:${key}`,
                value: 'processing',
                description: 'Atomic checkout idempotency lock',
              });

            if (setClaimErr && setClaimErr.code === '23505') {
              // Another request is processing this key! Wait for completed response payload
              for (let wait = 0; wait < 12; wait++) {
                await new Promise((r) => setTimeout(r, 250));
                const { data: setRow } = await supabase
                  .from('settings')
                  .select('value')
                  .eq('key', `idemp:${key}`)
                  .maybeSingle();

                if (setRow && setRow.value) {
                  try {
                    const cached = JSON.parse(setRow.value);
                    return NextResponse.json(cached);
                  } catch {}
                }
              }
            }
          }
        }

        const rnd = Math.floor(1000 + Math.random() * 9000);
        const candidateNumber = `NAM-${rnd}`;

        let insertPayload: Record<string, any> = {
          order_number: candidateNumber,
          customer_name: customer.name.trim(),
          phone: phoneDigits,
          address: fullAddress,
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: pincodeDigits,
          total_amount: grandTotal,
          deposit_amount: totalDeposit,
          cod_amount: codAmount,
          status: 'pending_advance',
          payment_method: 'deposit_cod',
          payment_status: 'unpaid',
          tracking_token: trackingToken,
        };

        let { data: newOrder, error: insertErr } = await supabase
          .from('orders')
          .insert(insertPayload)
          .select('id, order_number')
          .single();

        // Graceful fallback if tracking_token column not yet present in remote Supabase
        if (insertErr && (insertErr.message?.includes('tracking_token') || insertErr.code === '42703')) {
          delete insertPayload.tracking_token;
          const retry = await supabase
            .from('orders')
            .insert(insertPayload)
            .select('id, order_number')
            .single();
          newOrder = retry.data;
          insertErr = retry.error;

          if (!insertErr && newOrder) {
            await supabase.from('settings').upsert(
              {
                key: `tracking_token:${trackingToken}`,
                value: JSON.stringify({ order_id: newOrder.id, order_number: newOrder.order_number }),
                description: `Tracking token for order ${newOrder.order_number}`,
              },
              { onConflict: 'key' }
            );
          }
        }

        if (!insertErr && newOrder) {
          orderId = newOrder.id;
          orderNumber = newOrder.order_number;

          // Insert order items
          const dbItems = flattenedItems.map((it) => ({
            order_id: orderId,
            product_id: it.productId,
            product_title: it.productTitle,
            product_image: it.productImage,
            is_ready_made: it.isReadyMade,
            category_label: it.categoryLabel,
            english_name: it.englishName,
            arabic_name: it.arabicName,
            ink_style: it.inkLabel,
            font_style: it.fontLabel,
            text_size: it.textSizeLabel,
            has_gift: Boolean(it.gift),
            gift_to: it.gift?.to || '',
            gift_from: it.gift?.from || '',
            gift_message: it.gift?.message || '',
            gift_price: it.gift ? 69 : 0,
            price: it.basePrice,
            deposit: it.deposit,
            cod: it.cod,
          }));

          await supabase.from('order_items').insert(dbItems);
        }
      } catch (dbErr: any) {
        console.error('Direct database insert exception:', dbErr?.message);
      }
    }

    // Zero Phantom Orders: If order could not be persisted to database, FAIL CLOSED immediately
    if (!orderId || !orderNumber) {
      console.error('Order creation failed: Database returned no order identifier.');
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to establish a secure booking with the order repository. Please verify your connection and try again.',
        },
        { status: 500 }
      );
    }

    const responsePayload: CreateOrderResponse = {
      success: true,
      orderId,
      orderNumber,
      totalAmount: grandTotal,
      depositAmount: totalDeposit,
      codAmount: codAmount,
      frameCount: totalFrames,
      status: 'pending_advance',
      trackingToken: trackingToken,
      trackingUrl: `/track?token=${trackingToken}`,
      paymentHandoff: {
        provider: 'razorpay',
        currency: 'INR',
        depositAmount: totalDeposit,
        orderId,
        orderNumber,
        customerName: customer.name.trim(),
        customerPhone: phoneDigits,
      },
    };

    // Record completed response authoritatively in database
    if (idempotencyKey && idempotencyKey.trim().length > 0) {
      const key = idempotencyKey.trim();
      const { error: crErr } = await supabase
        .from('checkout_requests')
        .upsert(
          {
            idempotency_key: key,
            order_id: orderId,
            order_number: orderNumber,
            status: 'completed',
            response_payload: responsePayload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'idempotency_key' }
        );

      if (crErr) {
        if (crErr.code === 'PGRST205') {
          // Table not yet created in Supabase: persist into database settings table
          const { error: setErr } = await supabase
            .from('settings')
            .upsert(
              {
                key: `idemp:${key}`,
                value: JSON.stringify(responsePayload),
                description: `Authoritative checkout idempotency record for ${orderNumber}`,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'key' }
            );

          if (setErr) {
            console.error('Failed to record idempotency in database settings store:', setErr.message);
            return NextResponse.json(
              { success: false, error: 'Database idempotency persistence failed. Order aborted to prevent duplicate charges.' },
              { status: 500 }
            );
          }
        } else {
          console.error('Failed to record idempotency in checkout_requests:', crErr.message);
          return NextResponse.json(
            { success: false, error: 'Database idempotency persistence failed. Order aborted to prevent duplicate charges.' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error creating order.' },
      { status: 500 }
    );
  }
}
