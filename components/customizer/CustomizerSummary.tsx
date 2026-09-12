'use client';

import React, { useState, useEffect } from 'react';
import { GiftPackagingState } from './state/customization-types';
import { Button, Checkbox, Field, Input, Textarea } from '@/components/ui';
import { CONTACT_DATA } from '@/lib/storefront-data';

interface CustomizerSummaryProps {
  gift: GiftPackagingState;
  onChangeGift: (gift: GiftPackagingState) => void;
  pincode: string;
  pincodeStatus: 'idle' | 'checking' | 'serviceable' | 'unserviceable';
  onChangePincode: (pin: string) => void;
  onCheckPincode: (pin: string) => void;
  onAddToCart: () => void;
  onWhatsAppOrder: () => void;
}

export function CustomizerSummary({
  gift,
  onChangeGift,
  pincode,
  pincodeStatus,
  onChangePincode,
  onCheckPincode,
  onAddToCart,
  onWhatsAppOrder,
}: CustomizerSummaryProps) {
  // Estimated dates
  const [dispatchDate, setDispatchDate] = useState('Tomorrow');
  const [deliveryDate, setDeliveryDate] = useState('3–5 Days');

  useEffect(() => {
    const now = new Date();
    const d1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const d2 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const opt: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    setDispatchDate(d1.toLocaleDateString('en-IN', opt));
    setDeliveryDate(d2.toLocaleDateString('en-IN', opt));
  }, []);

  const totalCost = 499 + (gift.isGift ? gift.cost : 0);
  const codBalance = totalCost - 49;

  return (
    <div className="space-y-4 pt-2">
      {/* Pricing Banner */}
      <div className="p-4 rounded-xl border border-namora-line bg-namora-card space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-mono tracking-wider text-namora-muted">
            All-Inclusive Price
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-hero text-namora-ink">
              ₹{totalCost}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-namora-gold pt-1 border-t border-namora-line-soft">
          <span>Booking Deposit: ₹49</span>
          <span className="text-namora-muted">&bull;</span>
          <span className="text-namora-ink-soft">COD Balance on Delivery: ₹{codBalance}</span>
        </div>

        <p className="text-[11px] text-namora-muted font-light leading-snug">
          Personalized A4 Wall Frame &bull; Authentic Persian artwork with bespoke calligraphy &amp; Free Pan-India Delivery.
        </p>
      </div>

      {/* Luxury Gift Packaging Addon (+₹69) */}
      <div className="p-4 rounded-xl border border-namora-line bg-namora-card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Checkbox
            id="gift-packaging-toggle"
            checked={gift.isGift}
            onChange={(e) =>
              onChangeGift({
                ...gift,
                isGift: e.target.checked,
              })
            }
            label="🎁 Send as a Luxury Gift? (+₹69)"
          />
          <span className="text-xs font-mono font-semibold text-namora-gold flex-shrink-0">
            +₹69
          </span>
        </div>

        <p className="text-[11px] text-namora-muted font-light pl-6">
          Includes luxury satin ribbon wrap, royal wax seal &amp; personalized greeting note card.
        </p>

        {gift.isGift && (
          <div className="pt-3 border-t border-namora-line-soft space-y-3 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="To (Recipient Name)">
                <Input
                  value={gift.to}
                  onChange={(e) => onChangeGift({ ...gift, to: e.target.value })}
                  placeholder="e.g. Ayesha"
                />
              </Field>
              <Field label="From (Your Name)">
                <Input
                  value={gift.from}
                  onChange={(e) => onChangeGift({ ...gift, from: e.target.value })}
                  placeholder="e.g. Tariq"
                />
              </Field>
            </div>
            <Field label="Handwritten Note Message">
              <Textarea
                rows={2}
                value={gift.message}
                onChange={(e) => onChangeGift({ ...gift, message: e.target.value })}
                placeholder="Wishing you a lifetime of joy, love, and barakah..."
              />
            </Field>
          </div>
        )}
      </div>

      {/* Dispatch & Delivery Estimator */}
      <div className="p-4 rounded-xl border border-namora-line bg-namora-soft/60 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MADE TO ORDER</span>
          </div>
          <span className="text-[11px] text-namora-muted font-mono">
            Pan-India Express Air Shipping
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg border border-namora-line-soft bg-namora-card text-center text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-namora-muted block">
              Handcrafted &amp; Dispatched
            </span>
            <strong className="text-namora-gold font-mono">{dispatchDate}</strong>
          </div>
          <div className="border-l border-namora-line-soft">
            <span className="text-[10px] uppercase font-mono text-namora-muted block">
              Free Delivery
            </span>
            <strong className="text-namora-ink font-mono">{deliveryDate}</strong>
          </div>
        </div>

        {/* Pincode Checker */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Input
              value={pincode}
              onChange={(e) => onChangePincode(e.target.value)}
              placeholder="Enter Pincode (e.g. 110001)"
              maxLength={6}
              className="text-xs h-9"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onCheckPincode(pincode)}
            className="h-9"
          >
            Check
          </Button>
        </div>

        {pincodeStatus === 'serviceable' && (
          <p className="text-xs text-emerald-400 font-mono">
            ✓ Available for Express Air Delivery with ₹49 Deposit &amp; COD.
          </p>
        )}
        {pincodeStatus === 'unserviceable' && (
          <p className="text-xs text-red-400 font-mono">
            ✗ Please enter a valid 6-digit Indian PIN code.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={onAddToCart}
          className="shadow-luxury font-bold tracking-wide"
        >
          Add to Cart 🛒 (Reserve with ₹49)
        </Button>

        <button
          type="button"
          onClick={onWhatsAppOrder}
          className="w-full py-3 px-4 rounded-md bg-[#1B382B] hover:bg-[#234737] text-emerald-200 border border-emerald-700/50 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition"
        >
          <span className="text-base">✆</span>
          <span>Order via WhatsApp (1-Click)</span>
        </button>
      </div>

      {/* Risk-free Guarantee */}
      <div className="p-3 rounded-lg border border-namora-line-soft bg-namora-card/60 flex items-start gap-3 text-xs text-namora-muted font-light leading-relaxed">
        <span className="text-xl">🛡️</span>
        <div>
          <strong className="text-namora-ink block font-medium">
            100% Risk-Free Transit Guarantee
          </strong>
          <span>
            Damaged or incorrect? We ship a free remake immediately. You only pay the balance ₹{codBalance} upon safe delivery.
          </span>
        </div>
      </div>
    </div>
  );
}
