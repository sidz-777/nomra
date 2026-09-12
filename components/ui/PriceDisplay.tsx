import React from 'react';

export interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  depositAmount?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDepositBadge?: boolean;
  className?: string;
}

export function PriceDisplay({
  price,
  originalPrice,
  depositAmount = 49,
  size = 'md',
  showDepositBadge = false,
  className = '',
}: PriceDisplayProps) {
  const sizeStyles = {
    sm: 'text-sm font-semibold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-bold font-hero',
    xl: 'text-3xl sm:text-4xl font-bold font-hero',
  }[size];

  const codBalance = Math.max(0, price - depositAmount);

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline gap-2">
        <span className={`text-namora-ink tracking-tight ${sizeStyles}`}>
          ₹{price.toLocaleString('en-IN')}
        </span>
        {originalPrice && originalPrice > price && (
          <span className="text-xs sm:text-sm text-namora-muted line-through font-light">
            ₹{originalPrice.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {showDepositBadge && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] font-mono font-medium text-namora-gold">
            ₹{depositAmount} advance
          </span>
          <span className="text-namora-muted text-xs">&bull;</span>
          <span className="text-[11px] font-mono text-namora-muted">
            ₹{codBalance} COD
          </span>
        </div>
      )}
    </div>
  );
}

export interface QuantityControlProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityControl({
  quantity,
  onIncrement,
  onDecrement,
  min = 1,
  max = 10,
  className = '',
}: QuantityControlProps) {
  return (
    <div
      className={`inline-flex items-center border border-namora-line bg-namora-bg rounded-md overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
        className="w-8 h-8 flex items-center justify-center text-namora-ink hover:bg-namora-soft disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        &minus;
      </button>
      <span className="w-9 text-center text-xs font-mono font-semibold text-namora-ink select-none">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        className="w-8 h-8 flex items-center justify-center text-namora-ink hover:bg-namora-soft disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        &#43;
      </button>
    </div>
  );
}
