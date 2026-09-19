import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { AnalyticsService } from '@/lib/analytics/service';
import { AnalyticsTimeframe } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/analytics/operations
 * Turnaround times (TAT) and notification infrastructure delivery metrics.
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

    const data = await AnalyticsService.getOperationsAnalytics(timeframe, startDate, endDate);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('API /api/admin/analytics/operations error:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Database error fetching operations analytics.' },
      { status: 500 }
    );
  }
}
