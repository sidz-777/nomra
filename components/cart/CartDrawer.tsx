'use client';

import React, { useEffect, useId } from 'react';
import { useCart } from './CartContext';
import { CartItemCard } from './CartItemCard';
import { GiftOptions } from './GiftOptions';
import { formatINR } from '@/lib/cart/cart-calculations';
import { getEstimatedDispatchDates, buildCartWhatsAppUrl } from '@/lib/cart/cart-utils';
import { Button } from '@/components/ui';

export function CartDrawer() {
  const {
    items,
    gift,
    isOpen,
    totals,
    removeItem,
    updateQuantity,
    setGiftOptions,
    toggleCart,
  } = useCart();

  const titleId = useId();
  const { dispatchDate, deliveryDate } = getEstimatedDispatchDates();

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        toggleCart(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleCart]);

  if (!isOpen) return null;

  const handleAddAnotherFrame = () => {
    toggleCart(false);
    const element = document.getElementById('create');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCheckoutPlaceholder = () => {
    alert('Secure Checkout & Razorpay deposit flow will be activated in Phase 8.');
  };

  const whatsAppUrl = buildCartWhatsAppUrl(items, gift, totals);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleCart(false);
      }}
    >
      <div className="relative w-full max-w-lg h-full bg-namora-bg border-l border-namora-line shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-namora-line bg-namora-card/60">
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="font-hero text-lg sm:text-xl font-bold text-namora-ink">
              Your Cart
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-namora-gold/20 text-namora-gold border border-namora-gold/40">
              {totals.totalFrames} {totals.totalFrames === 1 ? 'Frame' : 'Frames'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleCart(false)}
            aria-label="Close cart drawer"
            className="w-8 h-8 rounded-full border border-namora-line flex items-center justify-center text-namora-muted hover:text-namora-ink hover:border-namora-gold transition"
          >
            &times;
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-namora-soft border border-namora-line flex items-center justify-center text-3xl">
                🖼️
              </div>
              <div className="space-y-1">
                <h3 className="font-hero text-base sm:text-lg font-medium text-namora-ink">
                  Your Cart is Empty
                </h3>
                <p className="text-xs text-namora-muted max-w-xs mx-auto leading-relaxed">
                  Personalize an authentic Persian frame to begin your handcrafted order.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleAddAnotherFrame}
                className="shadow-luxury mt-2"
              >
                Customize a Frame Now &rarr;
              </Button>
            </div>
          ) : (
            /* Items List */
            <>
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onRemove={removeItem}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
              </div>

              {/* Add Another Frame CTA */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddAnotherFrame}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-namora-gold/40 hover:border-namora-gold text-namora-gold bg-namora-soft/40 hover:bg-namora-soft transition text-xs font-mono font-medium flex items-center justify-center gap-1.5"
                >
                  <span>+ Add Another Frame (₹499)</span>
                </button>
              </div>

              {/* Order-Level Luxury Gift Packaging */}
              <div className="pt-2">
                <GiftOptions gift={gift} onChange={setGiftOptions} />
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer (Summary & Actions) */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-namora-line bg-namora-card space-y-3 shadow-inner">
            {/* Dispatch Pill */}
            <div className="p-2.5 rounded-lg border border-namora-line bg-namora-soft/80 flex items-center gap-2.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-namora-ink truncate">
                  ⚡ Dispatches by <strong className="text-namora-gold">{dispatchDate}</strong>
                </div>
                <div className="text-[10px] text-namora-muted truncate">
                  Free Pan-India Delivery by <strong className="text-namora-ink-soft">{deliveryDate}</strong>
                </div>
              </div>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-namora-muted">
                <span>Total Frame Price ({totals.totalFrames}):</span>
                <span className="text-namora-ink font-semibold">{formatINR(totals.subtotal)}</span>
              </div>

              {gift.enabled && (
                <div className="flex justify-between text-namora-gold">
                  <span>🎁 Luxury Gift Packaging:</span>
                  <span className="font-semibold">+₹69</span>
                </div>
              )}

              <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-namora-line-soft">
                <span>Pay Advance Today ({totals.totalFrames} × ₹49):</span>
                <span>{formatINR(totals.totalDeposit)}</span>
              </div>

              <div className="flex justify-between text-namora-muted text-[11px]">
                <span>Due on Delivery (COD balance):</span>
                <span>{formatINR(totals.totalCod)}</span>
              </div>
            </div>

            {/* Checkout Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleCheckoutPlaceholder}
                className="shadow-luxury font-bold tracking-wide"
              >
                Pay {formatINR(totals.totalDeposit)} Deposit Now ({totals.totalFrames} {totals.totalFrames === 1 ? 'Frame' : 'Frames'})
              </Button>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-md bg-[#1B382B] hover:bg-[#234737] text-emerald-200 border border-emerald-700/50 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition select-none"
              >
                <span className="text-base">✆</span>
                <span>Complete Order via WhatsApp ({totals.totalFrames} {totals.totalFrames === 1 ? 'Frame' : 'Frames'})</span>
              </a>
            </div>

            {/* Guarantee Badge */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-namora-line-soft bg-namora-soft/40 text-[11px] text-namora-muted leading-relaxed">
              <span className="text-base leading-none">🛡️</span>
              <div>
                <strong className="text-namora-ink font-medium">Zero-Risk Booking:</strong> ₹49/frame deposit confirms dispatch. Balance is COD on delivery. Free remake if damaged in transit.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
