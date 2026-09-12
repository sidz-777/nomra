'use client';

import React, { useEffect } from 'react';
import { IconButton } from './IconButton';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const maxWidthStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  maxWidth = 'md',
  children,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidthStyles[maxWidth]} bg-namora-card border border-namora-line rounded-xl shadow-luxury overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between p-6 border-b border-namora-line-soft">
            <div>
              {title && (
                <h3 className="text-xl font-hero font-medium text-namora-ink">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-namora-muted mt-1 font-light">
                  {description}
                </p>
              )}
            </div>
            <IconButton
              label="Close modal"
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
