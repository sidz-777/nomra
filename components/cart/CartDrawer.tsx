'use client';

import React, { useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartContext';
import { CartItemCard } from './CartItemCard';
import { formatINR } from '@/lib/cart/cart-calculations';
import { getEstimatedDispatchDates, buildCartWhatsAppUrl } from '@/lib/cart/cart-utils';

export function CartDrawer() {
  const {
    items,
    gift,
    isOpen,
    totals,
    removeItem,
    updateQuantity,
    toggleCart,
  } = useCart();

  const router = useRouter();
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

  const handleAddAnotherFrame = () => {
    toggleCart(false);
    const element = document.getElementById('create');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleProceedToCheckout = () => {
    toggleCart(false);
    router.push('/checkout');
  };

  const whatsAppUrl = buildCartWhatsAppUrl(items, gift, totals);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`drawer ${isOpen ? 'open' : ''}`}
      id="cartDrawer"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleCart(false);
      }}
    >
      <div className="drawer-panel">
        <div>
          <div className="drawer-head">
            <h2 id={titleId}>
              Your Cart (<span id="drawerHeadCount">{totals.totalFrames}</span>)
            </h2>
            <button
              type="button"
              className="x"
              id="closeCart"
              onClick={() => toggleCart(false)}
              aria-label="Close cart drawer"
            >
              &times;
            </button>
          </div>

          <div id="cartContent">
            {items.length === 0 ? (
              <div className="cart-empty-state">
                <div className="cart-empty-icon">🖼️</div>
                <div className="cart-empty-title">Your Cart is Empty</div>
                <div className="cart-empty-sub">
                  Personalize an authentic Persian frame to get started.
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={handleAddAnotherFrame}
                  style={{ marginTop: '1.25rem', width: '100%' }}
                >
                  Customize a Frame Now &rarr;
                </button>
              </div>
            ) : (
              <div
                className="cart-items-list"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onRemove={removeItem}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleAddAnotherFrame}
                  className="btn btn-ghost"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '0.85rem',
                    marginTop: '0.5rem',
                  }}
                >
                  + Add Another Frame (₹499)
                </button>
              </div>
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div
            id="drawerCheckoutBottom"
            style={{
              borderTop: '1px solid var(--line)',
              paddingTop: '16px',
              marginTop: '16px',
            }}
          >
            <div className="drawer-dispatch-pill" id="drawerDispatchPill">
              <span
                className="pulse-dot-live"
                style={{ width: '7px', height: '7px' }}
              />
              <div>
                <div>
                  ⚡ Dispatches by{' '}
                  <strong id="drawerDispatchDate">{dispatchDate}</strong>
                </div>
                <div
                  style={{
                    fontSize: '0.69rem',
                    color: 'var(--muted)',
                    marginTop: '1px',
                  }}
                >
                  Free Pan-India Delivery by{' '}
                  <strong
                    id="drawerDeliveryDate"
                    style={{ color: 'var(--ink)' }}
                  >
                    {deliveryDate}
                  </strong>
                </div>
              </div>
            </div>

            <div className="totals" id="drawerTotals">
              <div className="row">
                <span>
                  Total Frame Price (
                  <span id="drawerItemsCount">{totals.totalFrames}</span>):
                </span>
                <strong id="drawerTotalPrice">
                  {formatINR(totals.subtotal + (gift.enabled ? 69 : 0))}
                </strong>
              </div>
              {gift.enabled && (
                <div className="row" style={{ color: 'var(--accent)' }}>
                  <span>🎁 Luxury Gift Packaging:</span>
                  <strong>+₹69</strong>
                </div>
              )}
              <div className="row success">
                <span>
                  Pay Advance Today (
                  <span id="drawerAdvanceCount">{totals.totalFrames}</span> × ₹49):
                </span>
                <strong id="drawerDepositPrice">
                  {formatINR(totals.totalDeposit)}
                </strong>
              </div>
              <div className="totals-divider" />
              <div className="row muted">
                <span>Due on Delivery (COD balance):</span>
                <span id="drawerCodPrice">{formatINR(totals.totalCod)}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn"
              id="payRazorpayBtn"
              onClick={handleProceedToCheckout}
              style={{ width: '100%', padding: '16px' }}
            >
              Pay <span id="payBtnDepositAmt">{formatINR(totals.totalDeposit)}</span>{' '}
              Deposit Now{' '}
              <span id="payBtnFrameCount">
                ({totals.totalFrames}{' '}
                {totals.totalFrames === 1 ? 'Frame' : 'Frames'})
              </span>
            </button>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
              id="drawerWhatsAppBtn"
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg
                className="btn-wa-icon"
                viewBox="0 0 24 24"
                width={18}
                height={18}
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span id="drawerWaBtnText">Complete Order via WhatsApp</span>
            </a>

            <div className="drawer-guarantee-badge">
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🛡️</span>
              <div>
                <strong>Zero-Risk Booking:</strong> ₹49/frame deposit confirms
                dispatch. Balance is COD on delivery. Free remake if damaged in
                transit.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
