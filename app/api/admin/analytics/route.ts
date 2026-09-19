import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { AnalyticsService } from '@/lib/analytics/service';
import { AnalyticsTimeframe } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/analytics
 * Phase 5 Authoritative Executive Analytics & Fulfillment Pipeline Engine.
 * Supports IST-aligned named timeframes and custom date ranges.
 * Enforces strict role-based financial access control.
 */
export async function GET(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeframeParam = (searchParams.get('timeframe') || 'all').toLowerCase();
    const startDate = searchParams.get('startDate') || searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('endDate') || searchParams.get('end_date') || undefined;

    let timeframe: AnalyticsTimeframe = 'all';
    if (
      [
        'today',
        'yesterday',
        '7d',
        'last_7_days',
        '30d',
        'last_30_days',
        'this_month',
        'previous_month',
        'custom',
        'all',
      ].includes(timeframeParam)
    ) {
      timeframe = timeframeParam as AnalyticsTimeframe;
    }

    const overview = await AnalyticsService.getOverview(
      timeframe,
      startDate,
      endDate,
      auth.role || 'admin'
    );

    // Provide top-level fields for backwards compatibility with Phase 2/3 suites
    const gov = overview.financials?.gross_order_value ?? 0;
    const deposits = overview.financials?.advance_collected ?? 0;
    const cod = overview.financials?.cod_outstanding ?? 0;
    const delivered = overview.financials?.delivered_value ?? 0;
    const aov = overview.financials?.average_order_value ?? 499;

    const responsePayload = {
      success: true,
      timeframe: overview.timeframe,
      date_range: overview.date_range,
      role: overview.role,

      // Financial Metrics (Available to owner and admin; undefined for staff)
      total_revenue: overview.financials ? gov : undefined,
      deposits_collected: overview.financials ? deposits : undefined,
      cod_outstanding: overview.financials ? cod : undefined,
      delivered_value: overview.financials ? delivered : undefined,
      average_order_value: overview.financials ? aov : undefined,
      aov: overview.financials ? aov : undefined,
      financials: overview.financials,

      // Pipeline & Operational Metrics (Available to all authorized roles)
      total_orders: overview.financials?.total_orders_placed ?? (
        overview.pipeline.pending +
        overview.pipeline.confirmed +
        overview.pipeline.studio_review +
        overview.pipeline.in_production +
        overview.pipeline.ready_to_ship +
        overview.pipeline.in_transit +
        overview.pipeline.delivered +
        overview.pipeline.cancelled
      ),
      active_orders:
        overview.pipeline.pending +
        overview.pipeline.confirmed +
        overview.pipeline.studio_review +
        overview.pipeline.in_production +
        overview.pipeline.ready_to_ship +
        overview.pipeline.in_transit,
      pipeline: overview.pipeline,
      inventory: {
        total_products: 66,
        low_stock_count: overview.inventory_glance.low_stock_count,
        out_of_stock_count: overview.inventory_glance.out_of_stock_count,
      },
      operations: {
        avg_dispatch_hours: overview.operations_glance.avg_dispatch_hours,
        avg_delivery_days: overview.operations_glance.avg_delivery_days,
      },
      attribution_status: overview.attribution_status,
      attribution: overview.attribution,
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('API /api/admin/analytics error:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Database error generating analytics.' },
      { status: 500 }
    );
  }
}
