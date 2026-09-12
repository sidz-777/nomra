'use client';

import React from 'react';
import Image from 'next/image';
import { CartItem } from '@/lib/cart/cart-types';
import { formatINR } from '@/lib/cart/cart-calculations';

interface CartItemCardProps {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
}

export function CartItemCard({ item, onRemove, onUpdateQuantity }: CartItemCardProps) {
  const isReady = item.productType === 'ready_stock';
  const custom = item.customization;

  return (
    <div className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-namora-line bg-namora-card/80 hover:border-namora-gold/40 transition-colors">
      {/* Thumbnail */}
      <div className="relative w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 rounded-md overflow-hidden border border-namora-line bg-namora-soft">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Header Row: Title & Remove */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-semibold font-hero text-namora-ink truncate">
              {item.title}
            </h4>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${item.title} from cart`}
              className="text-namora-muted hover:text-red-400 p-0.5 transition -mt-1 -mr-1 text-base leading-none"
            >
              &times;
            </button>
          </div>

          {/* Subtitle / Personalization Breakdown */}
          {isReady ? (
            <div className="mt-1 space-y-0.5">
              <span className="inline-block text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                ⚡ Ready-to-Ship Edition
              </span>
              <p className="text-[11px] text-namora-muted truncate">
                {item.categoryLabel || 'In Stock'} · Standard A4 Frame · 24h Courier
              </p>
            </div>
          ) : custom ? (
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-namora-ink font-serif">
                  {custom.englishName}
                </span>
                {custom.arabicName && custom.arabicName !== custom.englishName && (
                  <span
                    dir="rtl"
                    className="font-arabic text-sm text-namora-gold"
                  >
                    {custom.arabicName}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-namora-muted">
                <span>{custom.finishLabel}</span> &bull; <span>{custom.fontLabel}</span> &bull; <span>A4</span>
              </p>
            </div>
          ) : null}
        </div>

        {/* Pricing & Quantity Controls Row */}
        <div className="flex items-end justify-between pt-2 border-t border-namora-line-soft mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs sm:text-sm font-bold font-mono text-namora-ink">
              {formatINR(item.unitPrice * item.quantity)}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-800/30">
              {formatINR(item.depositPrice * item.quantity)} deposit
            </span>
          </div>

          {/* Quantity Controls (for ready stock items) */}
          {isReady ? (
            <div className="flex items-center gap-1.5 bg-namora-soft border border-namora-line rounded-md p-0.5">
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                aria-label="Decrease quantity"
                className="w-5 h-5 flex items-center justify-center text-xs text-namora-ink hover:text-namora-gold transition"
              >
                -
              </button>
              <span className="text-[11px] font-mono font-medium px-1 text-namora-ink min-w-[16px] text-center">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                aria-label="Increase quantity"
                className="w-5 h-5 flex items-center justify-center text-xs text-namora-ink hover:text-namora-gold transition"
              >
                +
              </button>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-namora-muted">
              Qty: 1
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
