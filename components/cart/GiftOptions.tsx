'use client';

import React from 'react';
import { CartGiftOptions } from '@/lib/cart/cart-types';
import { Checkbox, Field, Input, Textarea } from '@/components/ui';

interface GiftOptionsProps {
  gift: CartGiftOptions;
  onChange: (options: Partial<CartGiftOptions>) => void;
}

export function GiftOptions({ gift, onChange }: GiftOptionsProps) {
  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-namora-line bg-namora-card/60 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Checkbox
          id="cart-gift-toggle"
          checked={gift.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          label="🎁 Send as a Luxury Gift? (+₹69)"
        />
        <span className="text-xs font-mono font-semibold text-namora-gold flex-shrink-0">
          +₹69
        </span>
      </div>

      <p className="text-[11px] text-namora-muted font-light pl-6">
        Order-level luxury upgrade: Satin ribbon wrap, royal wax seal, and handwritten greeting card for the entire package.
      </p>

      {gift.enabled && (
        <div className="pt-2 border-t border-namora-line-soft space-y-2.5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Field label="To (Recipient Name)">
              <Input
                value={gift.to || ''}
                onChange={(e) => onChange({ to: e.target.value })}
                placeholder="e.g. Ayesha"
                className="text-xs h-8"
              />
            </Field>
            <Field label="From (Your Name)">
              <Input
                value={gift.from || ''}
                onChange={(e) => onChange({ from: e.target.value })}
                placeholder="e.g. Tariq"
                className="text-xs h-8"
              />
            </Field>
          </div>
          <Field label="Personal Note Card Message (Optional)">
            <Textarea
              rows={2}
              maxLength={250}
              value={gift.greetingNote || ''}
              onChange={(e) => onChange({ greetingNote: e.target.value })}
              placeholder="Wishing you barakah, peace, and endless happiness in your new home..."
              className="text-xs"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
