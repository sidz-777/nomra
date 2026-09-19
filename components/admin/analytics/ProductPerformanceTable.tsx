'use client';

import React from 'react';
import { ProductPerformanceItem } from '@/lib/analytics/types';

interface ProductPerformanceTableProps {
  products: ProductPerformanceItem[];
  totalRevenue: number;
  totalUnits: number;
  loading?: boolean;
}

export default function ProductPerformanceTable({
  products,
  totalRevenue,
  totalUnits,
  loading = false,
}: ProductPerformanceTableProps) {
  if (loading) {
    return (
      <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-8 text-center text-xs font-mono text-[#A39684]">
        Loading product sales intelligence...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-8 text-center text-xs font-mono text-[#A39684]">
        No product sales recorded in the selected timeframe.
      </div>
    );
  }

  return (
    <div className="bg-[#181614] border border-[#2D2722] rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-[#2D2722] flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#F5EFE6]">
            Top Performing Products &amp; Frames
          </h3>
          <p className="text-xs font-mono text-[#8C7D6B]">
            Sales volume, revenue contribution, and gift packaging attachment
          </p>
        </div>
        <div className="text-right font-mono text-xs text-[#D4AF6A]">
          Total Volume: <strong>{totalUnits} units</strong> (₹{totalRevenue.toLocaleString('en-IN')})
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#121110] text-[#A39684] uppercase text-[10px] tracking-wider border-b border-[#2D2722]">
            <tr>
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Product Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-center">Units Sold</th>
              <th className="py-3 px-4 text-right">Gross Sales</th>
              <th className="py-3 px-4 text-center">Gift Wraps</th>
              <th className="py-3 px-4 text-right">Current Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#24201C] text-[#E8DCCB]">
            {products.map((p, idx) => {
              const revPct = totalRevenue > 0 ? Math.round((p.gross_sales / totalRevenue) * 100) : 0;
              return (
                <tr key={p.product_id} className="hover:bg-[#201D1A] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#D4AF6A]">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#F5EFE6] truncate max-w-xs" title={p.title}>
                      {p.title}
                    </div>
                    <div className="text-[10px] text-[#8C7D6B]">{p.product_id}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[#A39684]">
                    {p.category}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#F5EFE6]">
                    {p.units_sold}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#D4AF6A]">
                    ₹{p.gross_sales.toLocaleString('en-IN')}
                    <span className="text-[10px] font-normal text-[#8C7D6B] ml-1.5">
                      ({revPct}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {p.gift_attach_count > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-900/30 text-purple-300 border border-purple-500/20 text-[10px]">
                        🎁 {p.gift_attach_count}
                      </span>
                    ) : (
                      <span className="text-[#685D50]">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {p.current_stock <= 0 ? (
                      <span className="text-rose-400 font-bold">0 (Out)</span>
                    ) : p.current_stock <= 5 ? (
                      <span className="text-amber-400 font-bold">{p.current_stock} (Low)</span>
                    ) : (
                      <span className="text-emerald-400">{p.current_stock}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
