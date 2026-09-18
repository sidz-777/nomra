-- ============================================================================
-- NAMORA PRODUCTION HARDENING & SECURITY MIGRATION
-- Migration: 001_production_hardening.sql
-- Description:
--   1. Ensures all core tables exist (IF NOT EXISTS)
--   2. Enables RLS across all tables and revokes permissive public write access
--   3. Ensures public storefront can read active products and approved reviews
--   4. Restricts administrative RPC functions to service_role
--   5. Eliminates anonymous modification of orders, payments, settings, and inventory
-- ============================================================================

-- 1. Tables Creation Safeguards (Prevents missing relation crashes on policies)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'frame',
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT,
    category_label TEXT,
    image_url TEXT,
    tag TEXT,
    tag_class TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 499.00,
    deposit_price NUMERIC(10, 2) DEFAULT 49.00,
    cod_price NUMERIC(10, 2) DEFAULT 450.00,
    in_stock BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    stock_quantity INT DEFAULT 10,
    is_stock_managed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 49.00,
    cod_amount NUMERIC(10, 2) NOT NULL DEFAULT 450.00,
    status TEXT NOT NULL DEFAULT 'pending_advance',
    payment_method TEXT DEFAULT 'deposit_cod',
    payment_status TEXT DEFAULT 'unpaid',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    courier_name TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    production_checklist JSONB DEFAULT '{}'::jsonb,
    admin_notes TEXT,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT,
    product_title TEXT,
    product_image TEXT,
    is_ready_made BOOLEAN DEFAULT false,
    category_label TEXT,
    english_name TEXT,
    arabic_name TEXT,
    ink_style TEXT,
    font_style TEXT,
    text_size TEXT,
    has_gift BOOLEAN DEFAULT false,
    gift_to TEXT,
    gift_from TEXT,
    gift_message TEXT,
    gift_price NUMERIC(10, 2) DEFAULT 0.00,
    price NUMERIC(10, 2) NOT NULL,
    deposit NUMERIC(10, 2) NOT NULL DEFAULT 49.00,
    cod NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    order_number TEXT,
    provider TEXT DEFAULT 'razorpay',
    provider_order_id TEXT,
    provider_payment_id TEXT UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'paid',
    method TEXT DEFAULT 'upi',
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL,
    quantity INT NOT NULL,
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    total_orders INT DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    admin_email TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    metadata JSONB,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT,
    reviewer_name TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. PRODUCTS TABLE POLICIES
DROP POLICY IF EXISTS "Allow anon update on products" ON public.products;
DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Service role manages products" ON public.products;

CREATE POLICY "Public can view products" 
    ON public.products FOR SELECT 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Service role manages products" 
    ON public.products FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.products FROM anon, authenticated;

-- 4. SETTINGS TABLE POLICIES
DROP POLICY IF EXISTS "Allow anon all on settings" ON public.settings;
DROP POLICY IF EXISTS "Admins have full access to settings" ON public.settings;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;
DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
DROP POLICY IF EXISTS "Service role manages settings" ON public.settings;

CREATE POLICY "Public can view settings" 
    ON public.settings FOR SELECT 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Service role manages settings" 
    ON public.settings FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.settings FROM anon, authenticated;

-- 5. ORDERS & ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "Public can track order by number or phone" ON public.orders;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Service role manages orders" ON public.orders;
DROP POLICY IF EXISTS "Service role manages order items" ON public.order_items;

CREATE POLICY "Service role manages orders" 
    ON public.orders FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Service role manages order items" 
    ON public.order_items FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

REVOKE ALL ON TABLE public.orders FROM anon;
REVOKE ALL ON TABLE public.order_items FROM anon;

-- 6. PAYMENTS & INVENTORY MOVEMENTS POLICIES
DROP POLICY IF EXISTS "Public can view payments" ON public.payments;
DROP POLICY IF EXISTS "Service role manages payments" ON public.payments;
DROP POLICY IF EXISTS "Service role manages inventory" ON public.inventory_movements;

CREATE POLICY "Service role manages payments" 
    ON public.payments FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Service role manages inventory" 
    ON public.inventory_movements FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

REVOKE ALL ON TABLE public.payments FROM anon;
REVOKE ALL ON TABLE public.inventory_movements FROM anon;

-- 7. REVIEWS POLICIES
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Service role manages reviews" ON public.reviews;

CREATE POLICY "Public can view approved reviews" 
    ON public.reviews FOR SELECT 
    TO anon, authenticated 
    USING (status = 'approved');

CREATE POLICY "Service role manages reviews" 
    ON public.reviews FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.reviews FROM anon;

-- 8. RESTRICT ADMINISTRATIVE FUNCTIONS
REVOKE EXECUTE ON FUNCTION public.update_product_price(TEXT, NUMERIC, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_store_setting(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_product_price(TEXT, NUMERIC, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_store_setting(TEXT, TEXT, TEXT) TO service_role;
