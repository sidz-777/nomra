import React from 'react';
import { Container } from '@/components/layout/Container';
import { SectionHeading } from '@/components/ui';
import { ReviewCard } from './cards/ReviewCard';
import { REVIEWS_SUMMARY, TESTIMONIALS } from '@/lib/storefront-data';

export function ReviewsSection() {
  return (
    <section id="testimonials" className="py-16 sm:py-24 border-b border-namora-line bg-namora-soft/30">
      <Container width="wide">
        <SectionHeading
          eyebrow="Loved by Families"
          title="What Our Customers Say"
          subtitle="Real unboxing moments and reviews from homes across India."
        />

        {/* 4.9★ Reviews Summary Card */}
        <div className="p-6 sm:p-8 rounded-xl border border-namora-line bg-namora-card max-w-3xl mx-auto mb-12 shadow-card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Big Score Block */}
            <div className="text-center sm:text-left flex-shrink-0">
              <div className="text-4xl sm:text-5xl font-hero font-bold text-namora-ink">
                {REVIEWS_SUMMARY.score}
              </div>
              <div className="text-amber-400 text-lg tracking-wider my-1">
                {'★'.repeat(REVIEWS_SUMMARY.stars)}
              </div>
              <div className="text-xs text-namora-muted font-mono">
                {REVIEWS_SUMMARY.totalBuyers}
              </div>
            </div>

            {/* Distribution Bars */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center gap-3 text-xs font-mono text-namora-muted">
                <span className="w-8">5 ★</span>
                <div className="flex-1 h-2 rounded-full bg-namora-soft overflow-hidden">
                  <div
                    className="h-full bg-namora-gold rounded-full"
                    style={{ width: `${REVIEWS_SUMMARY.fiveStarPercent}%` }}
                  />
                </div>
                <span className="w-10 text-right">{REVIEWS_SUMMARY.fiveStarPercent}%</span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-namora-muted">
                <span className="w-8">4 ★</span>
                <div className="flex-1 h-2 rounded-full bg-namora-soft overflow-hidden">
                  <div
                    className="h-full bg-namora-gold/60 rounded-full"
                    style={{ width: `${REVIEWS_SUMMARY.fourStarPercent}%` }}
                  />
                </div>
                <span className="w-10 text-right">{REVIEWS_SUMMARY.fourStarPercent}%</span>
              </div>
            </div>
          </div>

          {/* Badges Strip */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-6 mt-6 border-t border-namora-line-soft text-[11px] text-namora-ink-soft">
            {REVIEWS_SUMMARY.features.map((feature) => (
              <span
                key={feature}
                className="px-3 py-1 rounded-full bg-namora-soft border border-namora-line-soft font-mono"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Customer Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </Container>
    </section>
  );
}
