import React from 'react';
import { TestimonialItem } from '@/lib/storefront-data';

interface ReviewCardProps {
  review: TestimonialItem;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const photoSrc = review.photoThumb?.startsWith('/')
    ? review.photoThumb
    : `/${review.photoThumb || 'frame1.jpg'}`;

  return (
    <div className="testimonial-card">
      <div className="review-header-row">
        <div className="testimonial-stars">★★★★★</div>
        <span className="verified-buyer-badge">✓ Verified Buyer</span>
      </div>
      <p className="testimonial-text">&ldquo;{review.text}&rdquo;</p>

      {review.photoThumb && (
        <div className="review-photo-thumb-wrap">
          <img
            src={photoSrc}
            alt={`${review.productTag} review`}
            className="review-photo-thumb"
            loading="lazy"
          />
          <div>
            <div className="review-product-tag">{review.productTag}</div>
            <div className="review-date">{review.deliveredDate}</div>
          </div>
        </div>
      )}

      <div className="testimonial-author" style={{ marginTop: '0.85rem' }}>
        <div className="testimonial-avatar">{review.avatar}</div>
        <div>
          <div className="testimonial-name">{review.name}</div>
          <div className="testimonial-loc">{review.location}</div>
        </div>
      </div>
    </div>
  );
}
