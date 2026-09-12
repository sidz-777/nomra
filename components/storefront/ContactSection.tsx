'use client';

import React, { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { SectionHeading, Field, Input, Textarea, Button } from '@/components/ui';
import { CONTACT_DATA } from '@/lib/storefront-data';

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pre-fill WhatsApp message as a primary reliable channel
    const text = encodeURIComponent(
      `Hi NAMORA! Inquiry from ${name} (${phone}): ${message}`
    );
    window.open(`https://wa.me/919305654028?text=${text}`, '_blank');
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-16 sm:py-24 border-b border-namora-line">
      <Container width="wide">
        <SectionHeading
          eyebrow="Get in Touch"
          title={CONTACT_DATA.title}
          subtitle={CONTACT_DATA.subtitle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* Direct WhatsApp Concierge Block */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-xl border border-namora-line bg-namora-card space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-namora-gold">
                Direct Concierge
              </span>
              <h3 className="font-hero text-xl font-medium text-namora-ink">
                Reach us directly
              </h3>
              <p className="text-xs sm:text-sm text-namora-muted font-light leading-relaxed">
                Prefer a quick chat? Message us on WhatsApp for the fastest response — we&apos;re happy to help with spelling,
                design choices, or delivery timing.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-namora-line-soft">
              <a
                href={CONTACT_DATA.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-namora-gold/40 bg-namora-gold/10 text-namora-ink hover:border-namora-gold transition group"
              >
                <span className="w-8 h-8 rounded-full bg-namora-gold/20 flex items-center justify-center text-namora-gold font-bold">
                  ✆
                </span>
                <div>
                  <p className="text-xs font-semibold text-namora-gold">WhatsApp Concierge</p>
                  <p className="text-[11px] text-namora-muted">{CONTACT_DATA.whatsappPhone}</p>
                </div>
              </a>

              <a
                href={CONTACT_DATA.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-namora-line bg-namora-soft/60 text-namora-ink hover:border-namora-gold transition group"
              >
                <span className="w-8 h-8 rounded-full bg-namora-soft flex items-center justify-center text-namora-gold font-bold">
                  ◎
                </span>
                <div>
                  <p className="text-xs font-semibold">Instagram DM</p>
                  <p className="text-[11px] text-namora-muted">{CONTACT_DATA.instagramHandle}</p>
                </div>
              </a>

              <a
                href={`mailto:${CONTACT_DATA.email}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-namora-line bg-namora-soft/60 text-namora-ink hover:border-namora-gold transition group"
              >
                <span className="w-8 h-8 rounded-full bg-namora-soft flex items-center justify-center text-namora-gold font-bold">
                  ✉
                </span>
                <div>
                  <p className="text-xs font-semibold">Email Concierge</p>
                  <p className="text-[11px] text-namora-muted">{CONTACT_DATA.email}</p>
                </div>
              </a>
            </div>
          </div>

          {/* Quick Message Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-xl border border-namora-line bg-namora-card shadow-card">
            <h3 className="font-hero text-lg font-medium text-namora-ink mb-1">
              Send a Quick Inquiry
            </h3>
            <p className="text-xs text-namora-muted mb-6 font-light">
              We will respond to your WhatsApp number or email within 2–4 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Your Name" required>
                <Input
                  required
                  placeholder="e.g. Zaid Mansoori"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field label="Phone / WhatsApp Number" required>
                <Input
                  required
                  placeholder="e.g. 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>

              <Field label="Your Message or Custom Request" required>
                <Textarea
                  required
                  rows={4}
                  placeholder="Ask about bulk gifting, custom dimensions, or express wedding deliveries..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </Field>

              <Button type="submit" variant="primary" fullWidth size="md">
                Send via WhatsApp Concierge &rarr;
              </Button>

              {submitted && (
                <p className="text-xs text-namora-gold text-center pt-2 font-mono">
                  ✓ Opening WhatsApp with your pre-filled inquiry...
                </p>
              )}
            </form>
          </div>
        </div>
      </Container>
    </section>
  );
}
