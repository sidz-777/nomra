'use client';

import React, { useState } from 'react';
import { AnalyticsTimeframe } from '@/lib/analytics/types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeframe: AnalyticsTimeframe;
  startDate?: string;
  endDate?: string;
}

export default function ExportModal({
  isOpen,
  onClose,
  timeframe,
  startDate,
  endDate,
}: ExportModalProps) {
  const [reportType, setReportType] = useState<'orders' | 'products' | 'inventory' | 'financial'>('orders');
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloading(true);
    const params = new URLSearchParams();
    params.set('report', reportType);
    params.set('timeframe', timeframe);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    // Trigger download via direct window navigation
    window.location.href = `/api/admin/analytics/export?${params.toString()}`;
    setTimeout(() => {
      setDownloading(false);
      onClose();
    }, 1200);
  };

  const reports = [
    { id: 'orders', title: 'Orders Ledger Report', desc: 'Order status, payment method, advance deposit, COD balance, tracking and city.' },
    { id: 'products', title: 'Product Sales Report', desc: 'Product titles, sales counts, gross revenues, and gift wrap attach rates.' },
    { id: 'inventory', title: 'Inventory Health Report', desc: 'Catalog SKUs, current stock balances, price, and out-of-stock statuses.' },
    { id: 'financial', title: 'Executive Financial Summary', desc: 'High-level financial KPIs: GOV, advance deposits, COD outstanding, and AOV.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#181614] border border-[#3A332C] rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#2D2722] mb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#F5EFE6]">
              Export Business Intelligence Report
            </h3>
            <p className="text-xs font-mono text-[#8C7D6B]">
              Standard RFC 4180 CSV with UTF-8 BOM &amp; injection guards
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C7D6B] hover:text-[#F5EFE6] text-sm p-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {reports.map((r) => (
            <label
              key={r.id}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                reportType === r.id
                  ? 'bg-[#D4AF6A]/15 border-[#D4AF6A]/50 text-[#F5EFE6]'
                  : 'bg-[#121110] border-[#26221D] text-[#A39684] hover:border-[#3A332C]'
              }`}
            >
              <input
                type="radio"
                name="reportType"
                value={r.id}
                checked={reportType === r.id}
                onChange={() => setReportType(r.id as any)}
                className="mt-1 text-[#D4AF6A] focus:ring-0"
              />
              <div>
                <div className="text-xs font-mono font-bold text-[#F5EFE6]">{r.title}</div>
                <div className="text-[11px] text-[#8C7D6B] mt-0.5 leading-snug">{r.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2D2722]">
          <button
            type="button"
            onClick={onClose}
            disabled={downloading}
            className="px-4 py-2 text-xs font-mono text-[#A39684] hover:text-[#F5EFE6] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2 bg-[#D4AF6A] text-[#12131a] rounded-xl text-xs font-mono font-bold hover:bg-[#E5C17B] transition-colors shadow-lg flex items-center gap-2"
          >
            {downloading ? 'Preparing CSV...' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
