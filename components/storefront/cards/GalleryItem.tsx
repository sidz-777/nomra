import React from 'react';
import Image from 'next/image';
import { LookbookItem } from '@/lib/storefront-data';

interface GalleryItemProps {
  item: LookbookItem;
  priority?: boolean;
}

export function GalleryItem({ item, priority = false }: GalleryItemProps) {
  return (
    <div className="group relative rounded-xl overflow-hidden border border-namora-line bg-namora-card shadow-card">
      <div className="relative w-full aspect-[4/5] bg-namora-soft overflow-hidden">
        <Image
          src={item.image}
          alt={item.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
          <h4 className="font-hero text-base font-medium leading-snug drop-shadow-sm">
            {item.title}
          </h4>
          <p className="text-xs text-white/70 font-light mt-1 line-clamp-2">
            {item.caption}
          </p>
        </div>
      </div>
    </div>
  );
}
