import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, Badge, PriceDisplay, Button } from '@/components/ui';
import { ReadyStockItem } from '@/lib/storefront-data';

interface ReadyStockCardProps {
  product: ReadyStockItem;
  priority?: boolean;
}

export function ReadyStockCard({ product, priority = false }: ReadyStockCardProps) {
  const badgeVariant =
    product.tagClass === 'gold' ? 'gold' : product.tagClass === 'popular' ? 'warning' : 'default';

  return (
    <Card
      variant="product"
      className="group flex flex-col h-full bg-namora-card border border-namora-line hover:border-namora-gold/60 transition-all duration-300"
    >
      {/* Image Container with A4 proportions */}
      <div className="relative w-full aspect-[1/1.414] bg-namora-soft overflow-hidden p-2">
        <div className="relative w-full h-full border border-black/40 rounded-sm overflow-hidden shadow-inner">
          <Image
            src={product.assetPath}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity" />
        </div>

        {/* Tag Badge */}
        <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1 items-start">
          <Badge variant={badgeVariant} size="sm">
            {product.tag}
          </Badge>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 border-t border-namora-line-soft">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-namora-gold">
            {product.categoryLabel}
          </span>
          <h3 className="font-hero text-base sm:text-lg font-medium text-namora-ink line-clamp-1 group-hover:text-namora-gold transition-colors mt-0.5">
            {product.title}
          </h3>
          <p className="text-[11px] text-namora-muted font-sans line-clamp-2 mt-0.5 leading-relaxed">
            {product.subtitle}
          </p>
        </div>

        {/* Pricing and Action */}
        <div className="flex items-end justify-between pt-2 border-t border-namora-line-soft/60">
          <PriceDisplay
            price={product.price}
            depositAmount={product.depositPrice}
            showDepositBadge
            size="sm"
          />

          <Link href="#create">
            <Button variant="primary" size="sm">
              Quick Order
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
