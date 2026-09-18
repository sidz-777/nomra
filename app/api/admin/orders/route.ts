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
    const supabase = createAdminClient();

    // 2. Query orders table
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    const orders = Array.isArray(ordersData) ? ordersData : [];

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
    const populatedOrders = orders.map((o) => ({
      ...o,
      items: itemsByOrder[o.id] || [],
    }));

    return NextResponse.json({
      success: true,
      orders: populatedOrders,
      total: populatedOrders.length,
    });
  } catch (err: any) {
    console.error('API /api/admin/orders error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching administrative orders.' },
      { status: 500 }
    );
  }
}
