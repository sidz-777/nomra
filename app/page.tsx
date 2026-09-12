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
import { PersonalizationStudio } from '@/components/customizer';

export default function HomePage() {
  return (
    <PageShell>
      {/* 1. Hero Section with Video Showcase & Value Highlights */}
      <HeroSection />

      {/* 2. Trust Strip with 4 Core Guarantees */}
      <TrustStrip />

      {/* 3. Persian & Oriental Heritage Collection (21 Designs) */}
      <PersianCollection />

      {/* 4. Interactive Personalization Studio (#create) */}
      <PersonalizationStudio />

      {/* 5. Ready-to-Ship Editions (37 Products: Supercars, Sports, Faith, Pop) */}
      <ReadyStockSection />

      {/* 6. Real Finished Works Lookbook Gallery */}
      <LookbookSection />

      {/* 7. How It Works 3-Step Journey */}
      <HowItWorksSection />

      {/* 8. Customer Testimonials & 4.9★ Verified Reviews */}
      <ReviewsSection />

      {/* 9. Editorial Brand Story & Craftsmanship Specs */}
      <StorySection />

      {/* 10. Frequently Asked Questions Accordion */}
      <FAQSection />

      {/* 11. Direct Concierge & Inquiry Section */}
      <ContactSection />
    </PageShell>
  );
}
