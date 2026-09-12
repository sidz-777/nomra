import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-namora-card/60 border border-namora-line rounded-xl max-w-lg mx-auto ${className}`}
    >
      {icon ? (
        <div className="mb-4 text-namora-gold">{icon}</div>
      ) : (
        <div className="w-12 h-12 mb-4 rounded-full bg-namora-soft border border-namora-line flex items-center justify-center text-namora-gold">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <h4 className="text-lg font-hero font-medium text-namora-ink mb-1.5">
        {title}
      </h4>
      {description && (
        <p className="text-xs sm:text-sm text-namora-muted mb-6 max-w-sm leading-relaxed font-light">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`p-6 bg-red-950/20 border border-red-800/40 rounded-xl text-center max-w-md mx-auto ${className}`}
    >
      <h4 className="text-base font-medium text-red-200 mb-1">{title}</h4>
      <p className="text-xs text-red-300/80 mb-4 font-light">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
