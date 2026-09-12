import React from 'react';

export interface DividerProps {
  withDiamond?: boolean;
  className?: string;
}

export function Divider({ withDiamond = true, className = '' }: DividerProps) {
  return (
    <div className={`relative flex items-center justify-center my-8 ${className}`}>
      <div className="w-full border-t border-namora-line" />
      {withDiamond && (
        <span className="absolute bg-namora-bg px-3 flex items-center justify-center">
          <span className="w-2 h-2 rotate-45 border border-namora-gold bg-namora-gold/20" />
        </span>
      )}
    </div>
  );
}
