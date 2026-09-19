import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AnalyticsSummary } from '@/lib/admin/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all';

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const allOrders: any[] = Array.isArray(data) ? data : [];

    const now = new Date();
    const filtered = allOrders.filter((o) => {
      if (timeframe === 'all') return true;
      const d = new Date(o.created_at);
      const diffMs = now.getTime() - d.getTime();
      if (timeframe === 'today') return diffMs < 24 * 60 * 60 * 1000 && d.getDate() === now.getDate();
      if (timeframe === '7d' || timeframe === '7days') return diffMs <= 7 * 24 * 60 * 60 * 1000;
      if (timeframe === '30d' || timeframe === '30days') return diffMs <= 30 * 24 * 60 * 60 * 1000;
      if (timeframe === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });

    const validOrders = filtered.filter((o) => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
    const depositsCollected = validOrders
      .filter(
        (o) =>
          o.payment_status === 'paid' ||
          o.payment_status === 'deposit_received' ||
          o.status === 'confirmed' ||
          o.status === 'advance_paid' ||
          o.status === 'shipped' ||
          o.status === 'dispatched' ||
          o.status === 'out_for_delivery' ||
          o.status === 'delivered'
      )
      .reduce((s, o) => s + (parseFloat(o.deposit_amount) || 0), 0);

    const codOutstanding = validOrders
      .filter((o) => o.status !== 'delivered')
      .reduce((s, o) => s + (parseFloat(o.cod_amount) || 0), 0);

    const activeOrders = validOrders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'returned'
    ).length;

    // 11 Lifecycle statuses count initialization
    const statusCounts: Record<string, number> = {
      pending_payment: 0,
      pending_advance: 0,
      confirmed: 0,
      advance_paid: 0,
      processing: 0,
      in_production: 0,
      personalization_review: 0,
      ready_to_ship: 0,
      shipped: 0,
      dispatched: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    };

    filtered.forEach((o) => {
      const st = o.status || 'unknown';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    // Pipeline workflow groupings
    const pipeline = {
      pending: (statusCounts.pending_payment || 0) + (statusCounts.pending_advance || 0),
      confirmed: (statusCounts.confirmed || 0) + (statusCounts.advance_paid || 0),
      studio_review: statusCounts.personalization_review || 0,
      in_production: (statusCounts.in_production || 0) + (statusCounts.processing || 0),
      ready_to_ship: statusCounts.ready_to_ship || 0,
      in_transit: (statusCounts.shipped || 0) + (statusCounts.dispatched || 0) + (statusCounts.out_for_delivery || 0),
      delivered: statusCounts.delivered || 0,
      cancelled: (statusCounts.cancelled || 0) + (statusCounts.returned || 0),
    };

    const avgOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 499;

    // Fetch Inventory Health
    let inventoryStats = {
      total_products: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
    };

    try {
      const { data: prods } = await supabase.from('products').select('id, stock_quantity, in_stock');
      if (Array.isArray(prods)) {
        inventoryStats.total_products = prods.length;
        prods.forEach((p) => {
          const qty = p.stock_quantity ?? 0;
          if (qty <= 0 || !p.in_stock) {
            inventoryStats.out_of_stock_count++;
          } else if (qty <= 5) {
            inventoryStats.low_stock_count++;
          }
        });
      }
    } catch {}

    // Fetch Customers Count
    let customerStats = {
      total_customers: 0,
      repeat_customers: 0,
    };

    try {
      const { data: custs } = await supabase.from('customers').select('id, total_orders');
      if (Array.isArray(custs)) {
        customerStats.total_customers = custs.length;
        customerStats.repeat_customers = custs.filter((c) => (c.total_orders || 0) > 1).length;
      }
    } catch {}

    const summary = {
      timeframe,
      total_orders: filtered.length,
      active_orders: activeOrders,
      total_revenue: totalRevenue,
      deposits_collected: depositsCollected,
      cod_outstanding: codOutstanding,
      average_order_value: avgOrderValue,
      status_counts: statusCounts,
      pipeline,
      inventory: inventoryStats,
      customers: customerStats,
      recent_orders: filtered.slice(0, 5),
    };

    return NextResponse.json({ success: true, ...summary });
  } catch (err: any) {
    console.error('API /api/admin/analytics error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error generating analytics.' },
      { status: 500 }
    );
  }
}
