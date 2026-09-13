import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AnalyticsSummary } from '@/lib/admin/types';
import { adminOrdersStore } from '@/lib/admin/order-memory-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all';

    let allOrders: any[] = [];

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        allOrders = data;
      }
    } catch (err: any) {
      console.warn('Supabase analytics fetch note:', err?.message);
    }

    // Fallback to in-memory store if database empty or unreachable
    if (!allOrders.length) {
      allOrders = adminOrdersStore.getAllOrders();
    }

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
          o.status === 'delivered'
      )
      .reduce((s, o) => s + (parseFloat(o.deposit_amount) || 0), 0);

    const codOutstanding = validOrders
      .filter((o) => o.status !== 'delivered')
      .reduce((s, o) => s + (parseFloat(o.cod_amount) || 0), 0);

    const aov = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    const statusCounts: Record<string, number> = {};
    filtered.forEach((o) => {
      const st = o.status || 'unknown';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    const summary: AnalyticsSummary = {
      timeframe,
      total_orders: filtered.length,
      active_orders: validOrders.length,
      total_revenue: Math.round(totalRevenue),
      deposits_collected: Math.round(depositsCollected),
      cod_outstanding: Math.round(codOutstanding),
      average_order_value: aov,
      status_counts: statusCounts,
    };

    return NextResponse.json({
      success: true,
      analytics: summary,
      ...summary,
    });
  } catch (err: any) {
    console.error('API /api/admin/analytics error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server analytics error' }, { status: 500 });
  }
}
