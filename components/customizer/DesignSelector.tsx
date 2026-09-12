'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PERSIAN_DESIGNS, PersianDesignItem } from '@/lib/storefront-data';
import { Modal, Button, Badge } from '@/components/ui';

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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-namora-ink">
          1. Selected Frame Design
        </span>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="text-xs font-semibold text-namora-gold hover:text-namora-gold-hover transition underline underline-offset-2"
        >
          Change Design ({PERSIAN_DESIGNS.length} available)
        </button>
      </div>

      {/* Active Design Bar */}
      <div
        onClick={() => setModalOpen(true)}
        className="p-3.5 rounded-lg border border-namora-line bg-namora-soft hover:border-namora-gold/60 transition cursor-pointer flex items-center justify-between gap-3 shadow-subtle group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-9 h-12 rounded border border-black/40 overflow-hidden flex-shrink-0 bg-namora-card">
            <Image
              src={selectedDesign.assetPath}
              alt={selectedDesign.title}
              fill
              className="object-cover"
              sizes="36px"
            />
          </div>
          <div className="min-w-0">
            <p className="font-hero text-sm font-medium text-namora-ink group-hover:text-namora-gold transition truncate">
              {selectedDesign.title}
            </p>
            <span className="text-[10px] text-namora-muted font-mono uppercase tracking-wider">
              {selectedDesign.categoryLabel}
            </span>
          </div>
        </div>

        <Badge variant="gold" size="sm" className="flex-shrink-0">
          Active
        </Badge>
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
