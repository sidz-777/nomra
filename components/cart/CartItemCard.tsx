'use client';

import React from 'react';
import { CartItem } from '@/lib/cart/cart-types';
import { formatINR } from '@/lib/cart/cart-calculations';

interface CartItemCardProps {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
}

export function CartItemCard({ item, onRemove }: CartItemCardProps) {
  const isReady = item.productType === 'ready_stock';
  const custom = item.customization;
  const showAr = custom?.arabicName && custom.arabicName !== custom.englishName;

  const imageSrc = item.image ? (item.image.startsWith('/') ? item.image : `/${item.image}`) : '/frame1.jpg';

  return (
    <div className="cart-item-card" data-id={item.id}>
      <div className="cart-item-thumb">
        <img src={imageSrc} alt={item.title} />
      </div>
      <div className="cart-item-details">
        <div className="cart-item-header">
          <span className="cart-item-title">{item.title}</span>
          <button
            type="button"
            className="cart-item-remove-btn"
            onClick={() => onRemove(item.id)}
            title="Remove frame"
            aria-label="Remove frame"
          >
            &times;
          </button>
        </div>
        {isReady ? (
          <>
            <div className="cart-item-names">
              <span className="cart-item-ready-badge">⚡ Ready-to-Ship Edition</span>
            </div>
            <div className="cart-item-meta">
              <span>{item.categoryLabel || 'In Stock'}</span> · <span>A4 Glass Frame</span> · <span>24h Dispatch</span>
            </div>
          </>
        ) : custom ? (
          <>
            <div className="cart-item-names">
              <strong className="cart-item-en">{custom.englishName}</strong>
              {showAr && <span className="cart-item-ar">{custom.arabicName}</span>}
            </div>
            <div className="cart-item-meta">
              <span>{custom.finishLabel || custom.finish || 'Black'}</span> · <span>{custom.fontLabel || custom.font || 'Classic'}</span> · <span>A4</span>
            </div>
          </>
        ) : null}
        <div className="cart-item-price-row">
          <span className="cart-item-price">{formatINR(item.unitPrice * item.quantity)}</span>
          <span className="cart-item-deposit-tag">{formatINR(item.depositPrice * item.quantity)} advance</span>
        </div>
      </div>
    </div>
  );
}
