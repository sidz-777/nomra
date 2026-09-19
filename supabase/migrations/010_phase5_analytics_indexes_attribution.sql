-- ============================================================================
-- NAMORA PHASE 5: ANALYTICS, REPORTING & BUSINESS INTELLIGENCE
-- Migration: 010_phase5_analytics_indexes_attribution.sql
-- Description:
--   1. Adds performance indexes for high-volume analytics aggregations:
--      - order_items(product_id) for product sales performance
--      - orders(created_at DESC, status) for date-filtered pipeline queries
--      - inventory_movements(product_id, created_at DESC) for velocity audits
--   2. Non-destructively enhances public.orders with attribution columns:
--      - utm_source, utm_medium, utm_campaign, referrer
--      - campaign_id (FK to public.campaigns)
--   3. Adds attribution performance indexes
-- ============================================================================

-- 1. Performance Indexes for Analytics Aggregations
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_status ON public.orders(created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_prod_date ON public.inventory_movements(product_id, created_at DESC);

-- 2. Non-Destructive Attribution Columns on public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_source TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_medium TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_campaign TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referrer TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- 3. Attribution Indexes
CREATE INDEX IF NOT EXISTS idx_orders_campaign_id ON public.orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_orders_utm_source ON public.orders(utm_source);
