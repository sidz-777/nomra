'use client';

import React from 'react';
import { PipelineBreakdown } from '@/lib/analytics/types';

interface PipelineFunnelProps {
  pipeline: PipelineBreakdown;
  totalOrders: number;
}

export default function PipelineFunnel({ pipeline, totalOrders }: PipelineFunnelProps) {
  const stages: Array<{
    key: keyof PipelineBreakdown;
    label: string;
    icon: string;
    color: string;
    bg: string;
  }> = [
    { key: 'pending', label: 'Pending Payment', icon: '⏳', color: 'text-amber-300', bg: 'bg-amber-400/10 border-amber-400/20' },
    { key: 'confirmed', label: 'Confirmed (Paid)', icon: '✅', color: 'text-emerald-300', bg: 'bg-emerald-400/10 border-emerald-400/20' },
    { key: 'studio_review', label: 'Studio Calligraphy', icon: '✒️', color: 'text-indigo-300', bg: 'bg-indigo-400/10 border-indigo-400/20' },
    { key: 'in_production', label: 'Frame Assembly', icon: '🛠️', color: 'text-blue-300', bg: 'bg-blue-400/10 border-blue-400/20' },
    { key: 'ready_to_ship', label: 'Quality & Packed', icon: '🎁', color: 'text-purple-300', bg: 'bg-purple-400/10 border-purple-400/20' },
    { key: 'in_transit', label: 'Dispatched / In Transit', icon: '🚚', color: 'text-cyan-300', bg: 'bg-cyan-400/10 border-cyan-400/20' },
    { key: 'delivered', label: 'Delivered (COD Realized)', icon: '🏆', color: 'text-[#D4AF6A]', bg: 'bg-[#D4AF6A]/15 border-[#D4AF6A]/30' },
    { key: 'cancelled', label: 'Cancelled / Returned', icon: '✖️', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
  ];

  return (
    <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#F5EFE6]">
            8-Stage Fulfillment Pipeline
          </h3>
          <p className="text-xs font-mono text-[#8C7D6B]">
            Real-time status distribution across total window volume ({totalOrders} orders)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {stages.map((st) => {
          const count = pipeline[st.key] || 0;
          const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;

          return (
            <div
              key={st.key}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${st.bg}`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span>{st.icon}</span>
                <span className="font-mono text-[10px] text-[#A39684]">{pct}%</span>
              </div>
              <div>
                <div className={`text-xl font-bold font-mono tracking-tight ${st.color}`}>
                  {count}
                </div>
                <div className="text-[11px] font-mono text-[#C4B6A5] leading-snug truncate mt-0.5" title={st.label}>
                  {st.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
