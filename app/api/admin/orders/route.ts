import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { adminOrdersStore } from '@/lib/admin/order-memory-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // 1. Query orders table
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    let orders = Array.isArray(ordersData) ? ordersData : [];

    // 2. Query order_items table
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

    // If database returned orders, use them; otherwise use in-memory store
    const finalOrders = populatedOrders.length > 0 ? populatedOrders : adminOrdersStore.getAllOrders();

    return NextResponse.json({
      success: true,
      orders: finalOrders,
      total: finalOrders.length,
    });
  } catch (err: any) {
    console.error('API /api/admin/orders error, using fallback:', err?.message);

    const fallbackOrders = adminOrdersStore.getAllOrders();
    return NextResponse.json({
      success: true,
      orders: fallbackOrders,
      total: fallbackOrders.length,
    });
  }
}
