'use client';

import React, { useEffect, useState } from 'react';

interface StickyMobileBarProps {
  designName?: string;
  price?: number;
  onCustomizeClick?: () => void;
}

export function StickyMobileBar({
  designName = 'Red Persian Carpet Frame',
  price = 499,
  onCustomizeClick,
}: StickyMobileBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const hero = document.querySelector('.hero');
      if (!hero) {
        setIsVisible(window.scrollY > 300);
        return;
      }
      const heroBottom = hero.getBoundingClientRect().bottom;
      setIsVisible(heroBottom < 0);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    if (onCustomizeClick) {
      onCustomizeClick();
    } else {
      const target = document.getElementById('create');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className={`sticky-mobile-bar ${isVisible ? 'visible' : ''}`} id="stickyMobileBar">
      <div className="sticky-bar-left">
        <div className="sticky-bar-title">
          <span id="stickyDesignName">{designName}</span> · A4 Frame
        </div>
        <div className="sticky-bar-price-row">
          <span className="sticky-bar-price">₹{price}</span>
          <span className="sticky-bar-badge">Free Delivery</span>
          <span className="sticky-bar-badge-cod">COD Available</span>
        </div>
        <div className="sticky-bar-dispatch">
          <span className="pulse-dot-live" style={{ width: 6, height: 6 }}></span>
          <span>Dispatches <strong id="stickyDispatchDate">in 24–48 hrs</strong></span>
        </div>
      </div>
      <button
        type="button"
        className="btn sticky-bar-btn"
        id="stickyBarBtn"
        onClick={handleClick}
      >
        Customize Frame &rarr;
      </button>
    </div>
  );
}
