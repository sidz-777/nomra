import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { AnalyticsService } from '@/lib/analytics/service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/analytics/inventory
 * Inventory health, out-of-stock items, and recent ledger movements.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const data = await AnalyticsService.getInventoryAnalytics();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('API /api/admin/analytics/inventory error:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Database error fetching inventory analytics.' },
      { status: 500 }
    );
  }
}
