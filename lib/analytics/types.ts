/**
 * NAMORA Analytics & Business Intelligence Types
 */

export type AnalyticsTimeframe =
  | 'today'
  | 'yesterday'
  | '7d'
  | 'last_7_days'
  | '30d'
  | 'last_30_days'
  | 'this_month'
  | 'previous_month'
  | 'custom'
  | 'all';

export interface DateRangeIST {
  startDateUtc: string; // ISO string in UTC
  endDateUtc: string;   // ISO string in UTC
  startDisplayIST: string; // e.g. "2026-09-20 00:00:00 IST"
  endDisplayIST: string;   // e.g. "2026-09-20 23:59:59 IST"
  label: string;
  timezone: string;
}

export interface PipelineBreakdown {
  pending: number;       // pending_advance, pending_payment
  confirmed: number;     // confirmed, advance_paid
  studio_review: number; // personalization_review
  in_production: number; // in_production, processing
  ready_to_ship: number; // ready_to_ship
  in_transit: number;    // dispatched, shipped, out_for_delivery
  delivered: number;     // delivered
  cancelled: number;     // cancelled, returned
}

export interface ExecutiveFinancialSummary {
  gross_order_value: number; // All non-cancelled orders
  advance_collected: number; // Deposits collected on paid/confirmed/shipped/delivered orders
  cod_outstanding: number;   // Pending COD collection on active orders
  delivered_value: number;   // Realized revenue on delivered orders
  cancelled_value: number;   // Lost revenue from cancelled orders
  average_order_value: number; // GOV / valid orders
  total_orders_placed: number;
  valid_orders_count: number;
  cancelled_orders_count: number;
}

export interface ProductPerformanceItem {
  product_id: string;
  title: string;
  category: string;
  units_sold: number;
  gross_sales: number;
  order_count: number;
  gift_attach_count: number;
  current_stock: number;
  in_stock: boolean;
}

export interface ProductAnalyticsSummary {
  top_products: ProductPerformanceItem[];
  total_units_sold: number;
  total_product_revenue: number;
  gift_packaging_orders: number;
  gift_packaging_attach_rate_pct: number;
  gift_packaging_revenue: number;
  customization_stats: {
    font_styles: Record<string, number>;
    ink_styles: Record<string, number>;
    bilingual_count: number;
    monolingual_count: number;
  };
}

export interface InventoryHealthItem {
  id: string;
  title: string;
  sku?: string;
  stock_quantity: number;
  in_stock: boolean;
  status: 'out_of_stock' | 'low_stock' | 'healthy';
}

export interface InventoryAnalyticsSummary {
  total_products: number;
  out_of_stock_count: number;
  low_stock_count: number;
  healthy_stock_count: number;
  total_tracked_units: number;
  critical_items: InventoryHealthItem[];
  recent_movements: Array<{
    id: string;
    product_id: string;
    product_title?: string;
    order_number?: string;
    change_quantity: number;
    movement_type: string;
    notes?: string;
    created_at: string;
  }>;
}

export interface CustomerAnalyticsSummary {
  total_unique_customers: number;
  new_customers_in_period: number;
  repeat_customers_count: number;
  repeat_purchase_rate_pct: number;
  top_delivery_regions: Array<{
    city: string;
    state: string;
    order_count: number;
  }>;
}

export interface OperationsTurnaroundSummary {
  average_dispatch_tat_hours: number;
  average_delivery_tat_days: number;
  carrier_distribution: Record<string, number>;
  notification_performance: {
    total_notifications: number;
    sent_count: number;
    failed_count: number;
    pending_count: number;
    success_rate_pct: number;
    retry_count: number;
    channel_breakdown: Record<string, { sent: number; failed: number }>;
  };
}

export interface AttributionChannelItem {
  source: string;
  medium: string;
  campaign: string;
  order_count: number;
  gross_revenue: number;
}

export interface AttributionSummary {
  status: 'ATTRIBUTION_ACTIVE' | 'ATTRIBUTION_INSTRUMENTATION_REQUIRED';
  total_attributed_orders: number;
  sources: Record<string, number>;
  campaigns: Record<string, number>;
  channels: AttributionChannelItem[];
}

export interface FullAnalyticsOverviewResponse {
  success: boolean;
  timeframe: AnalyticsTimeframe;
  date_range: DateRangeIST;
  financials?: ExecutiveFinancialSummary; // Redacted for staff role
  total_orders: number;
  active_orders: number;
  pipeline: PipelineBreakdown;
  inventory_glance: {
    low_stock_count: number;
    out_of_stock_count: number;
  };
  operations_glance: {
    avg_dispatch_hours: number;
    avg_delivery_days: number;
  };
  role: 'owner' | 'admin' | 'staff';
  attribution_status: 'ATTRIBUTION_ACTIVE' | 'ATTRIBUTION_INSTRUMENTATION_REQUIRED';
  attribution?: AttributionSummary;
}
