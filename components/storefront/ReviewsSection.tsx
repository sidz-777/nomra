'use client';

import React, { useState, useEffect } from 'react';
import { ReviewCard } from './cards/ReviewCard';
import { TESTIMONIALS, TestimonialItem } from '@/lib/storefront-data';

export function ReviewsSection() {
  const [reviews, setReviews] = useState<TestimonialItem[]>(TESTIMONIALS);
  const [stats, setStats] = useState({
    average_rating: 4.9,
    total_reviews: 540,
    five_star_pct: 94,
    four_star_pct: 6,
  });

  useEffect(() => {
    let mounted = true;
    async function loadDynamicReviews() {
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.reviews) && data.reviews.length > 0 && mounted) {
            setReviews(data.reviews);
            if (data.stats) {
              setStats(data.stats);
            }
          }
        }
      } catch {
        // Resilient fallback: preserves TESTIMONIALS exactly
      }
    }
    loadDynamicReviews();
    return () => {
      mounted = false;
    };
  }, []);

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
            <div className="reviews-big-score">{stats.average_rating}</div>
            <div className="reviews-stars">★★★★★</div>
            <div className="reviews-count-label">{stats.total_reviews}+ Verified Buyers</div>
          </div>
          <div className="reviews-bars">
            <div className="review-bar-row">
              <span>5 ★</span>
              <div className="review-bar-track">
                <div className="review-bar-fill" style={{ width: `${stats.five_star_pct}%` }}></div>
              </div>
              <span>{stats.five_star_pct}%</span>
            </div>
            <div className="review-bar-row">
              <span>4 ★</span>
              <div className="review-bar-track">
                <div className="review-bar-fill" style={{ width: `${stats.four_star_pct}%` }}></div>
              </div>
              <span>{stats.four_star_pct}%</span>
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
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
