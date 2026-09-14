'use client';

import React from 'react';
import Link from 'next/link';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onCartClick?: () => void;
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  return (
    <div
      className={`mobile-menu ${isOpen ? 'open' : ''}`}
      id="mobileMenu"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="mobile-menu-close"
        onClick={onClose}
        aria-label="Close menu"
      >
        &times;
      </button>

      <ul className="mobile-menu-nav">
        <li>
          <a href="#designs" onClick={onClose}>
            Collection
          </a>
        </li>
        <li>
          <a href="#create" onClick={onClose}>
            Customize
          </a>
        </li>
        <li>
          <a href="#ready-to-ship" onClick={onClose}>
            Ready Stock ⚡
          </a>
        </li>
        <li>
          <a href="#gallery" onClick={onClose}>
            Real Works
          </a>
        </li>
        <li>
          <a href="#how-it-works" onClick={onClose}>
            How It Works
          </a>
        </li>
        <li>
          <a href="#testimonials" onClick={onClose}>
            Reviews
          </a>
        </li>
        <li>
          <a href="#about" onClick={onClose}>
            Our Story
          </a>
        </li>
        <li>
          <a href="#faq" onClick={onClose}>
            FAQ
          </a>
        </li>
        <li>
          <a href="#contact" onClick={onClose}>
            Contact
          </a>
        </li>
        <li>
          <Link href="/track-order" onClick={onClose}>
            Track Order
          </Link>
        </li>
      </ul>
    </div>
  );
}
