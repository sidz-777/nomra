'use client';

import React from 'react';
import { TrackingOrderSafe, TrackingItemSafe } from '@/lib/tracking/types';
import { getStatusConfig, buildMilestones, buildOrderInquiryWhatsAppUrl } from '@/lib/tracking/status-mapper';

interface TrackOrderCardProps {
  order: TrackingOrderSafe;
  items?: TrackingItemSafe[];
}

export function TrackOrderCard({ order, items = [] }: TrackOrderCardProps) {
  const statusCfg = getStatusConfig(order.status);
  const milestones = buildMilestones(order);
  const isNegativeStatus = statusCfg.step < 0;
  const whatsappUrl = buildOrderInquiryWhatsAppUrl(order.order_number);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Order Summary Badge */}
      <div className="p-4 rounded-xl border border-namora-gold/25 bg-namora-gold/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="font-luxury font-bold text-base sm:text-lg text-namora-ink tracking-wide">
            Order #{order.order_number}
          </div>
          <div className="text-xs text-namora-muted mt-0.5">
            Customer: <strong className="text-namora-ink font-semibold">{order.customer_name}</strong>
          </div>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 shadow-sm"
          style={{
            backgroundColor: statusCfg.bg,
            color: statusCfg.color,
            border: `1px solid ${statusCfg.color}`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.color }} />
          {statusCfg.label}
        </span>
      </div>

      {/* 2. Express Courier Dispatch Card (if assigned) */}
      {(order.courier_name || order.tracking_number) && (
        <div className="p-4 rounded-xl border border-namora-gold/30 bg-namora-gold/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-namora-gold font-semibold">
              Express Courier Dispatch
            </div>
            <div className="font-bold text-sm sm:text-base text-namora-ink mt-0.5">
              {order.courier_name || 'Standard Courier'}
            </div>
            <div className="text-xs font-mono text-namora-muted mt-0.5">
              AWB: {order.tracking_number || 'Pending Assignment'}
            </div>
          </div>
          {order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-namora-gold text-black font-bold text-xs hover:bg-namora-gold-hover transition shadow-sm"
            >
              Track on {order.courier_name || 'Carrier'} &nearr;
            </a>
          )}
        </div>
      )}

      {/* 3. Payment Balance Breakdown Card */}
      <div className="p-4 rounded-xl border border-namora-line bg-namora-card space-y-2">
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-namora-muted">Total Order Value:</span>
          <strong className="text-namora-ink font-mono">₹{order.total_amount}</strong>
        </div>
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-namora-muted">Advance Deposit Paid:</span>
          <strong className="text-emerald-400 font-mono">₹{order.deposit_amount}</strong>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-dashed border-namora-line text-sm sm:text-base">
          <span className="font-bold text-namora-gold">Balance Due on Delivery (COD):</span>
          <strong className="text-namora-gold font-mono text-base sm:text-lg">₹{order.cod_amount}</strong>
        </div>
      </div>

      {/* 4. Handcrafted Frame Items Card */}
      {items.length > 0 && (
        <div className="p-4 rounded-xl border border-namora-line bg-namora-card space-y-3">
          <div className="text-[10px] uppercase font-mono tracking-widest text-namora-muted font-semibold">
            Handcrafted Frame Items ({items.length})
          </div>
          <div className="divide-y divide-namora-line-soft">
            {items.map((item, idx) => (
              <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center gap-3">
                <div>
                  <div className="font-semibold text-xs sm:text-sm text-namora-ink">
                    {item.product_title}
                  </div>
                  <div className="text-[11px] text-namora-gold mt-0.5 flex flex-wrap items-center gap-1.5">
                    {item.english_name && (
                      <span>
                        Name: <strong className="text-namora-ink">{item.english_name}</strong>
                      </span>
                    )}
                    {item.arabic_name && <span>({item.arabic_name})</span>}
                    {item.has_gift && (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        🎁 Gift Box Included
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right font-mono font-semibold text-xs sm:text-sm text-namora-ink flex-shrink-0">
                  ₹{item.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Stepper or Negative Status Banner */}
      {isNegativeStatus ? (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-center text-xs text-red-300 space-y-1">
          <div className="text-base">⚠️</div>
          <p>
            This order is currently marked as <strong className="text-red-200">{statusCfg.label}</strong>.
          </p>
          <p className="text-red-400/90 text-[11px]">
            If you have questions regarding your deposit refund, remake, or courier return, please contact our concierge team.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-namora-line bg-namora-card">
          <div className="text-[10px] uppercase font-mono tracking-widest text-namora-muted font-semibold mb-4">
            Production &amp; Logistics Timeline
          </div>
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-namora-line">
            {milestones.map((m) => {
              const isCompleted = m.state === 'completed';
              const isActive = m.state === 'active';

              return (
                <div key={m.stepNumber} className="relative flex items-start gap-3">
                  {/* Step Dot */}
                  <div
                    className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isCompleted
                        ? 'bg-namora-gold text-black border-namora-gold ring-2 ring-namora-gold/30'
                        : isActive
                        ? 'bg-lime-400 text-black border-lime-400 shadow-md ring-4 ring-lime-400/30 animate-pulse'
                        : 'bg-namora-soft text-namora-muted border border-namora-line'
                    }`}
                  >
                    {isCompleted ? '✓' : isActive ? '●' : m.stepNumber}
                  </div>

                  {/* Step Details */}
                  <div className="pt-0.5">
                    <div
                      className={`text-xs sm:text-sm font-semibold leading-tight ${
                        isActive
                          ? 'text-lime-400'
                          : isCompleted
                          ? 'text-namora-ink'
                          : 'text-namora-muted'
                      }`}
                    >
                      {m.title}
                    </div>
                    <div className="text-[11px] text-namora-muted mt-0.5 leading-relaxed">
                      {m.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. WhatsApp Concierge Inquiry Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-sm"
      >
        <span>💬</span>
        <span>Inquire with NAMORA Concierge on WhatsApp</span>
      </a>
    </div>
  );
}
