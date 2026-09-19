'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import {
  NotificationLog,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_STATUS_COLORS,
} from '@/lib/notifications/types';

export default function AdminNotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ total: 0, sent: 0, failed: 0, pending: 0 });
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchOrder, setSearchOrder] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (channelFilter !== 'all') params.set('channel', channelFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (searchOrder.trim()) params.set('order_number', searchOrder.trim());

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        if (data.kpis) setKpis(data.kpis);
      }
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [channelFilter, statusFilter, typeFilter, searchOrder]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: logId }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Notification successfully dispatched via mock adapter.' });
        fetchLogs();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Retry attempt failed.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Network error retrying notification.' });
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <AdminGuard requiredRoles={['owner', 'admin', 'staff']}>
      <AdminLayoutClient title="Customer Notification Center">
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-luxury text-2xl sm:text-3xl font-bold text-[#F5EFE6] tracking-tight">
                Customer Notifications
              </h1>
              <p className="text-xs sm:text-sm text-[#A39684] mt-1">
                Monitor durable multi-channel delivery, inspect failures, and execute safe administrative retries.
              </p>
            </div>
            <Link
              href="/admin/settings/notifications"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D4AF6A]/30 bg-[#D4AF6A]/10 text-[#D4AF6A] hover:bg-[#D4AF6A]/20 text-xs font-semibold transition"
            >
              <span>⚙️</span>
              <span>Channel Settings</span>
            </Link>
          </div>

          {/* Test Mode Banner */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-3 text-xs text-amber-300">
            <span className="text-lg">🛡️</span>
            <div>
              <strong className="text-amber-200 font-semibold block">Phase 4 Mock Mode Active</strong>
              <span>
                All notification channels (WhatsApp, Email, SMS) are safely simulated via mock adapters. No external SMS credits or WhatsApp template charges are incurred.
              </span>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
                feedback.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                  : 'border-red-500/30 bg-red-950/30 text-red-300'
              }`}
            >
              <span>{feedback.message}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl border border-[#2A241C] bg-[#17130E] space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#A39684]">Total Enqueued</span>
              <div className="text-2xl font-bold font-mono text-[#F5EFE6]">{kpis.total}</div>
            </div>
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">Delivered / Sent</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">{kpis.sent}</div>
            </div>
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/10 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-red-400">Failed Dispatches</span>
              <div className="text-2xl font-bold font-mono text-red-400">{kpis.failed}</div>
            </div>
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400">Pending / Lease</span>
              <div className="text-2xl font-bold font-mono text-amber-400">{kpis.pending}</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-xl border border-[#2A241C] bg-[#17130E] flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <input
                type="text"
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
                placeholder="Search by Order #..."
                className="px-3.5 py-2 rounded-lg border border-[#2A241C] bg-[#0E0C0A] text-[#F5EFE6] text-xs font-mono focus:outline-none focus:border-[#D4AF6A] transition w-full sm:w-44"
              />

              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#2A241C] bg-[#0E0C0A] text-[#F5EFE6] text-xs focus:outline-none focus:border-[#D4AF6A] transition"
              >
                <option value="all">All Channels</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#2A241C] bg-[#0E0C0A] text-[#F5EFE6] text-xs focus:outline-none focus:border-[#D4AF6A] transition"
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="sending">Sending</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#2A241C] bg-[#0E0C0A] text-[#F5EFE6] text-xs focus:outline-none focus:border-[#D4AF6A] transition"
              >
                <option value="all">All Event Types</option>
                <option value="order_confirmed">Order Confirmed</option>
                <option value="payment_confirmed">Payment Verified</option>
                <option value="order_processing">Artisan Preparation</option>
                <option value="personalization_review">Personalization Review</option>
                <option value="ready_to_ship">Ready to Ship</option>
                <option value="shipped">Dispatched</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            <button
              type="button"
              onClick={fetchLogs}
              className="px-3 py-2 rounded-lg border border-[#2A241C] hover:bg-[#2A241C]/30 text-xs text-[#A39684] hover:text-[#F5EFE6] transition whitespace-nowrap self-end md:self-auto"
            >
              ↻ Refresh Logs
            </button>
          </div>

          {/* Logs Table */}
          <div className="rounded-xl border border-[#2A241C] bg-[#17130E] overflow-hidden shadow-luxury">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#2A241C] bg-[#0E0C0A]/60 text-[11px] font-mono uppercase text-[#A39684]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Order Reference</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A241C]">
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#A39684] font-mono">
                        Loading notification ledgers...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#A39684]">
                        No notification records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const statusStyle =
                        NOTIFICATION_STATUS_COLORS[log.status] || NOTIFICATION_STATUS_COLORS.pending;
                      const isRetrying = retryingId === log.id;

                      return (
                        <tr key={log.id} className="hover:bg-[#2A241C]/20 transition">
                          <td className="py-3 px-4 font-mono text-[11px] text-[#A39684] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#D4AF6A] whitespace-nowrap">
                            <Link href={`/admin/orders/${log.order_id || log.order_number}`} className="hover:underline">
                              {log.order_number}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-[#F5EFE6] font-medium whitespace-nowrap">
                            {NOTIFICATION_TYPE_LABELS[log.notification_type] || log.notification_type}
                          </td>
                          <td className="py-3 px-4 font-mono uppercase text-[10px] text-[#A39684] whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded border border-[#2A241C] bg-[#0E0C0A]">
                              {log.channel}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#A39684] whitespace-nowrap">
                            {log.masked_recipient}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1"
                              style={{
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.text,
                                border: `1px solid ${statusStyle.border}`,
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.text }} />
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#A39684] whitespace-nowrap">
                            {log.provider}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {log.status === 'failed' ? (
                              <button
                                type="button"
                                onClick={() => handleRetry(log.id)}
                                disabled={isRetrying}
                                className="px-2.5 py-1 rounded bg-red-900/40 hover:bg-red-800/60 border border-red-500/40 text-red-200 text-[11px] font-semibold transition disabled:opacity-50"
                              >
                                {isRetrying ? 'Retrying...' : '↻ Retry'}
                              </button>
                            ) : (
                              <span className="text-[#A39684]/50 text-[11px] font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
