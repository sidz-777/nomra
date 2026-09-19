import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AnalyticsService } from '@/lib/analytics/service';
import { getISTDateRange } from '@/lib/analytics/timezone';
import { AnalyticsTimeframe } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/analytics/export
 * Secure, server-generated RFC 4180 CSV export with formula injection sanitization.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('report') || 'orders';
    const timeframe = (searchParams.get('timeframe') || 'all') as AnalyticsTimeframe;
    const startDate = searchParams.get('startDate') || searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('endDate') || searchParams.get('end_date') || undefined;

    // RBAC: staff cannot export sensitive financial reports
    if (auth.role === 'staff' && (reportType === 'financial' || reportType === 'orders')) {
      return NextResponse.json(
        { success: false, error: 'Staff role is not authorized to export financial or customer order data.' },
        { status: 403 }
      );
    }

    const range = getISTDateRange(timeframe, startDate, endDate);
    const supabase = createAdminClient();
    const s = AnalyticsService.sanitizeCsvCell;
    const rows: string[] = [];

    if (reportType === 'orders') {
      let query = supabase
        .from('orders')
        .select('order_number, created_at, status, payment_status, total_amount, deposit_amount, cod_amount, carrier, tracking_number, city, state, pincode')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (timeframe !== 'all') {
        query = query.gte('created_at', range.startDateUtc).lte('created_at', range.endDateUtc);
      }

      const { data: orders } = await query;
      rows.push(['Order Number', 'Date (UTC)', 'Status', 'Payment Status', 'Total (INR)', 'Deposit (INR)', 'COD Balance (INR)', 'Carrier', 'Tracking Number', 'City', 'State', 'Pincode'].map(s).join(','));

      for (const o of orders || []) {
        rows.push([
          s(o.order_number),
          s(o.created_at),
          s(o.status),
          s(o.payment_status),
          s(o.total_amount),
          s(o.deposit_amount),
          s(o.cod_amount),
          s(o.carrier || ''),
          s(o.tracking_number || ''),
          s(o.city || ''),
          s(o.state || ''),
          s(o.pincode || ''),
        ].join(','));
      }
    } else if (reportType === 'products') {
      const prodSummary = await AnalyticsService.getProductAnalytics(timeframe, startDate, endDate, 100);
      rows.push(['Product ID', 'Title', 'Category', 'Units Sold', 'Gross Sales (INR)', 'Gift Wraps Attached', 'Current Stock'].map(s).join(','));

      for (const p of prodSummary.top_products) {
        rows.push([
          s(p.product_id),
          s(p.title),
          s(p.category),
          s(p.units_sold),
          s(auth.role === 'staff' ? 'REDACTED' : p.gross_sales),
          s(p.gift_attach_count),
          s(p.current_stock),
        ].join(','));
      }
    } else if (reportType === 'inventory') {
      const { data: prods } = await supabase
        .from('products')
        .select('id, title, category, price, stock_quantity, in_stock')
        .order('stock_quantity', { ascending: true });

      rows.push(['Product ID', 'Title', 'Category', 'Price (INR)', 'Stock Quantity', 'Stock Status'].map(s).join(','));
      for (const p of prods || []) {
        const qty = p.stock_quantity ?? 0;
        const status = qty <= 0 || !p.in_stock ? 'OUT_OF_STOCK' : qty <= 5 ? 'LOW_STOCK' : 'IN_STOCK';
        rows.push([
          s(p.id),
          s(p.title),
          s(p.category),
          s(auth.role === 'staff' ? 'REDACTED' : p.price),
          s(qty),
          s(status),
        ].join(','));
      }
    } else if (reportType === 'financial') {
      const overview = await AnalyticsService.getOverview(timeframe, startDate, endDate, 'owner');
      const fin = overview.financials;
      rows.push(['Metric', 'Amount (INR) / Count', 'Timeframe Range (IST)'].map(s).join(','));
      if (fin) {
        rows.push([s('Gross Order Value (GOV)'), s(fin.gross_order_value), s(range.label)].join(','));
        rows.push([s('Advance Deposits Collected'), s(fin.advance_collected), s(range.label)].join(','));
        rows.push([s('COD Balance Outstanding'), s(fin.cod_outstanding), s(range.label)].join(','));
        rows.push([s('Delivered Cash Realized'), s(fin.delivered_value), s(range.label)].join(','));
        rows.push([s('Cancelled Orders Value'), s(fin.cancelled_value), s(range.label)].join(','));
        rows.push([s('Average Order Value (AOV)'), s(fin.average_order_value), s(range.label)].join(','));
        rows.push([s('Total Orders Placed'), s(fin.total_orders_placed), s(range.label)].join(','));
        rows.push([s('Valid Orders Count'), s(fin.valid_orders_count), s(range.label)].join(','));
        rows.push([s('Cancelled Orders Count'), s(fin.cancelled_orders_count), s(range.label)].join(','));
      }
    } else {
      return NextResponse.json({ success: false, error: 'Invalid report type requested.' }, { status: 400 });
    }

    // Prepend UTF-8 Byte Order Mark (BOM) for seamless Excel UTF-8 display
    const csvContent = '\uFEFF' + rows.join('\r\n');
    const filename = `namora_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('API /api/admin/analytics/export error:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Database error exporting CSV.' },
      { status: 500 }
    );
  }
}
