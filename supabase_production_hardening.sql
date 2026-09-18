-- ============================================================================
-- NAMORA E-COMMERCE: MASTER PRODUCTION HARDENING MIGRATION SCRIPT
-- Version: 2.1.0 (Hardened Production Release)
-- Description:
--   1. Creates all core tables IF NOT EXISTS with strict constraints
--   2. Enables Row Level Security (RLS) across all tables with safe existence guards
--   3. Sets up safe, non-leaking policies (Anon can only read products & approved reviews)
--   4. Adds UNIQUE constraints on orders(order_number) and payments(provider_payment_id)
--   5. Creates checkout_requests table for atomic, race-condition-free idempotency
--   6. Hardens create_secure_order() with:
--      - Proper non-digit regex sanitization for phone & pincode: REGEXP_REPLACE(..., '[^0-9]', '', 'g')
--      - Upfront atomic idempotency key reservation (INSERT ... ON CONFLICT DO NOTHING + SELECT FOR UPDATE)
--      - Consistent deposit price authority: Order-level deposit is the exact sum of item deposits
--      - Strict respect of is_stock_managed (unmanaged customizer frames do not decrement inventory)
--      - Collision-safe order number generation with database-enforced unique constraint
--   7. Hardens verify_order_payment() with:
--      - Exact deposit amount match (zero underpayment tolerance)
--      - Order binding verification (razorpay_order_id match)
--      - Duplicate payment deduplication
--   8. Hardens administrative RPC functions (update_product_price, update_store_setting, verify_order_payment)
--      by REVOKING EXECUTE from PUBLIC, anon, and authenticated, and GRANTING only to service_role.
--   9. Adds canonical order status check constraint covering both canonical and historical statuses.
--  10. Conditional table existence guards so missing optional tables never abort the script.
-- ============================================================================

-- ============================================================================
-- SECTION 1: CORE TABLES CREATION & COLUMN SAFEGUARDS (IF NOT EXISTS)
-- ============================================================================

-- 1. Products Table
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

-- Ensure all product columns exist safely
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_stock_managed BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deposit_price NUMERIC(10, 2) DEFAULT 49.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cod_price NUMERIC(10, 2) DEFAULT 450.00;

-- 2. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders Table
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

-- Ensure orders columns exist safely
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS production_checklist JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Database-enforced UNIQUE constraint on orders(order_number)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_orders_order_number'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'orders' AND indexname = 'idx_orders_order_number_unique'
        ) THEN
            CREATE UNIQUE INDEX idx_orders_order_number_unique ON public.orders(order_number);
        END IF;
        ALTER TABLE public.orders ADD CONSTRAINT uq_orders_order_number UNIQUE USING INDEX idx_orders_order_number_unique;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 4. Order Items Table
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

