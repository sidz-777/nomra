import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, Badge, PriceDisplay, Button } from '@/components/ui';
import { PersianDesignItem } from '@/lib/storefront-data';

interface DesignCardProps {
  design: PersianDesignItem;
  priority?: boolean;
}

export function DesignCard({ design, priority = false }: DesignCardProps) {
  return (
    <Card
      variant="product"
      className="group flex flex-col h-full bg-namora-card border border-namora-line hover:border-namora-gold/60 transition-all duration-300"
    >
      {/* Image Container with A4 Ratio & Subtle Frame Effect */}
      <div className="relative w-full aspect-[1/1.414] bg-namora-soft overflow-hidden p-2">
        <div className="relative w-full h-full border border-black/40 rounded-sm overflow-hidden shadow-inner">
          <Image
            src={design.assetPath}
            alt={design.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Subtle Glass Glare Reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity" />
        </div>

        {/* Category Pill Tag */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <Badge variant="gold" size="sm">
            {design.categoryLabel}
          </Badge>
        </div>
      </div>

      {/* Card Info & Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 border-t border-namora-line-soft">
        <div>
          <h3 className="font-hero text-base sm:text-lg font-medium text-namora-ink line-clamp-1 group-hover:text-namora-gold transition-colors">
            {design.title}
          </h3>
          <p className="text-[11px] text-namora-muted font-sans mt-0.5">
            Standard A4 Handmade Frame · Satin Black Finish
          </p>
        </div>

        {/* Price and CTA */}
        <div className="flex items-end justify-between pt-2 border-t border-namora-line-soft/60">
          <PriceDisplay
            price={499}
            depositAmount={49}
            showDepositBadge
            size="sm"
          />

          <Link href="#create">
            <Button variant="primary" size="sm">
              Customize
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
