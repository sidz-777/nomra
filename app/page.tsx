import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import {
  HeroSection,
  TrustStrip,
  PersianCollection,
  ReadyStockSection,
  LookbookSection,
  HowItWorksSection,
  ReviewsSection,
  StorySection,
  FAQSection,
  ContactSection,
} from '@/components/storefront';

export default function HomePage() {
  return (
    <PageShell>
      {/* 1. Hero Section with Video/Poster & Value Highlights */}
      <HeroSection />

      {/* 2. Trust Strip with 4 Core Guarantees */}
      <TrustStrip />

      {/* 3. Persian & Oriental Heritage Collection (21 Designs) */}
      <PersianCollection />

      {/* 4. Ready-to-Ship Editions (37 Products: Supercars, Sports, Faith, Pop) */}
      <ReadyStockSection />

      {/* 5. Real Finished Works Lookbook Gallery */}
      <LookbookSection />

      {/* 6. How It Works 3-Step Journey */}
      <HowItWorksSection />

      {/* 7. Customer Testimonials & 4.9★ Verified Reviews */}
      <ReviewsSection />

      {/* 8. Editorial Brand Story & Craftsmanship Specs */}
      <StorySection />

      {/* 9. Frequently Asked Questions Accordion */}
      <FAQSection />

      {/* 10. Direct Concierge & Inquiry Section */}
      <ContactSection />
    </PageShell>
  );
}
