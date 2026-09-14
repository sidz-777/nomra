import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid reveal">
          <div className="footer-brand">
            <Link className="logo" href="/">
              NAMORA
            </Link>
            <p>
              Personalized A4 wall frames, hand-finished on authentic Persian and oriental backgrounds. Because some
              names deserve to be framed.
            </p>
            <div className="footer-social">
              <a href="https://wa.me/919305654028?text=Hi%20NAMORA" target="_blank" rel="noopener" title="WhatsApp">
                ✆
              </a>
              <a
                href="https://www.instagram.com/namoraworld/"
                target="_blank"
                rel="noopener"
                title="Instagram @namoraworld"
              >
                ◎
              </a>
              <a href="mailto:hello@namora.in" title="Email">
                ✉
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <div className="footer-links">
              <a href="#designs">All Persian Frames</a>
              <a href="#create">Personalize Frame</a>
              <a href="#ready-to-ship">Ready-to-Ship ⚡</a>
              <a href="#gallery">Real Works Gallery</a>
              <Link href="/track-order">Track Order 📦</Link>
            </div>
          </div>

          <div className="footer-col">
            <h4>Help &amp; Info</h4>
            <div className="footer-links">
              <a href="#how-it-works">How It Works</a>
              <a href="#testimonials">Customer Reviews</a>
              <a href="#faq">FAQ</a>
              <a href="#contact">Contact Us</a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Direct WhatsApp</h4>
            <p className="footer-wa-hint">Have a custom requirement, spelling check, or bulk gifting inquiry?</p>
            <a
              className="btn btn-whatsapp"
              href="https://wa.me/919305654028?text=Hi%20NAMORA%2C%20I%20have%20a%20question"
              target="_blank"
              rel="noopener"
              style={{ fontSize: '0.85rem', padding: '0.65rem 1rem' }}
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} NAMORA. All rights reserved. Handcrafted with care in India.</p>
          <div className="footer-bottom-links">
            <Link href="/track-order">Track My Order</Link>
            <span>&bull;</span>
            <a href="#contact">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
