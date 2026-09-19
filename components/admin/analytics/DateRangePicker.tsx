'use client';

import React, { useState } from 'react';
import { AnalyticsTimeframe } from '@/lib/analytics/types';

interface DateRangePickerProps {
  timeframe: AnalyticsTimeframe;
  onTimeframeChange: (tf: AnalyticsTimeframe, start?: string, end?: string) => void;
  dateRangeLabel?: string;
  loading?: boolean;
}

export default function DateRangePicker({
  timeframe,
  onTimeframeChange,
  dateRangeLabel,
  loading = false,
}: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(timeframe === 'custom');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const presets: Array<{ id: AnalyticsTimeframe; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'previous_month', label: 'Last Month' },
    { id: 'all', label: 'All Time' },
  ];

  const handlePreset = (id: AnalyticsTimeframe) => {
    setShowCustom(false);
    onTimeframeChange(id);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      onTimeframeChange('custom', customStart, customEnd);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#171614] border border-[#2D2722] p-1.5 rounded-xl">
        {presets.map((p) => {
          const isActive = timeframe === p.id && !showCustom;
          return (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id)}
              disabled={loading}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
                isActive
                  ? 'bg-[#D4AF6A] text-[#12131a] font-bold shadow'
                  : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#25221E]'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {p.label}
            </button>
          );
        })}

        <button
          onClick={() => setShowCustom(!showCustom)}
          disabled={loading}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
            timeframe === 'custom' || showCustom
              ? 'bg-[#D4AF6A]/20 text-[#D4AF6A] border border-[#D4AF6A]/40 font-bold'
              : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#25221E]'
          }`}
        >
          📅 Custom Range
        </button>
      </div>

      {/* Custom Date Inputs Modal / Tray */}
      {showCustom && (
        <form
          onSubmit={handleApplyCustom}
          className="flex flex-wrap items-center gap-2.5 bg-[#1B1916] border border-[#3A332C] p-3 rounded-xl animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-mono text-[#A39684] uppercase">From:</label>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-[#121110] border border-[#3A332C] rounded-lg px-2.5 py-1 text-xs text-[#F5EFE6] font-mono focus:border-[#D4AF6A] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-mono text-[#A39684] uppercase">To:</label>
            <input
              type="date"
              required
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-[#121110] border border-[#3A332C] rounded-lg px-2.5 py-1 text-xs text-[#F5EFE6] font-mono focus:border-[#D4AF6A] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1 bg-[#D4AF6A] text-[#12131a] rounded-lg text-xs font-mono font-bold hover:bg-[#E5C17B] transition-colors"
          >
            Apply Range
          </button>
        </form>
      )}

      {/* Active Timezone Notice */}
      {dateRangeLabel && (
        <div className="text-[11px] font-mono text-[#8C7D6B] flex items-center gap-1.5 px-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4AF6A]" />
          <span>Active Window: <strong className="text-[#F5EFE6]">{dateRangeLabel}</strong> (India Standard Time)</span>
        </div>
      )}
    </div>
  );
}
