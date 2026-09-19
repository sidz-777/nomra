'use client';

import React from 'react';
import { ReadyStockItem } from '@/lib/storefront-data';
import { useCart } from '@/components/cart';

interface ReadyStockCardProps {
  product: ReadyStockItem;
  priority?: boolean;
  badgeOverride?: string;
}

export function ReadyStockCard({ product, badgeOverride }: ReadyStockCardProps) {
  const { addReadyStockItem } = useCart();

  const itemPrice = Number(product.price) || 499;
  const itemDeposit = Number(product.depositPrice != null ? product.depositPrice : 49);
  const itemCod = itemPrice - itemDeposit;
  const imgSrc = product.image
    ? (product.image.startsWith('http') || product.image.startsWith('/') ? product.image : `/${product.image}`)
    : (product.assetPath || '/assets/products/car-1.jpg');

  const handleWhatsApp = () => {
    const msg = [
      `*NAMORA READY-STOCK ORDER INQUIRY*`,
      `Frame Title: ${product.title}`,
      `Category: ${product.categoryLabel}`,
      `Frame Size: A4 Standard (21x29.7cm)`,
      `Total: ₹${itemPrice} (Pay ₹${itemDeposit} advance, balance ₹${itemCod} on COD)`,
    ].join('\n');
    window.open(`https://wa.me/919305654028?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="ready-card" data-category={product.category}>
      <div className="ready-frame-wrapper">
        <span className={`ready-card-badge ${product.tagClass || 'default'}`}>
          {badgeOverride || product.tag}
        </span>
        <button
          type="button"
          className="ready-card-zoom-btn"
          title="Inspect frame photo"
          onClick={(e) => {
            e.stopPropagation();
            window.open(imgSrc, '_blank');
          }}
        >
          🔍
        </button>
        <div className="ready-frame-inner">
          <img
            src={imgSrc}
            alt={product.title}
            className="ready-frame-img"
            loading="lazy"
          />
        </div>
      </div>
      <div className="ready-card-body">
        <div className="ready-card-category">{product.categoryLabel} · A4 Frame</div>
        <h3 className="ready-card-title">{product.title}</h3>
        <div className="ready-card-sub">{product.subtitle}</div>
        <div className="ready-card-pricing">
          <span className="ready-price-main">₹{itemPrice}</span>
          <span className="ready-price-deposit">
            ⚡ ₹{itemDeposit} advance · ₹{itemCod} COD
          </span>
        </div>
        <div className="ready-card-actions">
          <button
            type="button"
            className="ready-btn-cart"
            onClick={() => addReadyStockItem(product)}
          >
            <span>Add to Cart 🛒</span>
          </button>
          <button
            type="button"
            className="ready-btn-wa"
            onClick={handleWhatsApp}
            title="Direct WhatsApp Order"
            aria-label="Direct WhatsApp Order"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
