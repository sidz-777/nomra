import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const auth = await requireAdmin(request, ['owner', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  const { customerId } = params;
  if (!customerId) {
    return NextResponse.json({ success: false, error: 'Customer ID is required.' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // 1. Fetch customer by ID or phone
    let custQuery = supabase.from('customers').select('*');
    if (customerId.includes('-') && customerId.length === 36) {
      custQuery = custQuery.eq('id', customerId);
    } else {
      custQuery = custQuery.eq('phone', customerId);
    }

    const { data: customerData, error: custErr } = await custQuery.maybeSingle();

    if (custErr) {
      throw custErr;
    }

    let customer = customerData;
    let customerPhone = customer?.phone || customerId;

    // 2. Fetch all orders for this customer (by phone or customer_id)
    let ordersQuery = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (customer?.phone) {
      ordersQuery = ordersQuery.eq('phone', customer.phone);
    } else if (customerId.length >= 10) {
      ordersQuery = ordersQuery.eq('phone', customerId);
    }

    const { data: ordersData } = await ordersQuery;
    const orders = Array.isArray(ordersData) ? ordersData : [];

    // If customer record didn't exist in `customers` table but orders exist with this phone, construct virtual customer profile
    if (!customer && orders.length > 0) {
      const latest = orders[0];
      const totalSpent = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      customer = {
        id: customerId,
        phone: latest.phone,
        name: latest.customer_name,
        email: '',
        total_orders: orders.length,
        total_spent: totalSpent,
        created_at: orders[orders.length - 1].created_at,
      };
    }

    if (!customer && orders.length === 0) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    // 3. Fetch order items for all these orders
    const orderIds = orders.map((o) => o.id);
    let itemsByOrder: Record<string, any[]> = {};
    let personalizations: any[] = [];
    const addresses = new Set<string>();

    if (orderIds.length > 0) {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (Array.isArray(itemsData)) {
        itemsData.forEach((it) => {
          if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
          itemsByOrder[it.order_id].push(it);

          if (it.english_name || it.arabic_name) {
            personalizations.push({
              order_id: it.order_id,
              english_name: it.english_name,
              arabic_name: it.arabic_name,
              ink_style: it.ink_style,
              font_style: it.font_style,
              product_title: it.product_title,
              created_at: it.created_at,
            });
          }
        });
      }
    }

    // Extract addresses
    orders.forEach((o) => {
      const addrParts = [o.address, o.city, o.state, o.pincode].filter(Boolean);
      if (addrParts.length > 0) {
        addresses.add(addrParts.join(', '));
      }
    });

    const populatedOrders = orders.map((o) => ({
      ...o,
      items: itemsByOrder[o.id] || [],
    }));

    // Computed customer metrics
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const lifetimeValue = validOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const aov = validOrders.length > 0 ? Math.round(lifetimeValue / validOrders.length) : 0;
    const firstOrderDate = orders.length > 0 ? orders[orders.length - 1].created_at : null;
    const latestOrderDate = orders.length > 0 ? orders[0].created_at : null;

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        lifetime_value: lifetimeValue,
        average_order_value: aov,
        total_orders_count: orders.length,
        first_order_date: firstOrderDate,
        latest_order_date: latestOrderDate,
        addresses: Array.from(addresses),
        personalization_history: personalizations,
        orders: populatedOrders,
      },
    });
  } catch (err: any) {
    console.error('API /api/admin/customers/[customerId] error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching customer profile.' },
      { status: 500 }
    );
  }
}
