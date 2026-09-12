'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CartItem, CartGiftOptions, CartTotals } from '@/lib/cart/cart-types';
import { formatINR } from '@/lib/cart/cart-calculations';
import { getEstimatedDispatchDates } from '@/lib/cart/cart-utils';
import { Button } from '@/components/ui';

interface OrderReviewSummaryProps {
  items: CartItem[];
  gift: CartGiftOptions;
  totals: CartTotals;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function OrderReviewSummary({
  items,
  gift,
  totals,
  isSubmitting,
  onSubmit,
}: OrderReviewSummaryProps) {
  const { dispatchDate, deliveryDate } = getEstimatedDispatchDates();

  return (
    <div className="space-y-6">
      <div className="p-5 sm:p-6 rounded-2xl border border-namora-line bg-namora-card space-y-4 shadow-luxury">
        <div className="flex items-center justify-between pb-3 border-b border-namora-line-soft">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-namora-gold/20 text-namora-gold text-xs font-mono font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="font-hero text-base sm:text-lg font-medium text-namora-ink">
              Order Summary &amp; Review
            </h3>
          </div>
          <span className="text-xs font-mono text-namora-gold bg-namora-gold/10 px-2.5 py-0.5 rounded-full border border-namora-gold/30">
            {totals.totalFrames} {totals.totalFrames === 1 ? 'Frame' : 'Frames'}
          </span>
        </div>

        {/* Items List */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {items.map((item) => {
            const isReady = item.productType === 'ready_stock';
            const custom = item.customization;

            return (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-xl border border-namora-line-soft bg-namora-soft/50"
              >
                <div className="relative w-14 h-16 rounded-md overflow-hidden border border-namora-line bg-namora-soft flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold font-hero text-namora-ink truncate">
                      {item.title}
                    </h4>

                    {isReady ? (
                      <span className="inline-block text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded mt-0.5">
                        ⚡ Ready-to-Ship Edition
                      </span>
                    ) : custom ? (
                      <div className="mt-0.5 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-namora-ink font-serif">
                            {custom.englishName}
                          </span>
                          {custom.arabicName && custom.arabicName !== custom.englishName && (
                            <span dir="rtl" className="font-arabic text-xs text-namora-gold">
                              {custom.arabicName}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-namora-muted">
                          {custom.finishLabel} &bull; {custom.fontLabel} &bull; A4 Size
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-baseline justify-between pt-1 text-xs font-mono">
                    <span className="text-namora-muted text-[11px]">
                      Qty: {item.quantity}
                    </span>
                    <span className="font-semibold text-namora-ink">
                      {formatINR(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gift Packaging Breakdown */}
        {gift.enabled && (
          <div className="p-3 rounded-xl border border-namora-gold/30 bg-namora-gold/5 space-y-1 text-xs">
            <div className="flex justify-between font-mono font-medium text-namora-gold">
              <span>🎁 Luxury Gift Packaging &amp; Note:</span>
              <span>+₹69</span>
            </div>
            {gift.to && (
              <p className="text-[11px] text-namora-muted">
                To: <strong className="text-namora-ink">{gift.to}</strong>
                {gift.from ? ` &bull; From: ${gift.from}` : ''}
              </p>
            )}
            {gift.greetingNote && (
              <p className="text-[11px] italic text-namora-muted line-clamp-2">
                &ldquo;{gift.greetingNote}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Dispatch Date Pill */}
        <div className="p-2.5 rounded-lg border border-namora-line bg-namora-soft flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <div className="text-[11px] text-namora-muted">
            ⚡ Dispatches by <strong className="text-namora-gold">{dispatchDate}</strong> &bull; Free Pan-India Delivery by <strong className="text-namora-ink">{deliveryDate}</strong>
          </div>
        </div>

        {/* Totals Breakdown */}
        <div className="space-y-2 pt-2 border-t border-namora-line font-mono text-xs">
          <div className="flex justify-between text-namora-muted">
            <span>Item Subtotal ({totals.totalFrames} frames):</span>
            <span className="text-namora-ink font-semibold">{formatINR(totals.subtotal)}</span>
          </div>

          {gift.enabled && (
            <div className="flex justify-between text-namora-gold">
              <span>Luxury Gift Packaging:</span>
              <span className="font-semibold">+₹69</span>
            </div>
          )}

          <div className="flex justify-between text-namora-muted">
            <span>Pan-India Air Courier:</span>
            <span className="text-emerald-400 font-semibold uppercase">Free</span>
          </div>

          <div className="flex justify-between text-sm sm:text-base font-bold text-namora-ink pt-2 border-t border-namora-line-soft">
            <span>Grand Total:</span>
            <span className="text-namora-gold font-hero">{formatINR(totals.grandTotal)}</span>
          </div>

          <div className="flex justify-between text-xs sm:text-sm font-bold text-emerald-400 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
            <span>Online Booking Deposit (Now):</span>
            <span>{formatINR(totals.totalDeposit)} ({totals.totalFrames} × ₹49)</span>
          </div>

          <div className="flex justify-between text-xs text-namora-muted pt-1">
            <span>Balance due on Delivery (COD):</span>
            <span className="font-semibold text-namora-ink">{formatINR(totals.totalCod)}</span>
          </div>
        </div>

        {/* Submission Button */}
        <div className="pt-2 space-y-2">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="shadow-luxury font-bold tracking-wide"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Securing Order...
              </span>
            ) : (
              `Confirm Order & Book with ${formatINR(totals.totalDeposit)} Deposit →`
            )}
          </Button>

          <p className="text-[11px] text-center text-namora-muted font-light leading-relaxed">
            ₹49/frame deposit secures your order dispatch. The balance ₹{totals.totalCod} is payable in cash/UPI upon doorstep delivery.
          </p>
        </div>

        {/* Risk-free Guarantee */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-namora-line-soft bg-namora-soft/40 text-[11px] text-namora-muted leading-relaxed">
          <span className="text-base leading-none">🛡️</span>
          <div>
            <strong className="text-namora-ink font-medium">100% Transit Guarantee:</strong> Free remake if damaged in transit. You only pay balance on safe arrival.
          </div>
        </div>
      </div>
    </div>
  );
}
