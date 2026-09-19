import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { NotificationService } from '@/lib/notifications/service';
import { logAdminActivity } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  const url = request.nextUrl;
  const channel = url.searchParams.get('channel');
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const orderNumber = url.searchParams.get('order_number') || url.searchParams.get('orderNumber');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));
  const offset = (page - 1) * limit;

  try {
    const supabase = createAdminClient();
    let query = supabase.from('notification_logs').select('*', { count: 'exact' });

    if (channel && channel !== 'all') {
      query = query.eq('channel', channel);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (type && type !== 'all') {
      query = query.eq('notification_type', type);
    }
    if (orderNumber) {
      query = query.ilike('order_number', `%${orderNumber.trim()}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: logsData, count, error } = await query;

    let logs: any[] = [];
    let totalCount = 0;

    if (!error && Array.isArray(logsData)) {
      logs = logsData;
      totalCount = count || logs.length;
    } else if (NotificationService.isFallbackAllowed()) {
      // In-memory fallback strictly restricted to explicit development/testing mode
      let fb = NotificationService.getFallbackLogs();
      if (channel && channel !== 'all') fb = fb.filter((l) => l.channel === channel);
      if (status && status !== 'all') fb = fb.filter((l) => l.status === status);
      if (type && type !== 'all') fb = fb.filter((l) => l.notification_type === type);
      if (orderNumber) fb = fb.filter((l) => l.order_number.toLowerCase().includes(orderNumber.toLowerCase()));

      totalCount = fb.length;
      logs = fb.slice(offset, offset + limit);
    } else {
      console.error('[Admin Notifications API] Database error retrieving notifications:', error?.message);
      logs = [];
      totalCount = 0;
    }

    // Compute aggregated KPI metrics
    let kpiQuery = supabase.from('notification_logs').select('status');
    const { data: allStatuses, error: kpiError } = await kpiQuery;

    let kpis = {
      total: totalCount,
      sent: 0,
      failed: 0,
      pending: 0,
    };

    if (!kpiError && Array.isArray(allStatuses)) {
      allStatuses.forEach((row: any) => {
        if (row.status === 'sent') kpis.sent += 1;
        else if (row.status === 'failed') kpis.failed += 1;
        else if (row.status === 'pending' || row.status === 'sending') kpis.pending += 1;
      });
      kpis.total = allStatuses.length;
    } else if (NotificationService.isFallbackAllowed()) {
      const fb = NotificationService.getFallbackLogs();
      fb.forEach((l) => {
        if (l.status === 'sent') kpis.sent += 1;
        else if (l.status === 'failed') kpis.failed += 1;
        else if (l.status === 'pending' || l.status === 'sending') kpis.pending += 1;
      });
      kpis.total = fb.length;
    }

    return NextResponse.json({
      success: true,
      logs,
      total: totalCount,
      page,
      limit,
      kpis,
    });
  } catch (err: any) {
    console.error('API /api/admin/notifications GET error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error retrieving notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const logId = body.log_id || body.logId || body.id;

    if (!logId) {
      return NextResponse.json({ success: false, error: 'log_id is required for retry' }, { status: 400 });
    }

    const result = await NotificationService.retry(logId);

    // Record administrative audit log
    await logAdminActivity(
      'notification_retried',
      'notification_logs',
      logId,
      { result },
      auth.user?.email || 'admin'
    );

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (err: any) {
    console.error('API /api/admin/notifications POST retry error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Failed to process notification retry' },
      { status: 500 }
    );
  }
}
