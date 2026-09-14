import React from 'react';
import { ReviewCard } from './cards/ReviewCard';
import { TESTIMONIALS } from '@/lib/storefront-data';

export function ReviewsSection() {
  return (
    <section id="testimonials" className="section">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow" style={{ justifyContent: 'center' }}>
            Loved by Families
          </div>
          <h2>What Our Customers Say</h2>
          <p>Real unboxing moments and reviews from homes across India.</p>
        </div>

        {/* 4.9★ REVIEWS SUMMARY CARD */}
        <div className="reviews-summary-card reveal">
          <div className="reviews-score-block">
            <div className="reviews-big-score">4.9</div>
            <div className="reviews-stars">★★★★★</div>
            <div className="reviews-count-label">540+ Verified Buyers</div>
          </div>
          <div className="reviews-bars">
            <div className="review-bar-row">
              <span>5 ★</span>
              <div className="review-bar-track">
                <div className="review-bar-fill" style={{ width: '94%' }}></div>
              </div>
              <span>94%</span>
            </div>
            <div className="review-bar-row">
              <span>4 ★</span>
              <div className="review-bar-track">
                <div className="review-bar-fill" style={{ width: '6%' }}></div>
              </div>
              <span>6%</span>
            </div>
          </div>
          <div className="reviews-badges-strip">
            <div className="review-feature-pill">
              ✦ <strong>100% Handcrafted:</strong> Archival 300 GSM Art
            </div>
            <div className="review-feature-pill">
              🛡️ <strong>Transit Safe:</strong> Shatterproof Acrylic Glass
            </div>
            <div className="review-feature-pill">
              🎁 <strong>Gift Delight:</strong> 98.6% Would Gift Again
            </div>
          </div>
        </div>

        {/* CUSTOMER PHOTO REVIEW CARDS */}
        <div className="testimonials-grid reveal-stagger">
          {TESTIMONIALS.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
