'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PERSIAN_DESIGNS, PersianDesignItem } from '@/lib/storefront-data';
import { Modal, Button } from '@/components/ui';

interface DesignSelectorProps {
  selectedDesign: PersianDesignItem;
  onSelectDesign: (design: PersianDesignItem) => void;
}

export function DesignSelector({
  selectedDesign,
  onSelectDesign,
}: DesignSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <span className="label">1. Selected Frame</span>
      <div
        className="selected-product-name cursor-pointer"
        id="selectedProductName"
        onClick={() => setModalOpen(true)}
        title="Click to switch frame design"
        style={{ cursor: 'pointer' }}
      >
        {selectedDesign.title}
        <span style={{ float: 'right', fontSize: '0.8rem', fontWeight: 500, opacity: 0.8 }}>Change ▾</span>
      </div>

      {/* Modal Dialog with all 21 Designs */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Select Persian Frame Design"
        description="Choose from 21 museum-quality Persian and oriental aesthetic backgrounds"
        maxWidth="xl"
      >
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-1">
            {PERSIAN_DESIGNS.map((design) => {
              const isSelected = design.id === selectedDesign.id;
              return (
                <div
                  key={design.id}
                  onClick={() => {
                    onSelectDesign(design);
                    setModalOpen(false);
                  }}
                  className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all p-2 flex flex-col bg-namora-card ${
                    isSelected
                      ? 'border-namora-gold ring-2 ring-namora-gold/40 shadow-luxury'
                      : 'border-namora-line hover:border-namora-gold/50'
                  }`}
                >
                  <div className="relative w-full aspect-[1/1.414] bg-namora-soft rounded overflow-hidden">
                    <Image
                      src={design.assetPath}
                      alt={design.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-namora-gold text-black flex items-center justify-center font-bold text-xs shadow-md">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="font-hero text-xs font-medium text-namora-ink truncate">
                      {design.title}
                    </p>
                    <span className="text-[10px] text-namora-muted font-mono">
                      {design.categoryLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-namora-line-soft">
          <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
