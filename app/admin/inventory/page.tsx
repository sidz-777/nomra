'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminGuard, { useAdminAuth } from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default function AdminInventoryPage() {
  const { role } = useAdminAuth();
  const isReadOnly = role === 'staff';

  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total_products: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    healthy_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Adjustment Modal state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState('restock');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/inventory');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setMovements(data.movements || []);
        setSummary(data.summary || {});
      } else {
        setError(data.error || 'Failed to load inventory');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenAdjustModal = (prod: any) => {
    if (isReadOnly) return;
    setSelectedProduct(prod);
    setAdjustQty(prod.stock_quantity ?? 0);
    setAdjustType('restock');
    setAdjustNotes('');
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmittingAdjustment(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          stock_quantity: adjustQty,
          adjustment_type: adjustType,
          notes: adjustNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedProduct(null);
        await fetchInventory();
      } else {
        alert(data.error || 'Failed to adjust stock');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error updating stock');
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    const qty = p.stock_quantity ?? 0;
    if (!matchesSearch) return false;

    if (statusFilter === 'low') return qty > 0 && qty <= 5;
    if (statusFilter === 'out') return qty <= 0 || !p.in_stock;
    if (statusFilter === 'healthy') return qty > 5 && p.in_stock;
    return true;
  });

  return (
    <AdminGuard requiredRoles={['owner', 'admin', 'staff']}>
      <AdminLayoutClient title="Inventory & Stock Management">
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 font-mono">
          {/* Header & Stats bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#F5EFE6]">
                Inventory Health &amp; Stock Levels
              </h1>
              <p className="text-xs text-[#A39684] mt-1">
                Real-time product stock tracking, automated alerts, and atomic inventory logs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchInventory()}
                className="px-4 py-2 bg-[#1E1B18] hover:bg-[#2A2420] text-[#D4AF6A] border border-[#2D2722] hover:border-[#D4AF6A]/50 rounded-lg text-xs transition-all flex items-center gap-2"
              >
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#141210] p-4 rounded-xl border border-[#2D2722]">
              <div className="text-[10px] uppercase text-[#A39684]">Total Products</div>
              <div className="text-xl font-bold text-[#F5EFE6] mt-1">
                {summary.total_products}
              </div>
            </div>

            <div className="bg-[#141210] p-4 rounded-xl border border-emerald-500/30">
              <div className="text-[10px] uppercase text-emerald-400">Healthy Stock (&gt;5)</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {summary.healthy_count}
              </div>
            </div>

            <div className="bg-[#141210] p-4 rounded-xl border border-amber-500/30">
              <div className="text-[10px] uppercase text-amber-400">Low Stock Warning (&le;5)</div>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {summary.low_stock_count}
              </div>
            </div>

            <div className="bg-[#141210] p-4 rounded-xl border border-red-500/30">
              <div className="text-[10px] uppercase text-red-400">Out of Stock (0)</div>
              <div className="text-xl font-bold text-red-400 mt-1">
                {summary.out_of_stock_count}
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#141210] p-4 rounded-xl border border-[#2D2722]">
            <div className="md:col-span-2 relative">
              <input
                type="text"
                placeholder="Search products by title or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] px-4 py-2.5 rounded-lg text-xs outline-none transition-all placeholder-[#736B63]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-[#A39684] hover:text-[#F5EFE6]"
                >
                  ✕
                </button>
              )}
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] px-4 py-2.5 rounded-lg text-xs outline-none transition-all cursor-pointer"
              >
                <option value="all">All Stock Statuses</option>
                <option value="healthy">Healthy Stock Only</option>
                <option value="low">Low Stock Alerts (&le; 5)</option>
                <option value="out">Out of Stock (0)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs">
              ⚠️ {error}
            </div>
          )}

          {/* Products Stock Table */}
          {loading ? (
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-12 text-center text-xs text-[#A39684]">
              <div className="inline-block animate-spin text-2xl mb-3">⏳</div>
              <p>Loading inventory items...</p>
            </div>
          ) : (
            <div className="bg-[#141210] rounded-xl border border-[#2D2722] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1A1816] text-[#A39684] border-b border-[#2D2722] uppercase tracking-wider">
                      <th className="p-4 font-semibold">Product</th>
                      <th className="p-4 font-semibold">Category</th>
                      <th className="p-4 font-semibold">Price</th>
                      <th className="p-4 font-semibold">Current Stock</th>
                      <th className="p-4 font-semibold">Health Status</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D2722]">
                    {filteredProducts.map((p) => {
                      const qty = p.stock_quantity ?? 0;
                      const isOut = qty <= 0 || !p.in_stock;
                      const isLow = qty > 0 && qty <= 5;

                      return (
                        <tr key={p.id} className="hover:bg-[#1E1B18]/60 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-[#F5EFE6] text-sm">{p.title}</div>
                            <div className="text-[10px] text-[#A39684] mt-0.5">{p.id}</div>
                          </td>

                          <td className="p-4 text-[#A39684]">
                            {p.category || 'Frames'}
                          </td>

                          <td className="p-4 font-bold text-[#F5EFE6]">
                            ₹{p.price ?? 499}
                          </td>

                          <td className="p-4">
                            <span className="font-mono text-sm font-bold text-[#F5EFE6]">
                              {qty}
                            </span>
                          </td>

                          <td className="p-4">
                            {isOut ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                Low Stock ({qty})
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                In Stock ({qty})
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleOpenAdjustModal(p)}
                                className="px-3 py-1.5 bg-[#1E1B18] hover:bg-[#D4AF6A] text-[#D4AF6A] hover:text-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] rounded-lg font-medium transition-all"
                              >
                                Adjust Stock
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Inventory Movements Log */}
          <div className="bg-[#141210] rounded-xl border border-[#2D2722] p-6">
            <h2 className="font-serif text-base font-bold text-[#F5EFE6] mb-3">
              Recent Inventory Movements Log
            </h2>
            {movements.length === 0 ? (
              <div className="text-xs text-[#736B63] italic">No recent stock movements recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1A1816] text-[#A39684] border-b border-[#2D2722] uppercase tracking-wider">
                      <th className="p-3 font-semibold">Date</th>
                      <th className="p-3 font-semibold">Product ID</th>
                      <th className="p-3 font-semibold">Change</th>
                      <th className="p-3 font-semibold">Type</th>
                      <th className="p-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D2722]">
                    {movements.slice(0, 15).map((m: any, idx: number) => {
                      const change = m.change_quantity ?? m.quantity ?? 0;
                      return (
                        <tr key={m.id || idx} className="hover:bg-[#1E1B18]/40">
                          <td className="p-3 text-[#A39684]">
                            {m.created_at ? new Date(m.created_at).toLocaleString('en-GB') : '—'}
                          </td>
                          <td className="p-3 text-[#F5EFE6] font-mono">{m.product_id}</td>
                          <td className="p-3 font-bold">
                            <span className={change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {change >= 0 ? `+${change}` : change}
                            </span>
                          </td>
                          <td className="p-3 text-[#D4AF6A] uppercase text-[10px]">
                            {m.movement_type || 'adjustment'}
                          </td>
                          <td className="p-3 text-[#A39684] truncate max-w-xs">{m.notes || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stock Adjustment Modal */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#141210] border border-[#2D2722] rounded-xl max-w-md w-full p-6 flex flex-col gap-4 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-[#2D2722] pb-3">
                  <h3 className="font-serif text-base font-bold text-[#F5EFE6]">
                    Adjust Stock Quantity
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="text-[#A39684] hover:text-[#F5EFE6] text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <div className="font-bold text-[#F5EFE6]">{selectedProduct.title}</div>
                  <div className="text-[11px] text-[#A39684] mt-0.5">
                    Current Stock: {selectedProduct.stock_quantity ?? 0} units
                  </div>
                </div>

                <form onSubmit={handleSaveAdjustment} className="space-y-4">
                  <div>
                    <label className="text-[#A39684] block text-[10px] uppercase mb-1">
                      New Absolute Stock Count
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(parseInt(e.target.value || '0', 10))}
                      className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] p-2.5 rounded-lg text-sm font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#A39684] block text-[10px] uppercase mb-1">
                      Adjustment Type
                    </label>
                    <select
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value)}
                      className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] p-2.5 rounded-lg text-xs outline-none"
                    >
                      <option value="restock">Restock / Inventory Addition</option>
                      <option value="correction">Audit Correction / Recount</option>
                      <option value="damage">Damaged / Defective Loss</option>
                      <option value="adjustment">General Adjustment</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#A39684] block text-[10px] uppercase mb-1">
                      Reason / Notes (Audited)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Supplier delivery batch #401"
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                      className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] p-2.5 rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="px-4 py-2 bg-[#1E1B18] hover:bg-[#2A2420] text-[#A39684] rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAdjustment}
                      className="px-4 py-2 bg-[#D4AF6A] hover:bg-[#b89555] text-[#0E0D0C] font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      {submittingAdjustment ? 'Updating...' : 'Save Stock'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
