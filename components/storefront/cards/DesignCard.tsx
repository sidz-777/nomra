'use client';

import React from 'react';
import { PersianDesignItem } from '@/lib/storefront-data';

interface DesignCardProps {
  design: PersianDesignItem;
  isActive?: boolean;
  onSelect?: () => void;
  priority?: boolean;
}

export function DesignCard({
  design,
  isActive = false,
  onSelect,
}: DesignCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      window.dispatchEvent(
        new CustomEvent('namora-select-design', { detail: design.id })
      );
      const createEl = document.getElementById('create');
      if (createEl) {
        createEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const imageSrc = design.image ? `/${design.image}` : design.assetPath;

  return (
    <div
      className={`design-card ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="design-card-preview">
        <div className="product-display">
          <img
            className="product-img"
            src={imageSrc}
            alt={design.title}
            loading="lazy"
          />
        </div>
      </div>
      <span className="design-title">{design.title}</span>
    </div>
  );
}
