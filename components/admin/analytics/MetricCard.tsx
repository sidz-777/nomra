'use client';

import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: string;
  trend?: {
    positive?: boolean;
    text: string;
  };
  highlight?: boolean;
  tooltip?: string;
}

export default function MetricCard({
  label,
  value,
  subValue,
  icon,
  trend,
  highlight = false,
  tooltip,
}: MetricCardProps) {
  return (
    <div
      title={tooltip}
      className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
        highlight
          ? 'bg-[#D4AF6A]/10 border-[#D4AF6A]/40 shadow-lg shadow-[#D4AF6A]/5'
          : 'bg-[#181614] border-[#2D2722] hover:border-[#3D352E]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-[#A39684]">
          {label}
        </span>
        {icon && <span className="text-lg opacity-80">{icon}</span>}
      </div>

      <div className="text-2xl font-serif font-bold text-[#F5EFE6] tracking-tight mb-1">
        {value}
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-[#8C7D6B]">
        {subValue && <span>{subValue}</span>}
        {trend && (
          <span
            className={`font-semibold ${
              trend.positive ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {trend.text}
          </span>
        )}
      </div>

      {highlight && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#D4AF6A]/20 to-transparent pointer-events-none rounded-bl-full" />
      )}
    </div>
  );
}
