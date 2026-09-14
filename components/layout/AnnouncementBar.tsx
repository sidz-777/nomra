'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="announcement-bar" id="announcementBar">
      <div className="container announcement-inner">
        <div className="announcement-content">
          <span className="announcement-badge">FESTIVE GIFTING</span>
          <span className="announcement-text">
            ✨ Handcrafted in India &bull; Free Express Air Delivery &bull; Reserve with ₹49, Pay Balance ₹450 on COD
          </span>
        </div>
        <Link href="#create" className="announcement-cta">
          Customize Yours &rarr;
        </Link>
        <button
          type="button"
          className="announcement-close-btn"
          onClick={() => setIsVisible(false)}
          aria-label="Close notification"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
