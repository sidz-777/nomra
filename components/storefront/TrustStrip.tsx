import React from 'react';

export function TrustStrip() {
  return (
    <section className="trust-strip">
      <div className="container">
        <div className="trust-row reveal-stagger">
          <div className="trust-item">
            <div className="trust-icon">✦</div>
            <div>
              <div className="trust-text-title">Handmade</div>
              <div className="trust-text-sub">Crafted with care</div>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon">₹</div>
            <div>
              <div className="trust-text-title">COD Available</div>
              <div className="trust-text-sub">Pay on delivery</div>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon">➜</div>
            <div>
              <div className="trust-text-title">PAN India</div>
              <div className="trust-text-sub">Fast shipping</div>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon">✓</div>
            <div>
              <div className="trust-text-title">Secure Payment</div>
              <div className="trust-text-sub">Razorpay protected</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