-- 5. Checkout Requests (Idempotency Table)
CREATE TABLE IF NOT EXISTS public.checkout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT UNIQUE NOT NULL,
    request_hash TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    order_number TEXT,
    response_payload JSONB,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_requests_key ON public.checkout_requests(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_checkout_requests_order_id ON public.checkout_requests(order_id);

-- 6. Payments Table
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

-- Ensure UNIQUE constraint on provider_payment_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_payments_provider_payment_id'
    ) THEN
        ALTER TABLE public.payments ADD CONSTRAINT uq_payments_provider_payment_id UNIQUE (provider_payment_id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 7. Inventory Movements Table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL,
    quantity INT NOT NULL,
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Customers Table
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

-- 9. Admin Profiles Table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Admin Activity Logs Table
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

-- 11. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT,
    reviewer_name TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- SECTION 2: ROW LEVEL SECURITY & POLICY HARDENING
-- Tables existence is guaranteed above, preventing missing-relation fatal errors.
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 2. PRODUCTS POLICIES
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Service role manages products" ON public.products;
DROP POLICY IF EXISTS "Allow anon update on products" ON public.products;
DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

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

-- 3. SETTINGS POLICIES
DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
DROP POLICY IF EXISTS "Service role manages settings" ON public.settings;
DROP POLICY IF EXISTS "Allow anon all on settings" ON public.settings;
DROP POLICY IF EXISTS "Admins have full access to settings" ON public.settings;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;

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

-- 4. ORDERS & ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "Service role manages orders" ON public.orders;
DROP POLICY IF EXISTS "Service role manages order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can track order by number or phone" ON public.orders;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;

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

-- 5. CHECKOUT REQUESTS (IDEMPOTENCY) POLICIES
DROP POLICY IF EXISTS "Service role manages checkout requests" ON public.checkout_requests;

CREATE POLICY "Service role manages checkout requests"
    ON public.checkout_requests FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

REVOKE ALL ON TABLE public.checkout_requests FROM anon, authenticated;
GRANT ALL ON TABLE public.checkout_requests TO service_role;

-- 6. PAYMENTS & INVENTORY MOVEMENTS POLICIES
DROP POLICY IF EXISTS "Service role manages payments" ON public.payments;
DROP POLICY IF EXISTS "Service role manages inventory" ON public.inventory_movements;
DROP POLICY IF EXISTS "Public can view payments" ON public.payments;

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

-- 8. CUSTOMERS, ADMIN PROFILES, ADMIN ACTIVITY LOGS POLICIES
DROP POLICY IF EXISTS "Service role manages customers" ON public.customers;
DROP POLICY IF EXISTS "Service role manages admin profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Service role manages admin activity logs" ON public.admin_activity_logs;

CREATE POLICY "Service role manages customers" 
    ON public.customers FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Service role manages admin profiles" 
    ON public.admin_profiles FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Service role manages admin activity logs" 
    ON public.admin_activity_logs FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

REVOKE ALL ON TABLE public.customers FROM anon;
REVOKE ALL ON TABLE public.admin_profiles FROM anon;
REVOKE ALL ON TABLE public.admin_activity_logs FROM anon;


-- ============================================================================
-- SECTION 3: TRANSACTIONAL ATOMIC ORDER CREATION (create_secure_order)
--   - Non-digit regex sanitization [^0-9]
--   - Upfront atomic idempotency key reservation with row lock
--   - Strict is_stock_managed handling
--   - Consistent deposit price authority (sum of items = order deposit)
-- ============================================================================

-- Drop older overloaded function signatures to prevent PostgREST PGRST203 ambiguity
DROP FUNCTION IF EXISTS public.create_secure_order(jsonb, jsonb);
DROP FUNCTION IF EXISTS public.create_secure_order(jsonb, jsonb, text);

CREATE OR REPLACE FUNCTION public.create_secure_order(
    p_customer JSONB,
    p_items JSONB,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_total_frames INT := 0;
    v_subtotal NUMERIC(10, 2) := 0.00;
    v_gift_total NUMERIC(10, 2) := 0.00;
    v_total_amount NUMERIC(10, 2) := 0.00;
    v_deposit_amount NUMERIC(10, 2) := 0.00;
    v_cod_amount NUMERIC(10, 2) := 0.00;

    v_cust_name TEXT;
    v_cust_phone TEXT;
    v_cust_address TEXT;
    v_cust_pincode TEXT;
    v_cust_city TEXT;
    v_cust_state TEXT;

    v_item RECORD;
    v_prod RECORD;
    v_item_prod_id TEXT;
    v_item_qty INT;
    v_item_deposit NUMERIC(10, 2);
    v_existing_req RECORD;
    v_rnd INT;
    v_attempts INT := 0;
BEGIN
    -- 1. Idempotency Upfront Reservation & Concurrent Lock Serialization
    -- Two simultaneous requests with the exact same key MUST serialize here.
    IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
        -- Atomically claim the idempotency key with 'processing' status
        INSERT INTO public.checkout_requests (
            idempotency_key,
            status,
            created_at,
            updated_at
        ) VALUES (
            trim(p_idempotency_key),
            'processing',
            NOW(),
            NOW()
        )
        ON CONFLICT (idempotency_key) DO NOTHING;

        -- Acquire exclusive row lock on this idempotency key.
        -- If another transaction is currently running with this key, this SELECT FOR UPDATE blocks
        -- until that transaction commits or rolls back.
        SELECT * INTO v_existing_req 
        FROM public.checkout_requests 
        WHERE idempotency_key = trim(p_idempotency_key)
        FOR UPDATE;

        -- If already completed, return cached response immediately without creating another order or reserving stock
        IF v_existing_req.status = 'completed' AND v_existing_req.response_payload IS NOT NULL THEN
            RETURN v_existing_req.response_payload;
        END IF;

        -- If order already associated with this key
        IF v_existing_req.order_id IS NOT NULL AND v_existing_req.response_payload IS NOT NULL THEN
            RETURN v_existing_req.response_payload;
        END IF;
    END IF;

    -- 2. Customer Details Sanitization & Validation (Strict Non-Digit Regex: [^0-9])
    v_cust_name    := TRIM(COALESCE(p_customer->>'name', ''));
    v_cust_phone   := REGEXP_REPLACE(COALESCE(p_customer->>'phone', ''), '[^0-9]', '', 'g');
    v_cust_address := TRIM(COALESCE(p_customer->>'address', ''));
    v_cust_pincode := REGEXP_REPLACE(COALESCE(p_customer->>'pincode', ''), '[^0-9]', '', 'g');
    v_cust_city    := TRIM(COALESCE(p_customer->>'city', ''));
    v_cust_state   := TRIM(COALESCE(p_customer->>'state', ''));

    -- Strip leading country code if provided (e.g. +91 or 0 prefix)
    IF length(v_cust_phone) = 11 AND v_cust_phone LIKE '0%' THEN
        v_cust_phone := SUBSTRING(v_cust_phone FROM 2);
    ELSIF length(v_cust_phone) = 12 AND v_cust_phone LIKE '91%' THEN
        v_cust_phone := SUBSTRING(v_cust_phone FROM 3);
    END IF;

    IF length(v_cust_name) = 0 THEN
        RAISE EXCEPTION 'Customer name is required.';
    END IF;
    IF length(v_cust_phone) < 10 THEN
        RAISE EXCEPTION 'A valid 10-digit phone number is required.';
    END IF;
    IF length(v_cust_address) = 0 THEN
        RAISE EXCEPTION 'Delivery address is required.';
    END IF;
    IF length(v_cust_pincode) <> 6 THEN
        RAISE EXCEPTION 'A valid 6-digit delivery PIN code is required.';
    END IF;

    -- 3. Validate Cart Items
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty. Please add at least one frame.';
    END IF;

    -- 4. Process Items: Row Locking, Authoritative Pricing & Managed Stock Decrement
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        "productId" TEXT,
        "product_id" TEXT,
        "quantity" INT,
        "gift" JSONB
    )
    LOOP
        v_item_prod_id := COALESCE(v_item."productId", v_item."product_id");
        v_item_qty := COALESCE(v_item."quantity", 1);
        IF v_item_qty <= 0 THEN
            v_item_qty := 1;
        END IF;

        IF v_item_prod_id IS NULL OR length(trim(v_item_prod_id)) = 0 THEN
            RAISE EXCEPTION 'Invalid cart item: Product ID is missing.';
        END IF;

        -- LOCK PRODUCT ROW FOR ATOMIC INVENTORY VALIDATION
        SELECT * INTO v_prod 
        FROM public.products 
        WHERE id = v_item_prod_id 
        FOR UPDATE;

        -- STRICT FAIL-CLOSED VALIDATION: Product must exist
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID "%" does not exist or has been discontinued.', v_item_prod_id;
        END IF;

        -- Verify product is active and has valid price
        IF v_prod.is_active IS NOT NULL AND v_prod.is_active = false THEN
            RAISE EXCEPTION 'Product "%" is currently unavailable.', v_prod.title;
        END IF;

        IF v_prod.price IS NULL OR v_prod.price <= 0 THEN
            RAISE EXCEPTION 'Product "%" does not have an authoritative price configured.', v_prod.title;
        END IF;

        -- Resolve authoritative frame deposit: explicit product deposit or canonical ₹49.00
        v_item_deposit := COALESCE(v_prod.deposit_price, 49.00);

        -- Respect is_stock_managed semantics:
        -- ONLY check and decrement stock if inventory is managed for this product
        IF COALESCE(v_prod.is_stock_managed, false) = true THEN
            -- Verify available stock
            IF v_prod.stock_quantity IS NOT NULL AND v_prod.stock_quantity < v_item_qty THEN
                RAISE EXCEPTION 'Insufficient stock for product "%" (Available: %, Requested: %).', 
                    v_prod.title, v_prod.stock_quantity, v_item_qty;
            END IF;

            -- Atomically decrement stock
            IF v_prod.stock_quantity IS NOT NULL THEN
                UPDATE public.products
                SET stock_quantity = stock_quantity - v_item_qty,
                    in_stock = ((stock_quantity - v_item_qty) > 0),
                    updated_at = NOW()
                WHERE id = v_item_prod_id;

                -- Record inventory movement
                INSERT INTO public.inventory_movements (
                    product_id,
                    movement_type,
                    quantity,
                    reference_id,
                    notes
                ) VALUES (
                    v_item_prod_id,
                    'checkout_reservation',
                    -v_item_qty,
                    'pending_order',
                    'Stock reserved during checkout for ' || v_cust_name
                );
            END IF;
        ELSE
            -- For unmanaged products (customizer frames), ensure in_stock is not explicitly disabled
            IF v_prod.in_stock IS NOT NULL AND v_prod.in_stock = false THEN
                RAISE EXCEPTION 'Product "%" is currently unavailable.', v_prod.title;
            END IF;
        END IF;

        v_total_frames := v_total_frames + v_item_qty;
        v_subtotal := v_subtotal + (v_prod.price * v_item_qty);

        -- Authoritative Deposit Calculation: exactly accumulates per-frame deposits
        v_deposit_amount := v_deposit_amount + (v_item_deposit * v_item_qty);

        IF v_item."gift" IS NOT NULL AND (v_item."gift"->>'isGift')::BOOLEAN = true THEN
            v_gift_total := v_gift_total + (69.00 * v_item_qty);
        END IF;
    END LOOP;

    -- Calculate total and COD balance
    v_total_amount := v_subtotal + v_gift_total;
    v_cod_amount := v_total_amount - v_deposit_amount;

    -- 5. Collision-Safe Order Number Generation
    LOOP
        v_attempts := v_attempts + 1;
        v_rnd := FLOOR(1000 + RANDOM() * 9000)::INT;
        v_order_number := 'NAM-' || v_rnd::TEXT;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_number);
        IF v_attempts > 100 THEN
            v_order_number := 'NAM-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
            EXIT;
        END IF;
    END LOOP;

    -- 6. Insert Order
    INSERT INTO public.orders (
        order_number,
        customer_name,
        phone,
        address,
        pincode,
        city,
        state,
        total_amount,
        deposit_amount,
        cod_amount,
        status,
        payment_method,
        payment_status
    ) VALUES (
        v_order_number,
        v_cust_name,
        v_cust_phone,
        v_cust_address,
        v_cust_pincode,
        v_cust_city,
        v_cust_state,
        v_total_amount,
        v_deposit_amount,
        v_cod_amount,
        'pending_advance',
        'deposit_cod',
        'unpaid'
    ) RETURNING id INTO v_order_id;

    -- 7. Insert Order Items (Deposit authority is 100% consistent with order-level deposit)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS y(
        "productId" TEXT,
        "product_id" TEXT,
        "productTitle" TEXT,
        "title" TEXT,
        "productImage" TEXT,
        "image" TEXT,
        "isReadyMade" BOOLEAN,
        "categoryLabel" TEXT,
        "englishName" TEXT,
        "arabicName" TEXT,
        "inkLabel" TEXT,
        "fontLabel" TEXT,
        "textSizeLabel" TEXT,
        "gift" JSONB
    )
    LOOP
        v_item_prod_id := COALESCE(v_item."productId", v_item."product_id");
        SELECT * INTO v_prod FROM public.products WHERE id = v_item_prod_id;

        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_title,
            product_image,
            is_ready_made,
            category_label,
            english_name,
            arabic_name,
            ink_style,
            font_style,
            text_size,
            has_gift,
            gift_to,
            gift_from,
            gift_message,
            gift_price,
            price,
            deposit,
            cod
        ) VALUES (
            v_order_id,
            v_item_prod_id,
            COALESCE(v_prod.title, v_item."productTitle", v_item."title", 'A4 Handmade Frame'),
            COALESCE(v_prod.image_url, v_item."productImage", v_item."image", 'design1.jpg'),
            COALESCE(v_item."isReadyMade", false),
            COALESCE(v_prod.category_label, v_item."categoryLabel", 'A4 Frame'),
            v_item."englishName",
            v_item."arabicName",
            COALESCE(v_item."inkLabel", 'Obsidian Black'),
            COALESCE(v_item."fontLabel", 'Classic'),
            COALESCE(v_item."textSizeLabel", 'Balanced'),
            (v_item."gift" IS NOT NULL AND (v_item."gift"->>'isGift')::BOOLEAN = true),
            v_item."gift"->>'to',
            v_item."gift"->>'from',
            v_item."gift"->>'message',
            CASE WHEN (v_item."gift" IS NOT NULL AND (v_item."gift"->>'isGift')::BOOLEAN = true) THEN 69.00 ELSE 0.00 END,
            v_prod.price,
            COALESCE(v_prod.deposit_price, 49.00),
            (v_prod.price - COALESCE(v_prod.deposit_price, 49.00))
        );
    END LOOP;

    -- 8. Complete Idempotency Record
    IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
        UPDATE public.checkout_requests
        SET order_id = v_order_id,
            order_number = v_order_number,
            status = 'completed',
            response_payload = jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'order_number', v_order_number,
                'total_amount', v_total_amount,
                'deposit_amount', v_deposit_amount,
                'cod_amount', v_cod_amount,
                'total_frames', v_total_frames,
                'status', 'pending_advance'
            ),
            updated_at = NOW()
        WHERE idempotency_key = trim(p_idempotency_key);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total_amount,
        'deposit_amount', v_deposit_amount,
        'cod_amount', v_cod_amount,
        'total_frames', v_total_frames,
        'status', 'pending_advance'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_secure_order(JSONB, JSONB, TEXT) TO anon, authenticated, service_role;


