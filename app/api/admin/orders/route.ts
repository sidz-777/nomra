import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const statusFilter = (searchParams.get('status') || '').trim();
    const workflowFilter = (searchParams.get('workflow') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limitParam = searchParams.get('limit');
    const limit = limitParam === 'all' ? 1000 : Math.max(1, parseInt(limitParam || '50', 10));

    const supabase = createAdminClient();

    // 2. Query orders table
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    let orders = Array.isArray(ordersData) ? ordersData : [];

    // 3. Query order_items table
    const { data: itemsData } = await supabase.from('order_items').select('*');

    const itemsByOrder: Record<string, any[]> = {};
    if (Array.isArray(itemsData)) {
      itemsData.forEach((item) => {
        const oId = item.order_id;
        if (!itemsByOrder[oId]) itemsByOrder[oId] = [];
        itemsByOrder[oId].push(item);
      });
    }

    // Attach items to each order
    let populatedOrders = orders.map((o) => ({
      ...o,
      items: itemsByOrder[o.id] || [],
    }));

    // 4. Apply workflow filtering
    if (workflowFilter && workflowFilter !== 'all') {
      if (workflowFilter === 'needs_production') {
        populatedOrders = populatedOrders.filter((o) =>
          ['confirmed', 'advance_paid', 'processing', 'personalization_review'].includes(o.status)
        );
      } else if (workflowFilter === 'studio_review') {
        populatedOrders = populatedOrders.filter((o) => o.status === 'personalization_review');
      } else if (workflowFilter === 'ready_dispatch') {
        populatedOrders = populatedOrders.filter((o) => o.status === 'ready_to_ship');
      } else if (workflowFilter === 'dispatched') {
        populatedOrders = populatedOrders.filter((o) =>
          ['shipped', 'dispatched', 'out_for_delivery'].includes(o.status)
        );
      } else if (workflowFilter === 'completed') {
        populatedOrders = populatedOrders.filter((o) => o.status === 'delivered');
      } else if (workflowFilter === 'cancelled') {
        populatedOrders = populatedOrders.filter((o) => ['cancelled', 'returned'].includes(o.status));
      }
    }

    // 5. Apply status filtering
    if (statusFilter && statusFilter !== 'all') {
      const allowedStatuses = statusFilter.split(',').map((s) => s.trim());
      populatedOrders = populatedOrders.filter((o) => allowedStatuses.includes(o.status));
    }

    // 6. Apply search filtering (Order #, Customer Name, Phone, Address, Product Titles, Personalization Names)
    if (q) {
      populatedOrders = populatedOrders.filter((o) => {
        const matchesOrderNum = (o.order_number || '').toLowerCase().includes(q);
        const matchesName = (o.customer_name || '').toLowerCase().includes(q);
        const matchesPhone = (o.phone || '').toLowerCase().includes(q);
        const matchesAddress = (o.address || '').toLowerCase().includes(q) || (o.city || '').toLowerCase().includes(q);
        const matchesItems = (o.items || []).some((it: any) =>
          (it.product_title || '').toLowerCase().includes(q) ||
          (it.english_name || '').toLowerCase().includes(q) ||
          (it.arabic_name || '').toLowerCase().includes(q)
        );
        return matchesOrderNum || matchesName || matchesPhone || matchesAddress || matchesItems;
      });
    }

    const total = populatedOrders.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedOrders = limitParam === 'all' ? populatedOrders : populatedOrders.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      orders: paginatedOrders,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err: any) {
    console.error('API /api/admin/orders error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching administrative orders.' },
      { status: 500 }
    );
  }
}
