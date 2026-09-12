import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  shape?: 'rect' | 'circle' | 'pill';
}

export function Skeleton({
  shape = 'rect',
  className = '',
  ...props
}: SkeletonProps) {
  const shapeStyles = {
    rect: 'rounded-md',
    circle: 'rounded-full',
    pill: 'rounded-full',
  }[shape];

  return (
    <div
      className={`animate-pulse bg-namora-soft/80 border border-namora-line-soft/50 ${shapeStyles} ${className}`}
      {...props}
    />
  );
}

export function LoadingState({
  message = 'Loading artwork & details...',
  className = '',
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative w-10 h-10 mb-4">
        <div className="w-10 h-10 rounded-full border-2 border-namora-line border-t-namora-gold animate-spin" />
      </div>
      <p className="text-sm font-sans text-namora-muted font-light tracking-wide">
        {message}
      </p>
    </div>
  );
}