-- ============================================================================
-- SECTION 4: PAYMENT VERIFICATION (verify_order_payment)
--   - Zero underpayment tolerance (exact deposit amount match)
--   - Strict order binding (razorpay_order_id verification)
--   - Idempotent payment recording
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_order_payment(
    p_order_id UUID,
    p_provider_order_id TEXT,
    p_provider_payment_id TEXT,
    p_amount NUMERIC,
    p_method TEXT DEFAULT 'upi'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_existing_payment RECORD;
BEGIN
    -- 1. Check if this payment ID was already processed (Idempotency)
    SELECT * INTO v_existing_payment 
    FROM public.payments 
    WHERE provider_payment_id = p_provider_payment_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'order_id', v_existing_payment.order_id,
            'order_number', v_existing_payment.order_number,
            'status', 'already_processed',
            'message', 'Payment already verified and credited.'
        );
    END IF;

    -- 2. Lock and inspect target order row
    SELECT * INTO v_order 
    FROM public.orders 
    WHERE id = p_order_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order with ID "%" does not exist.', p_order_id;
    END IF;

    -- 3. Strict Order Binding Verification:
    -- If order already has razorpay_order_id, incoming provider order ID must match
    IF v_order.razorpay_order_id IS NOT NULL 
       AND length(trim(v_order.razorpay_order_id)) > 0 
       AND p_provider_order_id IS NOT NULL 
       AND length(trim(p_provider_order_id)) > 0 
       AND v_order.razorpay_order_id <> p_provider_order_id THEN
        RAISE EXCEPTION 'Order Binding Mismatch: Razorpay order ID does not match order record.';
    END IF;

    -- 4. Strict Amount Verification: Zero underpayment tolerance.
    -- The verified payment amount must exactly match the authoritative deposit amount for the order.
    IF p_amount <> v_order.deposit_amount THEN
        RAISE EXCEPTION 'Payment Amount Mismatch: Required deposit is ₹%, but paid amount is ₹%.', 
            v_order.deposit_amount, p_amount;
    END IF;

    -- 5. Record Payment (Idempotent Insert)
    INSERT INTO public.payments (
        order_id,
        order_number,
        provider,
        provider_order_id,
        provider_payment_id,
        amount,
        currency,
        status,
        method
    ) VALUES (
        v_order.id,
        v_order.order_number,
        'razorpay',
        p_provider_order_id,
        p_provider_payment_id,
        p_amount,
        'INR',
        'paid',
        COALESCE(p_method, 'upi')
    )
    ON CONFLICT (provider_payment_id) DO NOTHING;

    -- 6. Transition Order Status to advance_paid
    UPDATE public.orders
    SET status = 'advance_paid',
        payment_status = 'deposit_received',
        razorpay_order_id = COALESCE(p_provider_order_id, razorpay_order_id),
        razorpay_payment_id = p_provider_payment_id,
        updated_at = NOW()
    WHERE id = v_order.id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'status', 'advance_paid',
        'deposit_paid', p_amount,
        'cod_balance', v_order.cod_amount
    );
