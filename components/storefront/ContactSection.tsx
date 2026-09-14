'use client';

import React, { useState } from 'react';
import { CONTACT_DATA } from '@/lib/storefront-data';

export function ContactSection() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedMsg = message.trim();

    if (!trimmedName || !trimmedPhone || !trimmedMsg) {
      alert('Please fill out all fields.');
      return;
    }

    if (!/^[0-9]{10}$/.test(trimmedPhone)) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    const waNumber = '919305654028';
    const text = `Hi NAMORA!%0A%0AName: ${encodeURIComponent(trimmedName)}%0APhone: ${encodeURIComponent(trimmedPhone)}%0A%0A${encodeURIComponent(trimmedMsg)}`;
    const url = `https://wa.me/${waNumber}?text=${text}`;

    window.open(url, '_blank');
  };

  return (
    <section id="contact" className="section">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Get in Touch</div>
          <h2>Questions? We&apos;re Here.</h2>
          <p>Ask us anything about your order, custom requests, or bulk gifting — we usually reply within a few hours.</p>
        </div>

        <div className="contact-grid reveal">
          <div className="contact-info">
            <h3>Reach us directly</h3>
            <p>
              Prefer a quick chat? Message us on WhatsApp for the fastest response — we&apos;re happy to help with spelling,
              design choices, or delivery timing.
            </p>

            <div className="contact-actions">
              <a
                className="contact-action"
                href="https://wa.me/919305654028?text=Hi%20NAMORA%2C%20I%20have%20a%20question"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contact-action-icon">✆</span>
                <span className="contact-action-text">
                  <span className="contact-action-label">WhatsApp</span>
                  <span className="contact-action-value">Chat with us instantly</span>
                </span>
              </a>

              <a className="contact-action" href="mailto:hello@namora.in">
                <span className="contact-action-icon">✉</span>
                <span className="contact-action-text">
                  <span className="contact-action-label">Email</span>
                  <span className="contact-action-value">hello@namora.in</span>
                </span>
              </a>

              <a
                className="contact-action"
                href="https://www.instagram.com/namoraworld/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contact-action-icon">◎</span>
                <span className="contact-action-text">
                  <span className="contact-action-label">Instagram</span>
                  <span className="contact-action-value">@namoraworld</span>
                </span>
              </a>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <h3>Send us a message</h3>
            <p className="form-sub">We&apos;ll reply via WhatsApp shortly.</p>

            <input
              className="input"
              id="contactName"
              placeholder="Your Name *"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input"
              id="contactPhone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              placeholder="10-digit Mobile Number *"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <textarea
              className="input"
              id="contactMessage"
              placeholder="Your message... *"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button type="submit" className="btn" style={{ width: '100%', padding: '14px' }}>
              Send via WhatsApp
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
