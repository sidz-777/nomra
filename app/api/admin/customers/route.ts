import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard (Only owner and admin)
  const auth = await requireAdmin(request, ['owner', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const sortBy = searchParams.get('sortBy') || 'total_spent';
    const sortOrder = searchParams.get('order') === 'asc' ? true : false;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limitParam = searchParams.get('limit');
    const limit = limitParam === 'all' ? 1000 : Math.max(1, parseInt(limitParam || '50', 10));

    const supabase = createAdminClient();
    let query = supabase
      .from('customers')
      .select('*');

    // Sorting
    const validSortCols = ['total_spent', 'total_orders', 'created_at', 'name'];
    const sortCol = validSortCols.includes(sortBy) ? sortBy : 'total_spent';
    query = query.order(sortCol, { ascending: sortOrder });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    let customers = Array.isArray(data) ? data : [];

    // Search filtering
    if (q) {
      customers = customers.filter((c) => {
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesPhone = (c.phone || '').toLowerCase().includes(q);
        const matchesEmail = (c.email || '').toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesEmail;
      });
    }

    const total = customers.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedCustomers = limitParam === 'all' ? customers : customers.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      customers: paginatedCustomers,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err: any) {
    console.error('API /api/admin/customers error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching customer directory.' },
      { status: 500 }
    );
  }
}