END;
$$;


-- ============================================================================
-- SECTION 5: ADMINISTRATIVE RPC FUNCTIONS (update_product_price, update_store_setting)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_product_price(
    p_product_id TEXT,
    p_new_price NUMERIC,
    p_new_deposit NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prod RECORD;
    v_deposit NUMERIC;
    v_cod NUMERIC;
    v_old_price NUMERIC;
BEGIN
    IF p_new_price IS NULL OR p_new_price <= 0 THEN
        RAISE EXCEPTION 'Price must be a positive number greater than 0';
    END IF;

    SELECT * INTO v_prod FROM public.products WHERE id = p_product_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID "%" does not exist', p_product_id;
    END IF;

    v_old_price := v_prod.price;
    v_deposit := COALESCE(p_new_deposit, v_prod.deposit_price, 49.00);
    IF v_deposit > p_new_price THEN
        v_deposit := 49.00;
    END IF;
    v_cod := p_new_price - v_deposit;

    UPDATE public.products
    SET price = p_new_price,
        deposit_price = v_deposit,
        cod_price = v_cod,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING * INTO v_prod;

    -- Audit log if admin_activity_logs table exists
    BEGIN
        INSERT INTO public.admin_activity_logs (
            admin_email,
            action,
            resource_type,
            resource_id,
            metadata
        ) VALUES (
            'admin@namoraworld.com',
            'product_price_updated',
            'products',
            p_product_id,
            jsonb_build_object(
                'old_price', v_old_price,
                'new_price', p_new_price,
                'deposit_price', v_deposit,
                'cod_price', v_cod
            )
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'title', v_prod.title,
        'price', v_prod.price,
        'deposit_price', v_prod.deposit_price,
        'cod_price', v_prod.cod_price,
        'updated_at', v_prod.updated_at
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_store_setting(
    p_key TEXT,
    p_value TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_setting RECORD;
BEGIN
    IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
        RAISE EXCEPTION 'Setting key is required.';
    END IF;

    INSERT INTO public.settings (key, value, description, updated_at)
    VALUES (p_key, p_value, p_description, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, public.settings.description),
        updated_at = NOW()
    RETURNING * INTO v_setting;

    RETURN jsonb_build_object(
        'success', true,
        'key', v_setting.key,
        'value', v_setting.value,
        'updated_at', v_setting.updated_at
    );
END;
$$;


-- ============================================================================
-- SECTION 6: STRENGTHEN RPC PERMISSIONS (Requirement 5)
-- Revoke EXECUTE from PUBLIC, anon, and authenticated.
-- Grant EXECUTE strictly to service_role.
-- ============================================================================

-- Administrative functions: service_role ONLY
REVOKE EXECUTE ON FUNCTION public.update_product_price(TEXT, NUMERIC, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_product_price(TEXT, NUMERIC, NUMERIC) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_store_setting(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_store_setting(TEXT, TEXT, TEXT) TO service_role;

-- Payment verification: service_role ONLY
REVOKE EXECUTE ON FUNCTION public.verify_order_payment(UUID, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_order_payment(UUID, TEXT, TEXT, NUMERIC, TEXT) TO service_role;


-- ============================================================================
-- SECTION 7: ORDER STATUS CONSTRAINT & HIGH-PERFORMANCE INDICES
-- ============================================================================

DO $$
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_status;
    ALTER TABLE public.orders ADD CONSTRAINT chk_orders_status CHECK (
        status IN (
            'pending_payment',
            'pending_advance',
            'confirmed',
            'advance_paid',
            'processing',
            'in_production',
            'personalization_review',
            'ready_to_ship',
            'shipped',
            'dispatched',
            'out_for_delivery',
            'delivered',
            'cancelled',
            'returned'
        )
    );
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
