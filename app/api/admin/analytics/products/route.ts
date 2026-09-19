import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { AnalyticsService } from '@/lib/analytics/service';
import { AnalyticsTimeframe } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/analytics/products
 * Product sales performance, personalization statistics, and gift packaging attach rate.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get('timeframe') || 'all') as AnalyticsTimeframe;
    const startDate = searchParams.get('startDate') || searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('endDate') || searchParams.get('end_date') || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const data = await AnalyticsService.getProductAnalytics(timeframe, startDate, endDate, limit);

    // If staff role, omit gross financial revenue numbers
    if (auth.role === 'staff') {
      const sanitizedProducts = data.top_products.map((p) => ({
        ...p,
        gross_sales: 0,
      }));
      return NextResponse.json({
        success: true,
        data: {
          ...data,
          top_products: sanitizedProducts,
          total_product_revenue: 0,
          gift_packaging_revenue: 0,
        },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('API /api/admin/analytics/products error:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Database error fetching product analytics.' },
      { status: 500 }
    );
  }
}
