import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const actionFilter = (searchParams.get('action') || '').trim();
    const entityFilter = (searchParams.get('entity_type') || '').trim();
    const emailFilter = (searchParams.get('admin_email') || '').trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));

    const supabase = createAdminClient();

    let query = supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (actionFilter) {
      query = query.eq('action', actionFilter);
    }
    if (entityFilter) {
      query = query.eq('entity_type', entityFilter);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    let logs = Array.isArray(data) ? data : [];

    if (emailFilter) {
      logs = logs.filter((l) => (l.admin_email || '').toLowerCase().includes(emailFilter));
    }

    const total = logs.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedLogs = logs.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err: any) {
    console.error('API /api/admin/activity error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching administrative audit logs.' },
      { status: 500 }
    );
  }
}
