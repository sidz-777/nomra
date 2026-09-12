import React from 'react';
import Link from 'next/link';
import { Container } from './Container';
import { FOOTER_DATA, CONTACT_DATA } from '@/lib/storefront-data';

export function Footer() {
  return (
    <footer className="border-t border-namora-line bg-namora-soft/60 text-namora-ink transition-colors duration-300">
      <Container width="wide" className="py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12">
          {/* Brand Column (Span 2 on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              href="/"
              className="font-luxury text-2xl font-bold tracking-[0.25em] text-namora-gold hover:text-namora-gold-hover transition inline-block"
            >
              NAMORA
            </Link>
            <p className="text-xs sm:text-sm text-namora-muted max-w-sm leading-relaxed font-light">
              Personalized A4 wall frames, hand-finished on authentic Persian and oriental backgrounds.
              Because some names deserve to be framed.
            </p>

            {/* Social & Direct Contact Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={CONTACT_DATA.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp Concierge"
                className="w-8 h-8 rounded-full border border-namora-line bg-namora-card flex items-center justify-center text-xs text-namora-gold hover:border-namora-gold hover:scale-105 transition"
              >
                ✆
              </a>
              <a
                href={CONTACT_DATA.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram @namoraworld"
                className="w-8 h-8 rounded-full border border-namora-line bg-namora-card flex items-center justify-center text-xs text-namora-gold hover:border-namora-gold hover:scale-105 transition"
              >
                ◎
              </a>
              <a
                href={`mailto:${CONTACT_DATA.email}`}
                title="Email Support"
                className="w-8 h-8 rounded-full border border-namora-line bg-namora-card flex items-center justify-center text-xs text-namora-gold hover:border-namora-gold hover:scale-105 transition"
              >
                ✉
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-namora-gold font-semibold mb-4">
              Shop Collections
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_DATA.shopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-namora-muted hover:text-namora-ink transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-namora-gold font-semibold mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_DATA.supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-namora-muted hover:text-namora-ink transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Policies Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-namora-gold font-semibold mb-4">
              Our Policies
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_DATA.legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-namora-muted hover:text-namora-ink transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Trust Badges & Copyright */}
        <div className="mt-12 pt-8 border-t border-namora-line-soft flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-namora-muted">
          <p>&copy; {new Date().getFullYear()} NAMORA. Handcrafted in India. All rights reserved.</p>
          <div className="flex items-center gap-3 font-mono text-[11px] text-namora-muted/80">
            <span>₹49 Deposit Booking</span>
            <span>&bull;</span>
            <span>Pan-India COD</span>
            <span>&bull;</span>
            <span>Free Remake Guarantee</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
