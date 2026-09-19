'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/admin/types';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const customerId = params?.customerId as string;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(customerId)}`);
      const data = await res.json();
      if (data.success && data.customer) {
        setCustomer(data.customer);
      } else {
        setError(data.error || 'Customer profile not found');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  if (loading) {
    return (
      <AdminGuard requiredRoles={['owner', 'admin']}>
        <AdminLayoutClient title="Customer Profile">
          <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-16 text-center text-xs font-mono text-[#A39684]">
            <div className="inline-block animate-spin text-3xl mb-3">⏳</div>
            <p>Loading customer profile and order history...</p>
          </div>
        </AdminLayoutClient>
      </AdminGuard>
    );
  }

  if (error || !customer) {
    return (
      <AdminGuard requiredRoles={['owner', 'admin']}>
        <AdminLayoutClient title="Customer Not Found">
          <div className="bg-[#141210] border border-red-500/30 rounded-xl p-12 text-center text-xs font-mono text-red-400">
            <p className="text-lg font-bold mb-2">Customer Not Found</p>
            <p>{error || 'The requested customer profile could not be located.'}</p>
            <Link
              href="/admin/customers"
              className="inline-block mt-4 px-4 py-2 bg-[#1E1B18] text-[#D4AF6A] border border-[#2D2722] rounded-lg"
            >
              ← Return to Customers
            </Link>
          </div>
        </AdminLayoutClient>
      </AdminGuard>
    );
  }

  const waPhone = (customer.phone || '').replace(/[^0-9]/g, '');
  const orders = customer.orders || [];
  const personalizations = customer.personalization_history || [];
  const addresses = customer.addresses || [];

  return (
    <AdminGuard requiredRoles={['owner', 'admin']}>
      <AdminLayoutClient title={`Customer: ${customer.name || customer.phone}`}>
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 font-mono">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/customers"
                  className="text-xs text-[#A39684] hover:text-[#D4AF6A] flex items-center gap-1 transition-colors"
                >
                  <span>←</span> Customers
                </Link>
                <span className="text-[#A39684]">/</span>
                <span className="font-serif text-lg font-bold text-[#F5EFE6]">
                  {customer.name || 'Anonymous Customer'}
                </span>
              </div>
              <div className="text-xs text-[#A39684] mt-1 flex items-center gap-4">
                <span>📞 {customer.phone || 'No phone'}</span>
                {customer.email && <span>✉️ {customer.email}</span>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {waPhone && (
                <a
                  href={`https://wa.me/${waPhone.length === 10 ? '91' + waPhone : waPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs transition-all flex items-center gap-2"
                >
                  <span>💬</span> WhatsApp Customer
                </a>
              )}
            </div>
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#141210] p-4 rounded-xl border border-[#2D2722]">
              <div className="text-[10px] uppercase text-[#A39684]">Lifetime Value (LTV)</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                ₹{customer.lifetime_value ?? customer.total_spent ?? 0}
              </div>
            </div>

            <div className="bg-[#141210] p-4 rounded-xl border border-[#2D2722]">
              <div className="text-[10px] uppercase text-[#A39684]">Total Orders</div>
              <div className="text-xl font-bold text-[#F5EFE6] mt-1">
                {customer.total_orders_count ?? customer.total_orders ?? orders.length}
              </div>
            </div>

            <div className="bg-[#141210] p-4 rounded-xl border border-[#2D2722]">
              <div className="text-[10px] uppercase text-[#A39684]">Average Order Value</div>
              <div className="text-xl font-bold text-[#D4AF6A] mt-1">
                ₹{customer.average_order_value ?? 0}
              </div>
            </div>

            <div className="bg-[#141210] p-4 rounded-xl border border-[#2D2722]">
              <div className="text-[10px] uppercase text-[#A39684]">Customer Since</div>
              <div className="text-xs font-bold text-[#F5EFE6] mt-2 truncate">
                {customer.first_order_date || customer.created_at
                  ? new Date(customer.first_order_date || customer.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </div>
            </div>
          </div>

          {/* 2-Column Section: Personalization & Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personalization History */}
            <div className="bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
              <h2 className="font-serif text-base font-bold text-[#F5EFE6] mb-3">
                Artisanal Personalization History
              </h2>
              {personalizations.length === 0 ? (
                <div className="text-xs text-[#736B63] italic">No bespoke calligraphy names on record.</div>
              ) : (
                <div className="space-y-2 text-xs">
                  {personalizations.map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-[#1A1816] p-3 rounded-lg border border-[#2D2722] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-[#F5EFE6]">{p.english_name || '—'}</div>
                        <div className="text-[10px] text-[#A39684] mt-0.5">
                          {p.ink_style || 'Gold Foil'} • {p.font_style || 'Diwani'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-sm font-bold text-[#D4AF6A]">
                          {p.arabic_name || '—'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delivery Addresses */}
            <div className="bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
              <h2 className="font-serif text-base font-bold text-[#F5EFE6] mb-3">
                Saved Shipping Addresses
              </h2>
              {addresses.length === 0 ? (
                <div className="text-xs text-[#736B63] italic">No addresses recorded yet.</div>
              ) : (
                <div className="space-y-2 text-xs">
                  {addresses.map((addr: string, idx: number) => (
                    <div
                      key={idx}
                      className="bg-[#1A1816] p-3 rounded-lg border border-[#2D2722] text-[#F5EFE6] leading-relaxed"
                    >
                      📍 {addr}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Complete Order History */}
          <div className="bg-[#141210] rounded-xl border border-[#2D2722] overflow-hidden p-6">
            <h2 className="font-serif text-base font-bold text-[#F5EFE6] mb-4">
              Complete Order History ({orders.length})
            </h2>

            {orders.length === 0 ? (
              <div className="text-xs text-[#736B63] italic">No orders found for this customer.</div>
            ) : (
              <div className="divide-y divide-[#2D2722]">
                {orders.map((order: any) => {
                  const style = STATUS_COLORS[order.status] || {
                    bg: 'bg-zinc-800',
                    text: 'text-zinc-400',
                    border: 'border-zinc-700',
                  };
                  return (
                    <div
                      key={order.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-bold text-[#D4AF6A] text-sm hover:underline"
                          >
                            {order.order_number || `#${order.id.slice(0, 8)}`}
                          </Link>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#A39684] mt-1">
                          {new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-bold text-[#F5EFE6]">₹{order.total_amount ?? 0}</div>
                          <div className="text-[10px] text-emerald-400">
                            Deposit: ₹{order.deposit_amount ?? 0}
                          </div>
                        </div>

                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="px-3 py-1.5 bg-[#1E1B18] hover:bg-[#D4AF6A] text-[#D4AF6A] hover:text-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] rounded-lg font-medium transition-all"
                        >
                          View Order →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
