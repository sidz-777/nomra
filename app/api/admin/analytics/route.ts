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
          o.status === 'delivered'
      )
      .reduce((s, o) => s + (parseFloat(o.deposit_amount) || 0), 0);

    const codOutstanding = validOrders
      .filter((o) => o.status !== 'delivered')
      .reduce((s, o) => s + (parseFloat(o.cod_amount) || 0), 0);

    const activeOrders = validOrders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    ).length;

    const statusCounts: Record<string, number> = {};
    filtered.forEach((o) => {
      const st = o.status || 'unknown';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    const avgOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 499;

    const summary: AnalyticsSummary = {
      timeframe,
      total_orders: filtered.length,
      active_orders: activeOrders,
      total_revenue: totalRevenue,
      deposits_collected: depositsCollected,
      cod_outstanding: codOutstanding,
      average_order_value: avgOrderValue,
      status_counts: statusCounts,
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
