'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import AdminGuard from '@/components/admin/AdminGuard';
import DateRangePicker from '@/components/admin/analytics/DateRangePicker';
import MetricCard from '@/components/admin/analytics/MetricCard';
import PipelineFunnel from '@/components/admin/analytics/PipelineFunnel';
import ProductPerformanceTable from '@/components/admin/analytics/ProductPerformanceTable';
import ExportModal from '@/components/admin/analytics/ExportModal';
import {
  AnalyticsTimeframe,
  CustomerAnalyticsSummary,
  FullAnalyticsOverviewResponse,
  InventoryAnalyticsSummary,
  OperationsTurnaroundSummary,
  ProductAnalyticsSummary,
} from '@/lib/analytics/types';

export default function AdminAnalyticsPage() {
  return (
    <AdminGuard>
      <AdminAnalyticsContent />
    </AdminGuard>
  );
}

function AdminAnalyticsContent() {
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('all');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'products' | 'inventory' | 'customers' | 'operations' | 'attribution'>('products');

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<FullAnalyticsOverviewResponse | null>(null);
  const [productsData, setProductsData] = useState<ProductAnalyticsSummary | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryAnalyticsSummary | null>(null);
  const [customerData, setCustomerData] = useState<CustomerAnalyticsSummary | null>(null);
  const [operationsData, setOperationsData] = useState<OperationsTurnaroundSummary | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const queryParams = new URLSearchParams();
    queryParams.set('timeframe', timeframe);
    if (customStart) queryParams.set('startDate', customStart);
    if (customEnd) queryParams.set('endDate', customEnd);

    try {
      const token = localStorage.getItem('namora_admin_token') || '';
      const secret = localStorage.getItem('namora_admin_secret') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (secret) headers['x-admin-secret'] = secret;

      // 1. Fetch Overview KPIs
      const overviewRes = await fetch(`/api/admin/analytics?${queryParams.toString()}`, { headers });
      if (!overviewRes.ok) throw new Error('Failed to load overview analytics');
      const overviewJson = await overviewRes.json();
      setOverview(overviewJson);

      // 2. Fetch Tab-specific data in parallel
      const [prodRes, invRes, custRes, opsRes] = await Promise.all([
        fetch(`/api/admin/analytics/products?${queryParams.toString()}`, { headers }).then((r) => r.json()),
        fetch(`/api/admin/analytics/inventory`, { headers }).then((r) => r.json()),
        fetch(`/api/admin/analytics/customers?${queryParams.toString()}`, { headers }).then((r) => r.json()),
        fetch(`/api/admin/analytics/operations?${queryParams.toString()}`, { headers }).then((r) => r.json()),
      ]);

      if (prodRes.success) setProductsData(prodRes.data);
      if (invRes.success) setInventoryData(invRes.data);
      if (custRes.success) setCustomerData(custRes.data);
      if (opsRes.success) setOperationsData(opsRes.data);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setErrorMessage(err?.message || 'Error communicating with analytics service');
    } finally {
      setLoading(false);
    }
  }, [timeframe, customStart, customEnd]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleTimeframeChange = (tf: AnalyticsTimeframe, start?: string, end?: string) => {
    setTimeframe(tf);
    setCustomStart(start);
    setCustomEnd(end);
  };

  const fin = overview?.financials;
  const pipeline = overview?.pipeline || {
    pending: 0,
    confirmed: 0,
    studio_review: 0,
    in_production: 0,
    ready_to_ship: 0,
    in_transit: 0,
    delivered: 0,
    cancelled: 0,
  };

  const totalOrdersCount = overview?.total_orders || 0;

  return (
    <AdminLayoutClient title="Analytics, Reporting & Business Intelligence">
      <div className="space-y-6 pb-12">
        {/* Top Control Bar */}
        <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#F5EFE6]">
              Business Intelligence &amp; Analytics
            </h2>
            <p className="text-xs font-mono text-[#8C7D6B] mt-0.5">
              Live server-authoritative operational metrics &amp; fulfillment pipeline
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-3.5 py-2 bg-[#221F1B] border border-[#3A332C] hover:border-[#D4AF6A] text-[#F5EFE6] rounded-xl text-xs font-mono transition-all flex items-center gap-1.5"
            >
              🔄 <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              className="px-4 py-2 bg-[#D4AF6A] text-[#12131a] rounded-xl text-xs font-mono font-bold hover:bg-[#E5C17B] transition-all flex items-center gap-1.5 shadow-md"
            >
              📥 <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Date Filter & Timezone Engine */}
        <DateRangePicker
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          dateRangeLabel={overview?.date_range?.label}
          loading={loading}
        />

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Executive Summary Cards */}
        {fin ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <MetricCard
              label="Gross Order Value"
              value={`₹${fin.gross_order_value.toLocaleString('en-IN')}`}
              subValue={`${fin.valid_orders_count} valid orders`}
              icon="💎"
              highlight
              tooltip="Total order value placed excluding cancellations"
            />
            <MetricCard
              label="Advance Collected"
              value={`₹${fin.advance_collected.toLocaleString('en-IN')}`}
              subValue="₹49 deposit per frame"
              icon="💳"
              tooltip="Total online advance deposits captured"
            />
            <MetricCard
              label="COD Outstanding"
              value={`₹${fin.cod_outstanding.toLocaleString('en-IN')}`}
              subValue="Pending delivery"
              icon="📦"
              tooltip="Cash on delivery balance to be collected by couriers"
            />
            <MetricCard
              label="Delivered Cash"
              value={`₹${fin.delivered_value.toLocaleString('en-IN')}`}
              subValue="Realized revenue"
              icon="🏆"
              tooltip="Total revenue on confirmed delivered orders"
            />
            <MetricCard
              label="Average Order Value"
              value={`₹${fin.average_order_value.toLocaleString('en-IN')}`}
              subValue="Per customer order"
              icon="📊"
              tooltip="Gross Order Value divided by valid order count"
            />
            <MetricCard
              label="Cancelled Value"
              value={`₹${fin.cancelled_value.toLocaleString('en-IN')}`}
              subValue={`${fin.cancelled_orders_count} cancelled`}
              icon="✖️"
              tooltip="Lost potential value from cancelled or returned orders"
            />
          </div>
        ) : (
          <div className="bg-[#181614] border border-[#2D2722] p-4 rounded-xl text-xs font-mono text-[#8C7D6B]">
            🔒 Financial revenue metrics are redacted for staff role. Operational queues remain visible.
          </div>
        )}

        {/* 8-Stage Fulfillment Funnel */}
        <PipelineFunnel pipeline={pipeline} totalOrders={totalOrdersCount} />

        {/* Tabbed Intelligence Navigation */}
        <div className="flex border-b border-[#2D2722] gap-1 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-[#D4AF6A] text-[#D4AF6A] font-bold bg-[#D4AF6A]/5'
                : 'border-transparent text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            <span>🛍️</span>
            <span>Products &amp; Customization</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'border-[#D4AF6A] text-[#D4AF6A] font-bold bg-[#D4AF6A]/5'
                : 'border-transparent text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            <span>📦</span>
            <span>Inventory Health</span>
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2.5 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'border-[#D4AF6A] text-[#D4AF6A] font-bold bg-[#D4AF6A]/5'
                : 'border-transparent text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            <span>👥</span>
            <span>Customer Geography</span>
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`px-4 py-2.5 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'operations'
                ? 'border-[#D4AF6A] text-[#D4AF6A] font-bold bg-[#D4AF6A]/5'
                : 'border-transparent text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            <span>⏱️</span>
            <span>Operations &amp; Turnaround</span>
          </button>
          <button
            onClick={() => setActiveTab('attribution')}
            className={`px-4 py-2.5 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'attribution'
                ? 'border-[#D4AF6A] text-[#D4AF6A] font-bold bg-[#D4AF6A]/5'
                : 'border-transparent text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            <span>🎯</span>
            <span>Attribution Status</span>
          </button>
        </div>

        {/* Tab 1: Products & Customization */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <ProductPerformanceTable
              products={productsData?.top_products || []}
              totalRevenue={productsData?.total_product_revenue || 0}
              totalUnits={productsData?.total_units_sold || 0}
              loading={loading}
            />

            {/* Customization & Gift Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-5">
                <h4 className="text-xs font-mono uppercase text-[#A39684] mb-3">🎁 Gift Packaging Attachment</h4>
                <div className="text-3xl font-serif font-bold text-[#D4AF6A]">
                  {productsData?.gift_packaging_attach_rate_pct || 0}%
                </div>
                <div className="text-xs font-mono text-[#8C7D6B] mt-1">
                  {productsData?.gift_packaging_orders || 0} orders opted for ₹69 gift box (₹{(productsData?.gift_packaging_revenue || 0).toLocaleString('en-IN')})
                </div>
              </div>

              <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-5">
                <h4 className="text-xs font-mono uppercase text-[#A39684] mb-3">✒️ Calligraphy Script Mix</h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[#F5EFE6]">
                    <span>Bilingual (Arabic &amp; English):</span>
                    <strong className="text-[#D4AF6A]">{productsData?.customization_stats?.bilingual_count || 0}</strong>
                  </div>
                  <div className="flex justify-between text-[#A39684]">
                    <span>Monolingual Names:</span>
                    <span>{productsData?.customization_stats?.monolingual_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-5">
                <h4 className="text-xs font-mono uppercase text-[#A39684] mb-3">🎨 Popular Calligraphy Inks</h4>
                <div className="space-y-1.5 text-xs font-mono">
                  {Object.entries(productsData?.customization_stats?.ink_styles || {}).slice(0, 3).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[#F5EFE6]">
                      <span className="capitalize">{k}:</span>
                      <strong className="text-[#D4AF6A]">{v}</strong>
                    </div>
                  ))}
                  {Object.keys(productsData?.customization_stats?.ink_styles || {}).length === 0 && (
                    <div className="text-[#8C7D6B]">No ink preference data in period</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Inventory Health */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <MetricCard
                label="Total Catalog Products"
                value={inventoryData?.total_products || 0}
                icon="🖼️"
              />
              <MetricCard
                label="Out of Stock"
                value={inventoryData?.out_of_stock_count || 0}
                icon="⚠️"
                trend={{ positive: false, text: 'Requires restocking' }}
              />
              <MetricCard
                label="Low Stock (≤5 units)"
                value={inventoryData?.low_stock_count || 0}
                icon="⚡"
                trend={{ positive: false, text: 'Reorder soon' }}
              />
              <MetricCard
                label="Total Tracked Units"
                value={inventoryData?.total_tracked_units || 0}
                icon="📦"
              />
            </div>

            {/* Critical Stock Items */}
            <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-5">
              <h3 className="font-serif text-lg font-bold text-[#F5EFE6] mb-4">Critical Stock Alerts</h3>
              {(inventoryData?.critical_items || []).length > 0 ? (
                <div className="divide-y divide-[#2D2722]">
                  {inventoryData?.critical_items.map((it) => (
                    <div key={it.id} className="py-3 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="text-[#F5EFE6] font-bold">{it.title}</div>
                        <div className="text-[10px] text-[#8C7D6B]">{it.id}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#A39684]">Qty: <strong>{it.stock_quantity}</strong></span>
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            it.status === 'out_of_stock'
                              ? 'bg-rose-950/40 text-rose-300 border border-rose-500/20'
                              : 'bg-amber-950/40 text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          {it.status === 'out_of_stock' ? 'OUT OF STOCK' : 'LOW STOCK'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-mono text-[#8C7D6B]">All catalog items currently have healthy stock levels.</div>
              )}
            </div>

            {/* Recent Movements Ledger */}
            <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-5">
              <h3 className="font-serif text-lg font-bold text-[#F5EFE6] mb-3">Recent Stock Movements</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#121110] text-[#A39684] uppercase text-[10px] border-b border-[#2D2722]">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Order Ref</th>
                      <th className="py-2.5 px-3 text-center">Change</th>
                      <th className="py-2.5 px-3">Movement Type</th>
                      <th className="py-2.5 px-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#24201C] text-[#E8DCCB]">
                    {(inventoryData?.recent_movements || []).map((m) => (
                      <tr key={m.id} className="hover:bg-[#201D1A]">
                        <td className="py-2.5 px-3 font-medium text-[#F5EFE6]">{m.product_id}</td>
                        <td className="py-2.5 px-3 text-[#D4AF6A]">{m.order_number || '-'}</td>
                        <td className={`py-2.5 px-3 text-center font-bold ${m.change_quantity < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {m.change_quantity > 0 ? `+${m.change_quantity}` : m.change_quantity}
                        </td>
                        <td className="py-2.5 px-3 text-[#A39684]">{m.movement_type}</td>
                        <td className="py-2.5 px-3 text-right text-[11px] text-[#8C7D6B]">
                          {new Date(m.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Customer Geography & Retention */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Total Unique Customers"
                value={customerData?.total_unique_customers || 0}
                icon="👥"
                tooltip="Distinct phone numbers ordering from NAMORA"
              />
              <MetricCard
                label="Repeat Customers"
                value={customerData?.repeat_customers_count || 0}
                icon="🔄"
                subValue={`${customerData?.new_customers_in_period || 0} first-time buyers`}
              />
              <MetricCard
                label="Repeat Purchase Rate"
                value={`${customerData?.repeat_purchase_rate_pct || 0}%`}
                icon="📈"
                highlight
                tooltip="Percentage of buyers who placed 2 or more orders"
              />
            </div>

            <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-5">
              <h3 className="font-serif text-lg font-bold text-[#F5EFE6] mb-2">Top Delivery Destinations</h3>
              <p className="text-xs font-mono text-[#8C7D6B] mb-4">
                Regional customer demand distribution (City &amp; State level)
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {(customerData?.top_delivery_regions || []).map((reg) => (
                  <div key={`${reg.city}_${reg.state}`} className="p-3 rounded-xl bg-[#121110] border border-[#28231E]">
                    <div className="text-base font-serif font-bold text-[#F5EFE6] truncate">{reg.city}</div>
                    <div className="text-[11px] font-mono text-[#A39684] truncate">{reg.state}</div>
                    <div className="mt-2 text-xs font-mono text-[#D4AF6A] font-bold">{reg.order_count} orders</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Operations & Notifications */}
        {activeTab === 'operations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Dispatch Turnaround (TAT)"
                value={`${operationsData?.average_dispatch_tat_hours || 0} hrs`}
                icon="⚡"
                subValue="Order created to carrier dispatch"
              />
              <MetricCard
                label="Transit Duration"
                value={`${operationsData?.average_delivery_tat_days || 0} days`}
                icon="🚚"
                subValue="Dispatch to verified delivery"
              />
              <MetricCard
                label="Notification Delivery Rate"
                value={`${operationsData?.notification_performance?.success_rate_pct || 100}%`}
                icon="🔔"
                subValue={`${operationsData?.notification_performance?.sent_count || 0} sent / ${operationsData?.notification_performance?.failed_count || 0} failed`}
                highlight
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-5">
                <h4 className="font-serif text-base font-bold text-[#F5EFE6] mb-3">Carrier Partner Distribution</h4>
                <div className="space-y-2 text-xs font-mono">
                  {Object.entries(operationsData?.carrier_distribution || {}).map(([c, count]) => (
                    <div key={c} className="flex justify-between items-center p-2.5 rounded-lg bg-[#121110] border border-[#25211C]">
                      <span className="text-[#F5EFE6] font-medium">{c}</span>
                      <span className="text-[#D4AF6A] font-bold">{count} parcels</span>
                    </div>
                  ))}
                  {Object.keys(operationsData?.carrier_distribution || {}).length === 0 && (
                    <div className="text-[#8C7D6B]">No dispatched parcels in selected window.</div>
                  )}
                </div>
              </div>

              <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-5">
                <h4 className="font-serif text-base font-bold text-[#F5EFE6] mb-3">Channel Notification Performance</h4>
                <div className="space-y-2 text-xs font-mono">
                  {Object.entries(operationsData?.notification_performance?.channel_breakdown || {}).map(([ch, stats]) => (
                    <div key={ch} className="flex justify-between items-center p-2.5 rounded-lg bg-[#121110] border border-[#25211C]">
                      <span className="capitalize text-[#F5EFE6]">{ch}</span>
                      <div className="flex gap-3">
                        <span className="text-emerald-400">✓ {stats.sent} sent</span>
                        <span className="text-rose-400">✗ {stats.failed} failed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Attribution Status */}
        {activeTab === 'attribution' && (
          <div className="bg-[#181614] border border-[#2D2722] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 font-mono text-xs rounded-lg font-bold border ${
                    overview?.attribution?.status === 'ATTRIBUTION_ACTIVE'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {overview?.attribution?.status === 'ATTRIBUTION_ACTIVE'
                    ? 'FIRST-PARTY ATTRIBUTION ACTIVE'
                    : 'ATTRIBUTION INSTRUMENTATION REQUIRED'}
                </span>
                <span className="text-xs font-mono text-[#8C7D6B]">
                  {overview?.attribution?.total_attributed_orders || 0} attributed orders in window
                </span>
              </div>
            </div>

            <h3 className="font-serif text-lg font-bold text-[#F5EFE6]">
              Marketing Campaign &amp; Traffic Attribution
            </h3>

            {overview?.attribution?.channels && overview.attribution.channels.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#121110] text-[#A39684] uppercase text-[10px] border-b border-[#2D2722]">
                    <tr>
                      <th className="py-2.5 px-3">UTM Source</th>
                      <th className="py-2.5 px-3">UTM Medium</th>
                      <th className="py-2.5 px-3">UTM Campaign</th>
                      <th className="py-2.5 px-3 text-center">Orders</th>
                      <th className="py-2.5 px-3 text-right">Gross Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#24201C] text-[#E8DCCB]">
                    {overview.attribution.channels.map((ch: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#201D1A]">
                        <td className="py-2.5 px-3 text-[#D4AF6A] font-medium">{ch.source}</td>
                        <td className="py-2.5 px-3 text-[#A39684]">{ch.medium}</td>
                        <td className="py-2.5 px-3 text-[#F5EFE6]">{ch.campaign}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{ch.order_count}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#D4AF6A]">₹{ch.gross_revenue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs font-mono text-[#A39684] leading-relaxed">
                First-party attribution capture pipeline is instrumented. Orders placed with UTM parameters (<code className="text-[#D4AF6A]">utm_source</code>, <code className="text-[#D4AF6A]">utm_medium</code>, <code className="text-[#D4AF6A]">utm_campaign</code>) or linked to campaigns will record and report in real-time. In accordance with NAMORA production rules, metric values are not fabricated or simulated.
              </p>
            )}

            <div className="p-4 rounded-xl bg-[#121110] border border-[#3A332C] text-xs font-mono text-[#C4B6A5] space-y-2">
              <div className="font-bold text-[#F5EFE6]">First-Party Attribution Pipeline (Migration 010):</div>
              <ul className="list-disc list-inside space-y-1 text-[#8C7D6B]">
                <li><code className="text-[#D4AF6A]">utm_source</code>, <code className="text-[#D4AF6A]">utm_medium</code>, <code className="text-[#D4AF6A]">utm_campaign</code> active on public.orders.</li>
                <li><code className="text-[#D4AF6A]">campaign_id UUID REFERENCES public.campaigns(id)</code> with deterministic verification.</li>
                <li>First-party client-side URL capture in storefront session and automatic forward to checkout.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          timeframe={timeframe}
          startDate={customStart}
          endDate={customEnd}
        />
      </div>
    </AdminLayoutClient>
  );
}
