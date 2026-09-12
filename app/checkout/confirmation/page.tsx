'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Container } from '@/components/layout/Container';
import { formatINR } from '@/lib/cart/cart-calculations';
import { Button } from '@/components/ui';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get('orderNumber') || 'NAM-DEMO';
  const orderIdParam = searchParams.get('orderId') || '';

  const [storedOrder, setStoredOrder] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.sessionStorage.getItem('namora_last_order');
        if (raw) {
          setStoredOrder(JSON.parse(raw));
        }
      } catch {
        // Ignored
      }
    }
  }, []);

  const orderNumber = storedOrder?.orderNumber || orderNumberParam;
  const grandTotal = storedOrder?.totalAmount ? formatINR(storedOrder.totalAmount) : '₹499';
  const depositAmount = storedOrder?.depositAmount ? formatINR(storedOrder.depositAmount) : '₹49';
  const codAmount = storedOrder?.codAmount ? formatINR(storedOrder.codAmount) : '₹450';
  const frameCount = storedOrder?.frameCount || 1;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-2xl mx-auto shadow-luxury">
          ✓
        </div>
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-widest text-namora-gold">
            Order Reference Confirmed
          </span>
          <h1 className="font-hero text-2xl sm:text-3xl font-bold text-namora-ink">
            Your Bespoke Frame is Booked!
          </h1>
          <p className="text-xs sm:text-sm text-namora-muted max-w-md mx-auto leading-relaxed">
            Thank you for placing your order with NAMORA. Your physical master frame order has been securely registered in our production queue.
          </p>
        </div>
      </div>

      {/* Reference Card */}
      <div className="p-6 rounded-2xl border border-namora-line bg-namora-card space-y-4 shadow-luxury">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-namora-line-soft">
          <div>
            <span className="text-[10px] uppercase font-mono text-namora-muted block">
              Official Order Number
            </span>
            <strong className="text-xl font-mono text-namora-gold tracking-wide">
              {orderNumber}
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-800/40">
              Status: Pending Advance Deposit
            </span>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-namora-line-soft bg-namora-soft/60 text-center font-mono">
          <div>
            <span className="text-[10px] text-namora-muted uppercase block">
              Order Total
            </span>
            <strong className="text-sm sm:text-base text-namora-ink">
              {grandTotal}
            </strong>
          </div>
          <div className="border-y sm:border-y-0 sm:border-x border-namora-line-soft py-2 sm:py-0">
            <span className="text-[10px] text-emerald-400 uppercase block font-semibold">
              Online Deposit
            </span>
            <strong className="text-sm sm:text-base text-emerald-400">
              {depositAmount}
            </strong>
            <span className="text-[9px] text-namora-muted block">({frameCount} × ₹49)</span>
          </div>
          <div>
            <span className="text-[10px] text-namora-muted uppercase block">
              COD on Delivery
            </span>
            <strong className="text-sm sm:text-base text-namora-ink">
              {codAmount}
            </strong>
          </div>
        </div>

        {/* Phase 9 Payment Handoff Notice */}
        <div className="p-4 rounded-xl border border-namora-gold/30 bg-namora-gold/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-namora-gold font-hero">
            <span>🔒 Secure Razorpay Deposit Payment Gateway</span>
          </div>
          <p className="text-xs text-namora-ink-soft leading-relaxed">
            To initiate custom calligraphy artisan engraving, please complete the ₹49/frame booking deposit.
            Payment integration is scheduled for activation in Phase 9.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              fullWidth
              size="md"
              onClick={() => alert('Razorpay Deposit Payment execution will be activated in Phase 9.')}
              className="shadow-luxury font-bold text-xs"
            >
              Proceed to Pay {depositAmount} Deposit (Phase 9 Razorpay Handoff) &rarr;
            </Button>
          </div>
        </div>

        {/* Shipping & Delivery Details */}
        {storedOrder?.address && (
          <div className="pt-3 border-t border-namora-line-soft space-y-1 text-xs">
            <span className="text-[10px] uppercase font-mono text-namora-muted block">
              Delivery Destination
            </span>
            <p className="font-medium text-namora-ink">
              {storedOrder.customerName} ({storedOrder.customerPhone})
            </p>
            <p className="text-namora-muted leading-relaxed">
              {storedOrder.address.addressLine1}
              {storedOrder.address.addressLine2 ? `, ${storedOrder.address.addressLine2}` : ''}
              {storedOrder.address.landmark ? `, Near ${storedOrder.address.landmark}` : ''},{' '}
              {storedOrder.address.city}, {storedOrder.address.state} — {storedOrder.address.pincode}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Link href={`/track-order?order=${encodeURIComponent(orderNumber)}`} className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            🔍 Track Order Status
          </Button>
        </Link>

        <Link href="/" className="w-full sm:w-auto">
          <Button variant="secondary" size="sm" className="w-full sm:w-auto">
            &larr; Return to Storefront Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <PageShell>
      <Container width="default" className="py-12 sm:py-16">
        <Suspense
          fallback={
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-namora-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-namora-muted mt-3">Loading confirmation...</p>
            </div>
          }
        >
          <ConfirmationContent />
        </Suspense>
      </Container>
    </PageShell>
  );
}
