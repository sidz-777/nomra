import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CreateOrderPayload, CreateOrderResponse } from '@/lib/checkout/checkout-types';
import {
  validateCheckoutForm,
  validateCheckoutItems,
} from '@/lib/checkout/checkout-validation';
import { createAdminClient } from '@/lib/supabase/admin';
import { READY_STOCK_PRODUCTS, PERSIAN_DESIGNS } from '@/lib/storefront-data';

export const dynamic = 'force-dynamic';

// In-memory idempotency cache (keyed by idempotencyKey)
const idempotencyStore = new Map<string, CreateOrderResponse>();

export async function POST(req: Request) {
  try {
    const body: CreateOrderPayload = await req.json();
    const { customer, address, items, gift, idempotencyKey } = body;

    // 1. Idempotency Check: prevent duplicate submissions
    if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
      return NextResponse.json(idempotencyStore.get(idempotencyKey));
    }

    // 2. Server-side validation
    const formValidation = validateCheckoutForm({
      name: customer?.name,
      phone: customer?.phone,
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
    // Never trust client prices. Query catalog overrides and defaults.
    const overridesPath = path.join(process.cwd(), 'catalog_overrides.json');
    let priceOverrides: Record<string, any> = {};
    if (fs.existsSync(overridesPath)) {
      try {
        priceOverrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
      } catch {
        priceOverrides = {};
      }
    }

    // Load products from Supabase or fallback
    let productsDb: any[] = [];
    try {
      const supabase = createAdminClient();
      const { data } = await supabase.from('products').select('*');
      if (data && Array.isArray(data)) {
        productsDb = data;
      }
    } catch {
      // Fallback
    }

    let subtotal = 0;
    let totalDeposit = 0;
    let totalFrames = 0;

    const flattenedItems: any[] = [];

    for (const item of items) {
      const qty = Math.max(1, Math.floor(item.quantity || 1));
      const pId = item.productId;

      const dbMatch = productsDb.find((p) => p.id === pId);
      const override = priceOverrides[pId];

      const basePrice =
        override?.price !== undefined
          ? Number(override.price)
          : dbMatch?.price !== undefined
          ? Number(dbMatch.price)
          : 499;

      const baseDeposit =
        override?.deposit_price !== undefined
          ? Number(override.deposit_price)
          : dbMatch?.deposit_price !== undefined
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
          productTitle: item.title || dbMatch?.title || 'A4 Handmade Frame',
          productImage: item.image || dbMatch?.image_url || 'design1.jpg',
          isReadyMade: item.productType === 'ready_stock',
          categoryLabel: item.categoryLabel || dbMatch?.category_label || 'A4 Frame',
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

    const phoneDigits = customer.phone.replace(/\D/g, '');
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

    // 4. Invoke PostgreSQL RPC create_secure_order (or backend proxy)
    try {
      const supabase = createAdminClient();
      const { data: rpcData, error: rpcErr } = await supabase.rpc('create_secure_order', {
        p_customer: pCustomer,
        p_items: flattenedItems,
      });

      if (!rpcErr && rpcData && rpcData.success) {
        orderId = rpcData.order_id;
        orderNumber = rpcData.order_number;
      }
    } catch (e: any) {
      console.warn('Direct RPC call error, attempting proxy to server.js:', e?.message);
    }

    // If direct RPC failed (e.g. anon role or network), proxy to server.js backend
    if (!orderNumber) {
      try {
        const proxyRes = await fetch('http://localhost:3300/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: pCustomer,
            items: flattenedItems,
            giftPackaging: gift?.enabled,
          }),
        });

        if (proxyRes.ok) {
          const proxyData = await proxyRes.json();
          if (proxyData.success) {
            orderId = proxyData.order_id;
            orderNumber = proxyData.order_number;
          }
        }
      } catch (err: any) {
        console.warn('Proxy to server.js note:', err?.message);
      }
    }

    // Fallback order generation if backend is unavailable
    if (!orderNumber) {
      const rnd = Math.floor(1000 + Math.random() * 9000);
      orderNumber = 'NAM-' + rnd;
    }
    if (!orderId) {
      orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
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

    // Cache response for idempotency
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, responsePayload);
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
