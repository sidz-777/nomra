'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { STATUS_LABELS, STATUS_COLORS, VALID_ORDER_STATUSES } from '@/lib/admin/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (workflowFilter !== 'all') params.append('workflow', workflowFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '25');

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, workflowFilter, statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const workflows = [
    { id: 'all', label: 'All Orders', icon: '📋' },
    { id: 'needs_production', label: 'Needs Production', icon: '⚡' },
    { id: 'studio_review', label: 'Studio Review', icon: '🎨' },
    { id: 'ready_dispatch', label: 'Ready to Ship', icon: '📦' },
    { id: 'dispatched', label: 'Dispatched', icon: '🚚' },
    { id: 'completed', label: 'Delivered', icon: '✅' },
    { id: 'cancelled', label: 'Cancelled', icon: '❌' },
  ];

  return (
    <AdminGuard requiredRoles={['owner', 'admin', 'staff']}>
      <AdminLayoutClient title="Order Management & Fulfillment">
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
          {/* Header & Stats bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#F5EFE6]">
                Orders &amp; Dispatch Queue
              </h1>
              <p className="text-xs text-[#A39684] mt-1 font-mono">
                {total} order{total === 1 ? '' : 's'} recorded • Live Supabase synchronization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchOrders()}
                className="px-4 py-2 bg-[#1E1B18] hover:bg-[#2A2420] text-[#D4AF6A] border border-[#2D2722] hover:border-[#D4AF6A]/50 rounded-lg text-xs font-mono transition-all flex items-center gap-2"
              >
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>

          {/* Workflow Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#2D2722] no-scrollbar">
            {workflows.map((wf) => {
              const active = workflowFilter === wf.id;
              return (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => {
                    setWorkflowFilter(wf.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-mono shrink-0 transition-all flex items-center gap-2 border ${
                    active
                      ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] border-[#D4AF6A] font-semibold'
                      : 'bg-[#141210] text-[#A39684] border-[#2D2722] hover:border-[#D4AF6A]/40 hover:text-[#F5EFE6]'
                  }`}
                >
                  <span>{wf.icon}</span>
                  <span>{wf.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#141210] p-4 rounded-xl border border-[#2D2722]">
            <div className="md:col-span-2 relative">
              <input
                type="text"
                placeholder="Search by Order #, Customer Name, Phone, or Artwork..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] px-4 py-2.5 rounded-lg text-xs font-mono outline-none transition-all placeholder-[#736B63]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-2.5 text-xs text-[#A39684] hover:text-[#F5EFE6]"
                >
                  ✕
                </button>
              )}
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] px-4 py-2.5 rounded-lg text-xs font-mono outline-none transition-all cursor-pointer"
              >
                <option value="all">All Specific Statuses</option>
                {VALID_ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st] || st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-mono">
              ⚠️ {error}
            </div>
          )}

          {/* Orders Content */}
          {loading ? (
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-12 text-center text-xs font-mono text-[#A39684]">
              <div className="inline-block animate-spin text-2xl mb-3">⏳</div>
              <p>Loading authoritative order pipeline...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-12 text-center text-xs font-mono text-[#A39684]">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-[#F5EFE6] font-semibold text-sm mb-1">No orders found</p>
              <p>No orders match the selected filters or search criteria.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (>= 768px) */}
              <div className="hidden md:block bg-[#141210] rounded-xl border border-[#2D2722] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#1A1816] text-[#A39684] border-b border-[#2D2722] font-mono uppercase tracking-wider">
                        <th className="p-4 font-semibold">Order</th>
                        <th className="p-4 font-semibold">Customer</th>
                        <th className="p-4 font-semibold">Artisanal Details</th>
                        <th className="p-4 font-semibold">Financials</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D2722] font-mono">
                      {orders.map((order) => {
                        const style = STATUS_COLORS[order.status] || {
                          bg: 'bg-zinc-800',
                          text: 'text-zinc-400',
                          border: 'border-zinc-700',
                        };
                        const items = order.items || [];
                        const primaryItem = items[0] || {};
                        const dateStr = order.created_at
                          ? new Date(order.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—';

                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-[#1E1B18]/60 transition-colors group"
                          >
                            <td className="p-4 align-top">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="font-bold text-[#D4AF6A] hover:underline block text-sm"
                              >
                                {order.order_number || `#${order.id.slice(0, 8)}`}
                              </Link>
                              <div className="text-[11px] text-[#A39684] mt-0.5">{dateStr}</div>
                              {order.tracking_number && (
                                <div className="text-[10px] text-teal-400 mt-1 flex items-center gap-1">
                                  <span>🚚</span>
                                  <span className="truncate max-w-[120px]">{order.tracking_number}</span>
                                </div>
                              )}
                            </td>

                            <td className="p-4 align-top">
                              <div className="font-semibold text-[#F5EFE6]">
                                {order.customer_name || 'Anonymous Customer'}
                              </div>
                              <div className="text-[11px] text-[#A39684] flex items-center gap-1 mt-0.5">
                                <span>📞</span> {order.phone || 'No phone'}
                              </div>
                              <div className="text-[10px] text-[#736B63] mt-1 truncate max-w-[180px]">
                                {[order.city, order.state].filter(Boolean).join(', ') || order.address || '—'}
                              </div>
                            </td>

                            <td className="p-4 align-top">
                              <div className="text-[#F5EFE6] font-medium">
                                {primaryItem.product_title || `${items.length} item(s)`}
                              </div>
                              {primaryItem.english_name || primaryItem.arabic_name ? (
                                <div className="text-[11px] text-[#D4AF6A] mt-0.5">
                                  {primaryItem.english_name}
                                  {primaryItem.arabic_name ? ` • ${primaryItem.arabic_name}` : ''}
                                </div>
                              ) : null}
                              {items.length > 1 && (
                                <div className="text-[10px] text-[#A39684] mt-0.5">
                                  +{items.length - 1} more item(s)
                                </div>
                              )}
                            </td>

                            <td className="p-4 align-top">
                              <div className="font-bold text-[#F5EFE6]">
                                ₹{order.total_amount ?? 0}
                              </div>
                              <div className="text-[10px] text-emerald-400 mt-0.5">
                                Deposit: ₹{order.deposit_amount ?? 0}
                              </div>
                              <div className="text-[10px] text-amber-400">
                                COD Due: ₹{order.cod_amount ?? 0}
                              </div>
                            </td>

                            <td className="p-4 align-top">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${style.bg} ${style.text} ${style.border}`}
                              >
                                {STATUS_LABELS[order.status] || order.status}
                              </span>
                            </td>

                            <td className="p-4 align-top text-right">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1E1B18] hover:bg-[#D4AF6A] text-[#D4AF6A] hover:text-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] rounded-lg text-xs font-mono font-medium transition-all"
                              >
                                <span>Inspect &amp; Fulfill</span>
                                <span>→</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE STACKED CARDS (< 768px) */}
              <div className="md:hidden flex flex-col gap-3">
                {orders.map((order) => {
                  const style = STATUS_COLORS[order.status] || {
                    bg: 'bg-zinc-800',
                    text: 'text-zinc-400',
                    border: 'border-zinc-700',
                  };
                  const items = order.items || [];
                  const primaryItem = items[0] || {};
                  const dateStr = order.created_at
                    ? new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })
                    : '—';

                  return (
                    <div
                      key={order.id}
                      className="bg-[#141210] p-4 rounded-xl border border-[#2D2722] flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono font-bold text-[#D4AF6A] text-sm hover:underline"
                          >
                            {order.order_number || `#${order.id.slice(0, 8)}`}
                          </Link>
                          <div className="text-[10px] font-mono text-[#A39684]">{dateStr}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>

                      <div className="text-xs font-mono">
                        <div className="text-[#F5EFE6] font-semibold">{order.customer_name}</div>
                        <div className="text-[#A39684] text-[11px]">{order.phone}</div>
                      </div>

                      <div className="bg-[#1E1B18] p-2.5 rounded-lg border border-[#2D2722]/60 text-xs font-mono">
                        <div className="text-[#F5EFE6] font-medium truncate">
                          {primaryItem.product_title || 'Artisanal Frame'}
                        </div>
                        {primaryItem.english_name && (
                          <div className="text-[11px] text-[#D4AF6A] mt-0.5 truncate">
                            {primaryItem.english_name} {primaryItem.arabic_name ? `• ${primaryItem.arabic_name}` : ''}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-[#2D2722]">
                        <div>
                          <span className="text-[#A39684]">Total: </span>
                          <span className="font-bold text-[#F5EFE6]">₹{order.total_amount ?? 0}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-amber-400">COD: ₹{order.cod_amount ?? 0}</span>
                        </div>
                      </div>

                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="w-full text-center py-2 bg-[#1E1B18] hover:bg-[#D4AF6A] text-[#D4AF6A] hover:text-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] rounded-lg text-xs font-mono font-semibold transition-all"
                      >
                        Inspect &amp; Fulfill Order →
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-[#141210] p-4 rounded-xl border border-[#2D2722] text-xs font-mono text-[#A39684]">
                  <div>
                    Page <span className="text-[#F5EFE6] font-semibold">{page}</span> of{' '}
                    <span className="text-[#F5EFE6] font-semibold">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 bg-[#1E1B18] border border-[#2D2722] rounded disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#D4AF6A] text-[#F5EFE6]"
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 bg-[#1E1B18] border border-[#2D2722] rounded disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#D4AF6A] text-[#F5EFE6]"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
