'use client';

import React from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onDismiss?: () => void;
}

const typeStyles: Record<ToastType, string> = {
  info: 'bg-namora-card text-namora-ink border-namora-line',
  success: 'bg-[#1C281F] text-emerald-300 border-emerald-700/60',
  warning: 'bg-[#2A2114] text-amber-300 border-amber-700/60',
  error: 'bg-[#2B1717] text-red-300 border-red-700/60',
};

export function Toast({
  message,
  type = 'info',
  isVisible,
  onDismiss,
}: ToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center justify-between p-4 rounded-lg border shadow-luxury text-sm ${typeStyles[type]}`}
      >
        <span>{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-3 text-xs opacity-70 hover:opacity-100 uppercase tracking-wider"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
