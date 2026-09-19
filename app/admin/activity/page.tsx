'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity_type', entityFilter);
      if (emailFilter) params.append('admin_email', emailFilter);
      params.append('page', page.toString());
      params.append('limit', '25');

      const res = await fetch(`/api/admin/activity?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.error || 'Failed to load activity logs');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, emailFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  return (
    <AdminGuard requiredRoles={['owner', 'admin']}>
      <AdminLayoutClient title="Audit & Activity Log">
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 font-mono">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#F5EFE6]">
                Administrative Audit &amp; Activity Log
              </h1>
              <p className="text-xs text-[#A39684] mt-1">
                Immutable event stream of order modifications, status transitions, inventory changes, and CMS updates
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchLogs()}
                className="px-4 py-2 bg-[#1E1B18] hover:bg-[#2A2420] text-[#D4AF6A] border border-[#2D2722] hover:border-[#D4AF6A]/50 rounded-lg text-xs transition-all flex items-center gap-2"
              >
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#141210] p-4 rounded-xl border border-[#2D2722]">
            <div>
              <label className="text-[#A39684] block text-[10px] uppercase mb-1">Entity Type</label>
              <select
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] px-3 py-2 rounded-lg text-xs outline-none"
              >
                <option value="">All Entities</option>
                <option value="orders">Orders</option>
                <option value="inventory">Inventory</option>
                <option value="product">Products / Catalog</option>
                <option value="media">Media Storage</option>
                <option value="design">Design Studio</option>
                <option value="collection">Collections</option>
                <option value="settings">Settings</option>
              </select>
            </div>

            <div>
              <label className="text-[#A39684] block text-[10px] uppercase mb-1">Filter by Actor</label>
              <input
                type="text"
                placeholder="Search by admin email..."
                value={emailFilter}
                onChange={(e) => {
                  setEmailFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] px-3 py-2 rounded-lg text-xs outline-none placeholder-[#736B63]"
              />
            </div>

            <div>
              <label className="text-[#A39684] block text-[10px] uppercase mb-1">Action Name</label>
              <input
                type="text"
                placeholder="e.g. order_status_updated"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] px-3 py-2 rounded-lg text-xs outline-none placeholder-[#736B63]"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs">
              ⚠️ {error}
            </div>
          )}

          {/* Logs Stream */}
          {loading ? (
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-12 text-center text-xs text-[#A39684]">
              <div className="inline-block animate-spin text-2xl mb-3">⏳</div>
              <p>Loading audit trail...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-12 text-center text-xs text-[#A39684]">
              <div className="text-3xl mb-2">📜</div>
              <p className="text-[#F5EFE6] font-semibold text-sm mb-1">No activity logs found</p>
              <p>No audit events match the specified filters.</p>
            </div>
          ) : (
            <div className="bg-[#141210] rounded-xl border border-[#2D2722] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1A1816] text-[#A39684] border-b border-[#2D2722] uppercase tracking-wider">
                      <th className="p-3.5 font-semibold">Timestamp</th>
                      <th className="p-3.5 font-semibold">Actor</th>
                      <th className="p-3.5 font-semibold">Action</th>
                      <th className="p-3.5 font-semibold">Target Entity</th>
                      <th className="p-3.5 font-semibold text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D2722]">
                    {logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const dateStr = log.created_at
                        ? new Date(log.created_at).toLocaleString('en-GB')
                        : '—';

                      return (
                        <React.Fragment key={log.id}>
                          <tr className="hover:bg-[#1E1B18]/60 transition-colors">
                            <td className="p-3.5 text-[#A39684] whitespace-nowrap">{dateStr}</td>
                            <td className="p-3.5 text-[#F5EFE6] font-semibold">{log.admin_email}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF6A]/10 text-[#D4AF6A] border border-[#D4AF6A]/30">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3.5 text-[#A39684]">
                              <span className="text-[#F5EFE6] uppercase text-[10px] mr-1.5 font-bold">
                                [{log.entity_type}]
                              </span>
                              <span className="text-[11px] truncate max-w-[120px] inline-block align-middle">
                                {log.entity_id}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => toggleExpand(log.id)}
                                className="px-2.5 py-1 bg-[#1E1B18] hover:bg-[#2A2420] text-[#D4AF6A] border border-[#2D2722] rounded text-[10px] transition-all"
                              >
                                {isExpanded ? 'Hide Payload' : 'View Payload'}
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-[#0E0D0C]">
                              <td colSpan={5} className="p-4 border-t border-b border-[#2D2722]">
                                <pre className="text-[11px] text-[#D4AF6A] bg-[#141210] p-4 rounded-lg border border-[#2D2722] overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#141210] p-4 rounded-xl border border-[#2D2722] text-xs text-[#A39684]">
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
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
