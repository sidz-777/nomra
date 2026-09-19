/**
 * NAMORA Analytics & Business Intelligence Engine
 * Authoritative server-side aggregations, SQL-bound queries, and role-based field redaction.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import {
  AnalyticsTimeframe,
  CustomerAnalyticsSummary,
  DateRangeIST,
  ExecutiveFinancialSummary,
  FullAnalyticsOverviewResponse,
  InventoryAnalyticsSummary,
  InventoryHealthItem,
  OperationsTurnaroundSummary,
  PipelineBreakdown,
  ProductAnalyticsSummary,
  ProductPerformanceItem,
} from './types';
import { getISTDateRange } from './timezone';
import { AdminRole } from '@/lib/admin/types';

export class AnalyticsService {
  /**
   * Fetches high-level executive summary, pipeline counts, and glance statistics.
   */
  public static async getOverview(
    timeframe: AnalyticsTimeframe = 'all',
    customStart?: string,
    customEnd?: string,
    role: AdminRole = 'admin'
  ): Promise<FullAnalyticsOverviewResponse> {
    const range = getISTDateRange(timeframe, customStart, customEnd);
    const supabase = createAdminClient();

    // Query orders bounded by the IST-aligned date range
    let query = supabase
      .from('orders')
      .select('id, total_amount, deposit_amount, cod_amount, status, payment_status, created_at, dispatched_at, delivered_at, cancelled_at, utm_source, utm_medium, utm_campaign, referrer, campaign_id')
      .order('created_at', { ascending: false });

    if (timeframe !== 'all') {
      query = query.gte('created_at', range.startDateUtc).lte('created_at', range.endDateUtc);
    }

    const { data: ordersData, error: ordersError } = await query;
    if (ordersError) {
      throw new Error(`Failed to query orders for analytics: ${ordersError.message}`);
    }

    const orders = ordersData || [];

    // 1. Pipeline 8-Stage Breakdown
    const pipeline: PipelineBreakdown = {
      pending: 0,
      confirmed: 0,
      studio_review: 0,
      in_production: 0,
      ready_to_ship: 0,
      in_transit: 0,
      delivered: 0,
      cancelled: 0,
    };

    let gov = 0;
    let advanceCollected = 0;
    let codOutstanding = 0;
    let deliveredValue = 0;
    let cancelledValue = 0;
    let validCount = 0;
    let cancelledCount = 0;

    let totalDispatchMs = 0;
    let dispatchCount = 0;
    let totalDeliveryMs = 0;
    let deliveryCount = 0;

    const sourceCounts: Record<string, number> = {};
    const campaignCounts: Record<string, number> = {};
    const channelMap = new Map<string, { source: string; medium: string; campaign: string; count: number; revenue: number }>();
    let attributedOrdersCount = 0;

    for (const o of orders) {
      const st = o.status || 'pending_payment';
      const amt = Number(o.total_amount || 0);
      const dep = Number(o.deposit_amount || 0);
      const cod = Number(o.cod_amount || 0);

      // Attribution Tracking
      const src = (o.utm_source || '').trim();
      const med = (o.utm_medium || '').trim();
      const cmp = (o.utm_campaign || '').trim();
      if (src || cmp || o.campaign_id) {
        attributedOrdersCount++;
        if (src) sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        if (cmp) campaignCounts[cmp] = (campaignCounts[cmp] || 0) + 1;
        const channelKey = `${src || 'direct'} / ${med || 'none'} / ${cmp || 'none'}`;
        const existing = channelMap.get(channelKey) || {
          source: src || 'direct',
          medium: med || 'none',
          campaign: cmp || 'none',
          count: 0,
          revenue: 0,
        };
        existing.count++;
        existing.revenue += amt;
        channelMap.set(channelKey, existing);
      }

      // Map to 8 pipeline stages
      if (st === 'pending_payment' || st === 'pending_advance') {
        pipeline.pending += 1;
      } else if (st === 'confirmed' || st === 'advance_paid') {
        pipeline.confirmed += 1;
      } else if (st === 'personalization_review') {
        pipeline.studio_review += 1;
      } else if (st === 'in_production' || st === 'processing') {
        pipeline.in_production += 1;
      } else if (st === 'ready_to_ship') {
        pipeline.ready_to_ship += 1;
      } else if (st === 'dispatched' || st === 'shipped' || st === 'out_for_delivery') {
        pipeline.in_transit += 1;
      } else if (st === 'delivered') {
        pipeline.delivered += 1;
      } else if (st === 'cancelled' || st === 'returned') {
        pipeline.cancelled += 1;
      }

      // Financials
      if (st === 'cancelled' || st === 'returned') {
        cancelledValue += amt;
        cancelledCount += 1;
      } else {
        gov += amt;
        validCount += 1;

        // Advance collected: any order where deposit has been confirmed
        if (
          st === 'confirmed' ||
          st === 'advance_paid' ||
          st === 'personalization_review' ||
          st === 'in_production' ||
          st === 'processing' ||
          st === 'ready_to_ship' ||
          st === 'dispatched' ||
          st === 'shipped' ||
          st === 'out_for_delivery' ||
          st === 'delivered' ||
          o.payment_status === 'paid' ||
          o.payment_status === 'deposit_received'
        ) {
          advanceCollected += dep;
        }

        // COD outstanding: in progress but not yet delivered
        if (
          st === 'confirmed' ||
          st === 'advance_paid' ||
          st === 'personalization_review' ||
          st === 'in_production' ||
          st === 'processing' ||
          st === 'ready_to_ship' ||
          st === 'dispatched' ||
          st === 'shipped' ||
          st === 'out_for_delivery'
        ) {
          codOutstanding += cod;
        }

        // Delivered realized revenue
        if (st === 'delivered') {
          deliveredValue += amt;
        }
      }

      // Operational Turnaround tracking
      if (o.dispatched_at && o.created_at) {
        const diff = new Date(o.dispatched_at).getTime() - new Date(o.created_at).getTime();
        if (diff > 0) {
          totalDispatchMs += diff;
          dispatchCount += 1;
        }
      }

      if (o.delivered_at && o.dispatched_at) {
        const diff = new Date(o.delivered_at).getTime() - new Date(o.dispatched_at).getTime();
        if (diff > 0) {
          totalDeliveryMs += diff;
          deliveryCount += 1;
        }
      }
    }

    const aov = validCount > 0 ? Math.round(gov / validCount) : 499;

    // Fetch Inventory Glance counts
    const { data: prods } = await supabase.from('products').select('stock_quantity, in_stock');
    let outOfStock = 0;
    let lowStock = 0;
    if (Array.isArray(prods)) {
      for (const p of prods) {
        const qty = p.stock_quantity ?? 0;
        if (qty <= 0 || !p.in_stock) outOfStock++;
        else if (qty <= 5) lowStock++;
      }
    }

    // Role-based redaction: staff does not receive financial values
    const canSeeFinances = role === 'owner' || role === 'admin';
    let financials: ExecutiveFinancialSummary | undefined = undefined;

    if (canSeeFinances) {
      financials = {
        gross_order_value: gov,
        advance_collected: advanceCollected,
        cod_outstanding: codOutstanding,
        delivered_value: deliveredValue,
        cancelled_value: cancelledValue,
        average_order_value: aov,
        total_orders_placed: orders.length,
        valid_orders_count: validCount,
        cancelled_orders_count: cancelledCount,
      };
    }

    const avgDispatchHours = dispatchCount > 0 ? Math.round((totalDispatchMs / dispatchCount) / (1000 * 60 * 60)) : 0;
    const avgDeliveryDays = deliveryCount > 0 ? parseFloat(((totalDeliveryMs / deliveryCount) / (1000 * 60 * 60 * 24)).toFixed(1)) : 0;

    const attributionStatus: 'ATTRIBUTION_ACTIVE' | 'ATTRIBUTION_INSTRUMENTATION_REQUIRED' =
      attributedOrdersCount > 0 ? 'ATTRIBUTION_ACTIVE' : 'ATTRIBUTION_INSTRUMENTATION_REQUIRED';

    const attribution = {
      status: attributionStatus,
      total_attributed_orders: attributedOrdersCount,
      sources: sourceCounts,
      campaigns: campaignCounts,
      channels: Array.from(channelMap.values()).map((c) => ({
        source: c.source,
        medium: c.medium,
        campaign: c.campaign,
        order_count: c.count,
        gross_revenue: c.revenue,
      })),
    };

    return {
      success: true,
      timeframe,
      date_range: range,
      financials,
      total_orders: orders.length,
      active_orders: validCount,
      pipeline,
      inventory_glance: {
        low_stock_count: lowStock,
        out_of_stock_count: outOfStock,
      },
      operations_glance: {
        avg_dispatch_hours: avgDispatchHours,
        avg_delivery_days: avgDeliveryDays,
      },
      role,
      attribution_status: attributionStatus,
      attribution,
    };
  }

  /**
   * Product and Customization Performance Analytics
   */
  public static async getProductAnalytics(
    timeframe: AnalyticsTimeframe = 'all',
    customStart?: string,
    customEnd?: string,
    limit: number = 20
  ): Promise<ProductAnalyticsSummary> {
    const range = getISTDateRange(timeframe, customStart, customEnd);
    const supabase = createAdminClient();

    // 1. Fetch order items bounded by date range
    let itemsQuery = supabase
      .from('order_items')
      .select('id, order_id, product_id, product_title, price, has_gift, gift_price, english_name, arabic_name, font_style, ink_style, created_at');

    if (timeframe !== 'all') {
      itemsQuery = itemsQuery.gte('created_at', range.startDateUtc).lte('created_at', range.endDateUtc);
    }

    const { data: items, error: itemsErr } = await itemsQuery;
    if (itemsErr) throw new Error(`Product analytics error: ${itemsErr.message}`);

    // 2. Fetch inventory catalog for current stock levels
    const { data: catalog } = await supabase
      .from('products')
      .select('id, title, category, stock_quantity, in_stock');
    const catalogMap = new Map<string, any>();
    (catalog || []).forEach((p) => catalogMap.set(p.id, p));

    const productMap = new Map<string, ProductPerformanceItem>();
    let totalUnits = 0;
    let totalRevenue = 0;
    let giftOrders = 0;
    let giftRevenue = 0;

    const fontStyles: Record<string, number> = {};
    const inkStyles: Record<string, number> = {};
    let bilingualCount = 0;
    let monolingualCount = 0;

    for (const item of items || []) {
      const pid = item.product_id || 'unknown';
      const price = Number(item.price || 499);
      totalUnits += 1;
      totalRevenue += price;

      if (item.has_gift) {
        giftOrders += 1;
        giftRevenue += Number(item.gift_price || 69);
      }

      // Font and ink style preferences
      if (item.font_style) {
        fontStyles[item.font_style] = (fontStyles[item.font_style] || 0) + 1;
      }
      if (item.ink_style) {
        inkStyles[item.ink_style] = (inkStyles[item.ink_style] || 0) + 1;
      }
      if (item.english_name && item.arabic_name) {
        bilingualCount += 1;
      } else if (item.english_name || item.arabic_name) {
        monolingualCount += 1;
      }

      // Aggregate by product
      const existing = productMap.get(pid);
      if (existing) {
        existing.units_sold += 1;
        existing.gross_sales += price;
        existing.order_count += 1;
        if (item.has_gift) existing.gift_attach_count += 1;
      } else {
        const prodInfo = catalogMap.get(pid);
        productMap.set(pid, {
          product_id: pid,
          title: item.product_title || prodInfo?.title || pid,
          category: prodInfo?.category || 'Calligraphy Frame',
          units_sold: 1,
          gross_sales: price,
          order_count: 1,
          gift_attach_count: item.has_gift ? 1 : 0,
          current_stock: prodInfo?.stock_quantity ?? 0,
          in_stock: prodInfo?.in_stock ?? true,
        });
      }
    }

    const sortedProducts = Array.from(productMap.values())
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, limit);

    const giftAttachRate = totalUnits > 0 ? parseFloat(((giftOrders / totalUnits) * 100).toFixed(1)) : 0;

    return {
      top_products: sortedProducts,
      total_units_sold: totalUnits,
      total_product_revenue: totalRevenue,
      gift_packaging_orders: giftOrders,
      gift_packaging_attach_rate_pct: giftAttachRate,
      gift_packaging_revenue: giftRevenue,
      customization_stats: {
        font_styles: fontStyles,
        ink_styles: inkStyles,
        bilingual_count: bilingualCount,
        monolingual_count: monolingualCount,
      },
    };
  }

  /**
   * Inventory Health & Movement History
   */
  public static async getInventoryAnalytics(): Promise<InventoryAnalyticsSummary> {
    const supabase = createAdminClient();

    const { data: prods, error: pErr } = await supabase
      .from('products')
      .select('id, title, sku, stock_quantity, in_stock')
      .order('stock_quantity', { ascending: true });

    if (pErr) throw new Error(`Inventory analytics query failed: ${pErr.message}`);

    const criticalItems: InventoryHealthItem[] = [];
    let outOfStock = 0;
    let lowStock = 0;
    let healthy = 0;
    let totalUnits = 0;

    for (const p of prods || []) {
      const qty = p.stock_quantity ?? 0;
      totalUnits += qty;

      if (qty <= 0 || !p.in_stock) {
        outOfStock++;
        criticalItems.push({
          id: p.id,
          title: p.title,
          sku: p.sku,
          stock_quantity: qty,
          in_stock: false,
          status: 'out_of_stock',
        });
      } else if (qty <= 5) {
        lowStock++;
        criticalItems.push({
          id: p.id,
          title: p.title,
          sku: p.sku,
          stock_quantity: qty,
          in_stock: true,
          status: 'low_stock',
        });
      } else {
        healthy++;
      }
    }

    // Recent inventory movements
    const { data: movements } = await supabase
      .from('inventory_movements')
      .select('id, product_id, order_number, change_quantity, movement_type, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(15);

    return {
      total_products: (prods || []).length,
      out_of_stock_count: outOfStock,
      low_stock_count: lowStock,
      healthy_stock_count: healthy,
      total_tracked_units: totalUnits,
      critical_items: criticalItems.slice(0, 10),
      recent_movements: movements || [],
    };
  }

  /**
   * Customer CRM & Geographic Intelligence (Zero unmasked PII)
   */
  public static async getCustomerAnalytics(
    timeframe: AnalyticsTimeframe = 'all',
    customStart?: string,
    customEnd?: string
  ): Promise<CustomerAnalyticsSummary> {
    const range = getISTDateRange(timeframe, customStart, customEnd);
    const supabase = createAdminClient();

    let query = supabase.from('orders').select('phone, city, state, created_at');
    if (timeframe !== 'all') {
      query = query.gte('created_at', range.startDateUtc).lte('created_at', range.endDateUtc);
    }

    const { data: orders, error: oErr } = await query;
    if (oErr) throw new Error(`Customer analytics query failed: ${oErr.message}`);

    const customerOrderCounts = new Map<string, number>();
    const regionCounts = new Map<string, { city: string; state: string; count: number }>();

    for (const o of orders || []) {
      const phone = o.phone || 'unknown';
      customerOrderCounts.set(phone, (customerOrderCounts.get(phone) || 0) + 1);

      if (o.city && o.state) {
        const key = `${o.city.trim().toLowerCase()}_${o.state.trim().toLowerCase()}`;
        const existing = regionCounts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          regionCounts.set(key, {
            city: o.city.trim(),
            state: o.state.trim(),
            count: 1,
          });
        }
      }
    }

    let repeatCount = 0;
    customerOrderCounts.forEach((cnt) => {
      if (cnt > 1) repeatCount++;
    });

    const totalCustomers = customerOrderCounts.size;
    const repeatRate = totalCustomers > 0 ? parseFloat(((repeatCount / totalCustomers) * 100).toFixed(1)) : 0;

    const topRegions = Array.from(regionCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((r) => ({
        city: r.city,
        state: r.state,
        order_count: r.count,
      }));

    return {
      total_unique_customers: totalCustomers,
      new_customers_in_period: totalCustomers - repeatCount,
      repeat_customers_count: repeatCount,
      repeat_purchase_rate_pct: repeatRate,
      top_delivery_regions: topRegions,
    };
  }

  /**
   * Operations Turnaround Times and Notification Reliability
   */
  public static async getOperationsAnalytics(
    timeframe: AnalyticsTimeframe = 'all',
    customStart?: string,
    customEnd?: string
  ): Promise<OperationsTurnaroundSummary> {
    const range = getISTDateRange(timeframe, customStart, customEnd);
    const supabase = createAdminClient();

    // 1. Order Turnaround Times
    let orderQuery = supabase
      .from('orders')
      .select('created_at, dispatched_at, delivered_at, carrier, courier_name');
    if (timeframe !== 'all') {
      orderQuery = orderQuery.gte('created_at', range.startDateUtc).lte('created_at', range.endDateUtc);
    }

    const { data: orders } = await orderQuery;
    let totalDispatchMs = 0;
    let dispatchCount = 0;
    let totalDeliveryMs = 0;
    let deliveryCount = 0;
    const carrierDist: Record<string, number> = {};

    for (const o of orders || []) {
      const c = o.carrier || o.courier_name || 'Standard Courier';
      if (c) carrierDist[c] = (carrierDist[c] || 0) + 1;

      if (o.dispatched_at && o.created_at) {
        const diff = new Date(o.dispatched_at).getTime() - new Date(o.created_at).getTime();
        if (diff > 0) {
          totalDispatchMs += diff;
          dispatchCount += 1;
        }
      }

      if (o.delivered_at && o.dispatched_at) {
        const diff = new Date(o.delivered_at).getTime() - new Date(o.dispatched_at).getTime();
        if (diff > 0) {
          totalDeliveryMs += diff;
          deliveryCount += 1;
        }
      }
    }

    // 2. Notification Center Reliability
    let notifQuery = supabase.from('notification_logs').select('channel, status, attempt_count, created_at');
    if (timeframe !== 'all') {
      notifQuery = notifQuery.gte('created_at', range.startDateUtc).lte('created_at', range.endDateUtc);
    }

    const { data: notifs } = await notifQuery;
    let sent = 0;
    let failed = 0;
    let pending = 0;
    let retries = 0;
    const channelMap: Record<string, { sent: number; failed: number }> = {};

    for (const n of notifs || []) {
      const ch = n.channel || 'whatsapp';
      if (!channelMap[ch]) channelMap[ch] = { sent: 0, failed: 0 };

      if (n.status === 'sent') {
        sent++;
        channelMap[ch].sent += 1;
      } else if (n.status === 'failed') {
        failed++;
        channelMap[ch].failed += 1;
      } else {
        pending++;
      }

      if ((n.attempt_count || 0) > 1) {
        retries++;
      }
    }

    const successRate = sent + failed > 0 ? parseFloat(((sent / (sent + failed)) * 100).toFixed(1)) : 100;

    return {
      average_dispatch_tat_hours: dispatchCount > 0 ? Math.round((totalDispatchMs / dispatchCount) / (1000 * 60 * 60)) : 0,
      average_delivery_tat_days: deliveryCount > 0 ? parseFloat(((totalDeliveryMs / deliveryCount) / (1000 * 60 * 60 * 24)).toFixed(1)) : 0,
      carrier_distribution: carrierDist,
      notification_performance: {
        total_notifications: (notifs || []).length,
        sent_count: sent,
        failed_count: failed,
        pending_count: pending,
        success_rate_pct: successRate,
        retry_count: retries,
        channel_breakdown: channelMap,
      },
    };
  }

  /**
   * Sanitizes a string cell to prevent CSV / spreadsheet formula injection.
   * Prepends a single quote if the cell begins with dangerous characters (=, +, -, @).
   */
  public static sanitizeCsvCell(value: any): string {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(str)) {
      return `"'${str}"`;
    }
    return `"${str}"`;
  }
}
