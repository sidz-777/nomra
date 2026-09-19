'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('total_spent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', '25');

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.error || 'Failed to load customers');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <AdminGuard requiredRoles={['owner', 'admin']}>
      <AdminLayoutClient title="Customer Directory & CRM">
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
          {/* Header & Stats bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#F5EFE6]">
                Customer CRM Directory
              </h1>
              <p className="text-xs text-[#A39684] mt-1 font-mono">
                {total} registered customer{total === 1 ? '' : 's'} • Live Supabase profiles &amp; order history
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchCustomers()}
                className="px-4 py-2 bg-[#1E1B18] hover:bg-[#2A2420] text-[#D4AF6A] border border-[#2D2722] hover:border-[#D4AF6A]/50 rounded-lg text-xs font-mono transition-all flex items-center gap-2"
              >
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>

          {/* Search & Sorting Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#141210] p-4 rounded-xl border border-[#2D2722]">
            <div className="md:col-span-2 relative">
              <input
                type="text"
                placeholder="Search customers by name, phone, or email..."
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
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] px-4 py-2.5 rounded-lg text-xs font-mono outline-none transition-all cursor-pointer"
              >
                <option value="total_spent">Sort by Lifetime Value (LTV)</option>
                <option value="total_orders">Sort by Total Orders</option>
                <option value="created_at">Sort by Registration Date</option>
                <option value="name">Sort Alphabetically</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-mono">
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-12 text-center text-xs font-mono text-[#A39684]">
              <div className="inline-block animate-spin text-2xl mb-3">⏳</div>
              <p>Loading customer directory...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-12 text-center text-xs font-mono text-[#A39684]">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-[#F5EFE6] font-semibold text-sm mb-1">No customers found</p>
              <p>No customers match the current search criteria.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block bg-[#141210] rounded-xl border border-[#2D2722] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#1A1816] text-[#A39684] border-b border-[#2D2722] font-mono uppercase tracking-wider">
                        <th className="p-4 font-semibold">Customer</th>
                        <th className="p-4 font-semibold">Contact</th>
                        <th className="p-4 font-semibold text-center">Orders</th>
                        <th className="p-4 font-semibold">Total Spent</th>
                        <th className="p-4 font-semibold">Customer Since</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D2722] font-mono">
                      {customers.map((c) => {
                        const targetId = c.id || c.phone;
                        const waPhone = (c.phone || '').replace(/[^0-9]/g, '');

                        return (
                          <tr key={c.id || c.phone} className="hover:bg-[#1E1B18]/60 transition-colors">
                            <td className="p-4">
                              <Link
                                href={`/admin/customers/${encodeURIComponent(targetId)}`}
                                className="font-bold text-[#D4AF6A] hover:underline text-sm block"
                              >
                                {c.name || 'Anonymous Customer'}
                              </Link>
                              {c.email && (
                                <div className="text-[11px] text-[#A39684] mt-0.5">{c.email}</div>
                              )}
                            </td>

                            <td className="p-4">
                              <div className="text-[#F5EFE6]">{c.phone || '—'}</div>
                              {waPhone && (
                                <a
                                  href={`https://wa.me/${waPhone.length === 10 ? '91' + waPhone : waPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-emerald-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                                >
                                  <span>💬</span> WhatsApp
                                </a>
                              )}
                            </td>

                            <td className="p-4 text-center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#1E1B18] text-[#F5EFE6] border border-[#2D2722] font-bold">
                                {c.total_orders || c.order_count || 1}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="font-bold text-emerald-400 text-sm">
                                ₹{c.total_spent ?? 0}
                              </div>
                            </td>

                            <td className="p-4 text-[#A39684]">
                              {c.created_at
                                ? new Date(c.created_at).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>

                            <td className="p-4 text-right">
                              <Link
                                href={`/admin/customers/${encodeURIComponent(targetId)}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1E1B18] hover:bg-[#D4AF6A] text-[#D4AF6A] hover:text-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] rounded-lg text-xs font-medium transition-all"
                              >
                                <span>Profile &amp; History</span>
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

              {/* MOBILE CARDS */}
              <div className="md:hidden flex flex-col gap-3">
                {customers.map((c) => {
                  const targetId = c.id || c.phone;
                  return (
                    <div
                      key={c.id || c.phone}
                      className="bg-[#141210] p-4 rounded-xl border border-[#2D2722] flex flex-col gap-3 font-mono"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/admin/customers/${encodeURIComponent(targetId)}`}
                            className="font-bold text-[#D4AF6A] text-sm hover:underline"
                          >
                            {c.name || 'Anonymous Customer'}
                          </Link>
                          <div className="text-xs text-[#A39684] mt-0.5">{c.phone || '—'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-400">
                            ₹{c.total_spent ?? 0}
                          </div>
                          <div className="text-[10px] text-[#A39684]">
                            {c.total_orders || c.order_count || 1} order(s)
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/admin/customers/${encodeURIComponent(targetId)}`}
                        className="w-full text-center py-2 bg-[#1E1B18] hover:bg-[#D4AF6A] text-[#D4AF6A] hover:text-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] rounded-lg text-xs font-semibold transition-all"
                      >
                        View Customer Profile →
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
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
