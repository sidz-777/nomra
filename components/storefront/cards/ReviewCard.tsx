import React from 'react';
import Image from 'next/image';
import { Card, Badge } from '@/components/ui';
import { TestimonialItem } from '@/lib/storefront-data';

interface ReviewCardProps {
  review: TestimonialItem;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card
      variant="standard"
      className="p-6 flex flex-col justify-between h-full bg-namora-card border border-namora-line"
    >
      {/* Header Row: Stars & Verified Badge */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex text-amber-400 text-sm tracking-wider">
            {'★'.repeat(review.stars)}
          </div>
          {review.verified && (
            <Badge variant="success" size="sm">
              ✓ Verified Buyer
            </Badge>
          )}
        </div>

        {/* Review Quote */}
        <p className="text-xs sm:text-sm text-namora-ink font-light italic leading-relaxed mb-4">
          {review.text}
        </p>
      </div>

      {/* Footer: Customer Details & Photo Thumbnail */}
      <div className="pt-4 border-t border-namora-line-soft">
        <div className="flex items-center gap-3">
          {review.photoThumb && (
            <div className="relative w-11 h-14 rounded overflow-hidden border border-namora-line-soft flex-shrink-0">
              <Image
                src={review.photoThumb}
                alt={review.productTag}
                fill
                className="object-cover"
                sizes="44px"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-namora-soft border border-namora-line flex items-center justify-center text-[10px] font-semibold text-namora-gold">
                {review.avatar}
              </div>
              <span className="text-xs font-medium text-namora-ink truncate">
                {review.name}
              </span>
            </div>
            <p className="text-[10px] text-namora-muted truncate mt-0.5">
              {review.location}
            </p>
            <p className="text-[10px] text-namora-gold/80 font-mono truncate mt-0.5">
              {review.productTag}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
