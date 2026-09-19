'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatINR } from '@/lib/cart/cart-calculations';
import { Button } from '@/components/ui';
import { RazorpayPaymentButton } from '@/components/checkout/RazorpayPaymentButton';
import { VerifyPaymentResponse } from '@/lib/payments/types';

export function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get('orderNumber') || 'NAM-DEMO';
  const orderIdParam = searchParams.get('orderId') || '';
  const tokenParam = searchParams.get('token') || '';

  const [storedOrder, setStoredOrder] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid'>('unpaid');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.sessionStorage.getItem('namora_last_order');
        if (raw) {
          const parsed = JSON.parse(raw);
          setStoredOrder(parsed);
          if (
            parsed.status === 'advance_paid' ||
            parsed.payment_status === 'deposit_received' ||
            parsed.payment_status === 'paid'
          ) {
            setPaymentStatus('paid');
            if (parsed.razorpay_payment_id) {
              setPaymentId(parsed.razorpay_payment_id);
            }
          }
        }
      } catch (err) {
        console.warn('Session parse note:', err);
      }
    }
  }, []);

  const orderNumber = storedOrder?.orderNumber || orderNumberParam;
  const orderId = storedOrder?.orderId || orderIdParam;
  const trackingToken = storedOrder?.tracking_token || tokenParam || '';
  const grandTotal = storedOrder ? formatINR(storedOrder.totals?.grandTotal || 499) : '₹499';
  const rawDepositAmount = storedOrder?.totals?.totalDeposit || 49;
  const depositAmount = formatINR(rawDepositAmount);
  const codAmount = storedOrder ? formatINR(storedOrder.totals?.totalCod || 450) : '₹450';
  const frameCount = storedOrder?.totals?.totalFrames || 1;
  const items = storedOrder?.items || [];

  const handlePaymentSuccess = (verification: VerifyPaymentResponse) => {
    setPaymentStatus('paid');
    if (verification.payment_id) {
      setPaymentId(verification.payment_id);
    }
    if (typeof window !== 'undefined' && storedOrder) {
      try {
        const updated = {
          ...storedOrder,
          status: 'advance_paid',
          payment_status: 'deposit_received',
          razorpay_payment_id: verification.payment_id,
          tracking_token: (verification as any).tracking_token || storedOrder.tracking_token,
        };
        window.sessionStorage.setItem('namora_last_order', JSON.stringify(updated));
        setStoredOrder(updated);
      } catch (e) {
        console.warn('Session update note:', e);
      }
    }
  };

  const trackingHref = trackingToken
    ? `/track?token=${encodeURIComponent(trackingToken)}`
    : `/track?orderNumber=${encodeURIComponent(orderNumber)}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Head Banner */}
      <div className="text-center space-y-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto shadow-luxury transition-all duration-500 ${
            paymentStatus === 'paid'
              ? 'bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300'
              : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
          }`}
        >
          {paymentStatus === 'paid' ? '🛡️' : '✓'}
        </div>
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-widest text-namora-gold">
            {paymentStatus === 'paid' ? 'Deposit Verified & Production Queued' : 'Order Registered in System'}
          </span>
          <h1 className="font-hero text-2xl sm:text-3xl font-bold text-namora-ink">
            {paymentStatus === 'paid'
              ? 'Deposit Confirmed — Handcrafting Initiated!'
              : 'Your Bespoke Frame is Reserved!'}
          </h1>
          <p className="text-xs sm:text-sm text-namora-muted max-w-md mx-auto leading-relaxed">
            {paymentStatus === 'paid'
              ? 'Thank you! Your advance booking deposit has been cryptographically verified by Razorpay. Master calligraphy artisans are now preparing your physical frame.'
              : 'Thank you for placing your order with NAMORA. Please complete the advance booking deposit below to initiate custom calligraphy crafting.'}
          </p>
        </div>
      </div>

      {/* Reference Card */}
      <div className="p-6 rounded-2xl border border-namora-line bg-namora-card space-y-4 shadow-luxury">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-namora-line-soft">
          <div>
            <span className="text-[10px] uppercase font-mono text-namora-muted block">
              Official Order Reference
            </span>
            <strong className="text-xl font-mono text-namora-gold tracking-wide">
              {orderNumber}
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            {paymentStatus === 'paid' ? (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-600/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Status: Advance Deposit Verified
              </span>
            ) : (
              <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-full border border-amber-800/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                Status: Pending Advance Deposit
              </span>
            )}
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
              {paymentStatus === 'paid' ? 'Deposit Paid' : 'Deposit Due Now'}
            </span>
            <strong className="text-sm sm:text-base text-emerald-400">
              {depositAmount}
            </strong>
            <span className="text-[9px] text-namora-muted block">({frameCount} × ₹49 booking fee)</span>
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

        {/* Payment Confirmation Badge */}
        {paymentStatus === 'paid' ? (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold font-hero flex items-center gap-1.5">
                <span>🛡️</span> Razorpay Transaction Confirmed
              </span>
              {paymentId && (
                <span className="font-mono text-[11px] text-zinc-400">
                  ID: {paymentId}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Your online booking deposit of <strong className="text-emerald-300">{depositAmount}</strong> has been secured. 
              The remaining balance of <strong className="text-white">{codAmount}</strong> will be collected in cash or UPI by the delivery courier when your physical handmade frame arrives at your doorstep.
            </p>
            <div className="pt-1 text-[11px] text-zinc-400 font-mono flex items-center gap-2">
              <span>Next Milestone:</span>
              <span className="text-namora-gold">Artisan Calligraphy Composition (24–48 Hours)</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-namora-gold/30 bg-namora-gold/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-namora-gold font-hero">
              <span>🔒 Pay Advance Deposit to Begin Handcrafting</span>
            </div>
            <p className="text-xs text-namora-ink-soft leading-relaxed">
              To prevent uncollected custom parcels, each bespoke frame requires a minimal ₹49 booking deposit. 
              The remaining balance is paid on Cash on Delivery.
            </p>
            <RazorpayPaymentButton
              orderId={orderId}
              orderNumber={orderNumber}
              depositAmount={rawDepositAmount}
              customerName={storedOrder?.customerName}
              customerPhone={storedOrder?.customerPhone}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        )}

        {/* Itemized Personalized Specs Summary */}
        {items.length > 0 && (
          <div className="pt-3 border-t border-namora-line-soft space-y-2 text-xs">
            <span className="text-[10px] uppercase font-mono text-namora-muted block">
              Bespoke Frame Details ({items.length})
            </span>
            <div className="divide-y divide-namora-line-soft">
              {items.map((it: any, idx: number) => (
                <div key={idx} className="py-2 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-namora-ink">{it.title || it.productTitle || 'Handcrafted Frame'}</span>
                    <div className="text-[11px] text-namora-gold">
                      {it.customization?.englishName && <span>Name: {it.customization.englishName} </span>}
                      {it.customization?.arabicName && <span>({it.customization.arabicName}) </span>}
                      {it.customization?.finishLabel && <span className="text-namora-muted">· {it.customization.finishLabel}</span>}
                    </div>
                  </div>
                  <span className="font-mono text-namora-ink">Qty: {it.quantity || 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shipping & Delivery Details Summary */}
        {storedOrder?.address && (
          <div className="pt-3 border-t border-namora-line-soft space-y-1 text-xs">
            <span className="text-[10px] uppercase font-mono text-namora-muted block">
              Delivery Destination Summary
            </span>
            <p className="font-medium text-namora-ink">
              {storedOrder.customerName}
            </p>
            <p className="text-namora-muted leading-relaxed">
              {storedOrder.address.city}, {storedOrder.address.state} — {storedOrder.address.pincode}
            </p>
          </div>
        )}
      </div>

      {/* Expected Next Steps Stepper Preview */}
      <div className="p-4 rounded-xl border border-namora-line bg-namora-card space-y-2 text-xs">
        <span className="text-[10px] uppercase font-mono text-namora-muted block">
          What Happens Next?
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
          <div className="p-2.5 rounded-lg bg-namora-soft border border-namora-line-soft">
            <span className="text-namora-gold block font-semibold">1. Artisan Calligraphy</span>
            <span className="text-namora-muted text-[10px]">Hand-composed on archival media</span>
          </div>
          <div className="p-2.5 rounded-lg bg-namora-soft border border-namora-line-soft">
            <span className="text-namora-gold block font-semibold">2. A4 Frame Assembly</span>
            <span className="text-namora-muted text-[10px]">Mounted, acrylic sealed &amp; packaged</span>
          </div>
          <div className="p-2.5 rounded-lg bg-namora-soft border border-namora-line-soft">
            <span className="text-namora-gold block font-semibold">3. Express Air Courier</span>
            <span className="text-namora-muted text-[10px]">Doorstep delivery with COD collection</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Link href={trackingHref} className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto border-namora-gold text-namora-gold hover:bg-namora-gold hover:text-black">
            🔍 Track Live Production with Secure Token &rarr;
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
