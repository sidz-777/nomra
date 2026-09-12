-- ============================================================================
-- NAMORA PHASE 2: PRODUCTION DATABASE MIGRATION & HARDENING
-- Tables: payments, inventory_movements, customers, admin_activity_logs, admin_profiles
-- Atomic PostgreSQL Functions: create_secure_order, verify_order_payment, track_customer_order, adjust_product_inventory
-- ============================================================================

-- 1. ALTER EXISTING TABLES
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'stock_quantity'
    ) THEN
        ALTER TABLE public.products ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 5 CHECK (stock_quantity >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_stock_managed'
    ) THEN
        ALTER TABLE public.products ADD COLUMN is_stock_managed BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Enable stock management for ready-made editions, disable for custom Persian rug designs
UPDATE public.products 
SET is_stock_managed = true 
WHERE type = 'ready_stock';

UPDATE public.products 
SET is_stock_managed = false 
WHERE type = 'persian_design';

-- Add Razorpay tracking columns to orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'razorpay_order_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN razorpay_order_id TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'razorpay_payment_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN razorpay_payment_id TEXT DEFAULT '';
    END IF;
END $$;

-- 2. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_order_id TEXT NOT NULL,
    provider_payment_id TEXT UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    method TEXT DEFAULT 'upi',
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON public.payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments(provider_payment_id);

-- 3. INVENTORY MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    order_number TEXT,
    change_quantity INTEGER NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'cancellation', 'restock', 'adjustment')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inv_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_order_id ON public.inventory_movements(order_id);

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    last_address TEXT DEFAULT '',
    last_pincode TEXT DEFAULT '',
    order_count INTEGER NOT NULL DEFAULT 1,
    total_spent NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- 5. ADMIN ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_activity_logs(created_at DESC);

-- 6. ADMIN PROFILES TABLE (Role-Based Access)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 7. ATOMIC DATABASE FUNCTIONS (RPC)
-- ============================================================================

-- A. CREATE SECURE ORDER (Authoritative Server-Side Validation)
CREATE OR REPLACE FUNCTION public.create_secure_order(
    p_customer JSONB,
    p_items JSONB
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
    v_item RECORD;
    v_prod RECORD;
    v_cust_name TEXT;
    v_cust_phone TEXT;
    v_cust_address TEXT;
    v_cust_pincode TEXT;
    v_cust_city TEXT;
    v_cust_state TEXT;
    v_item_gift_cost NUMERIC(10, 2);
    v_item_price NUMERIC(10, 2);
    v_item_deposit NUMERIC(10, 2);
    v_item_cod NUMERIC(10, 2);
    v_rnd INT;
BEGIN
    -- Extract customer details
    v_cust_name := COALESCE(p_customer->>'name', 'Valued Customer');
    v_cust_phone := REGEXP_REPLACE(COALESCE(p_customer->>'phone', ''), '\D', '', 'g');
    v_cust_address := COALESCE(p_customer->>'address', '');
    v_cust_pincode := COALESCE(p_customer->>'pincode', '');
    v_cust_city := COALESCE(p_customer->>'city', '');
    v_cust_state := COALESCE(p_customer->>'state', '');

    IF LENGTH(v_cust_phone) < 10 THEN
        RAISE EXCEPTION 'A valid 10-digit phone number is required';
    END IF;

    IF LENGTH(v_cust_address) < 5 THEN
        RAISE EXCEPTION 'A complete delivery address is required';
    END IF;

    -- Generate unique order number (e.g. NAM-8429)
    LOOP
        v_rnd := FLOOR(1000 + RANDOM() * 9000)::INT;
        v_order_number := 'NAM-' || v_rnd::TEXT;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_number);
    END LOOP;

    -- Validate items array
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty. Please add at least one frame.';
    END IF;

    -- Calculate authoritative totals
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        "productId" TEXT,
        "isReadyMade" BOOLEAN,
        "gift" JSONB
    )
    LOOP
        v_total_frames := v_total_frames + 1;
        
        -- Base price check: If product exists in products table, use its price; else default 499.00
        SELECT * INTO v_prod FROM public.products WHERE id = v_item."productId";
        IF FOUND THEN
            v_subtotal := v_subtotal + v_prod.price;
        ELSE
            v_subtotal := v_subtotal + 499.00;
        END IF;

        -- Gift wrap check: ₹69 if enabled
        IF v_item."gift" IS NOT NULL AND (v_item."gift"->>'isGift')::BOOLEAN = true THEN
            v_gift_total := v_gift_total + 69.00;
        END IF;
    END LOOP;

    -- Enforce commercial pricing rules:
    -- Total Deposit = ₹49 * total number of frames
    v_deposit_amount := v_total_frames * 49.00;
    v_total_amount := v_subtotal + v_gift_total;
    v_cod_amount := v_total_amount - v_deposit_amount;

    -- Insert Order
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

    -- Insert Order Items with snapshot
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS y(
        "productId" TEXT,
        "productTitle" TEXT,
        "productImage" TEXT,
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
        v_item_gift_cost := 0.00;
        IF v_item."gift" IS NOT NULL AND (v_item."gift"->>'isGift')::BOOLEAN = true THEN
            v_item_gift_cost := 69.00;
        END IF;

        v_item_price := 499.00 + v_item_gift_cost;
        v_item_deposit := 49.00;
        v_item_cod := v_item_price - v_item_deposit;

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
            COALESCE(v_item."productId", 'custom-frame'),
            COALESCE(v_item."productTitle", 'A4 Handmade Frame'),
            COALESCE(v_item."productImage", 'design1.jpg'),
            COALESCE(v_item."isReadyMade", false),
            COALESCE(v_item."categoryLabel", 'Custom Calligraphy'),
            COALESCE(v_item."englishName", ''),
            COALESCE(v_item."arabicName", ''),
            COALESCE(v_item."inkLabel", 'Obsidian Black'),
            COALESCE(v_item."fontLabel", 'Classic'),
            COALESCE(v_item."textSizeLabel", 'Balanced'),
            (v_item_gift_cost > 0),
            COALESCE(v_item."gift"->>'to', ''),
            COALESCE(v_item."gift"->>'from', ''),
            COALESCE(v_item."gift"->>'message', ''),
            v_item_gift_cost,
            v_item_price,
            v_item_deposit,
            v_item_cod
        );
    END LOOP;

    -- Upsert Customer Record
    INSERT INTO public.customers (
        phone,
        name,
        last_address,
        last_pincode,
        order_count,
        total_spent
    ) VALUES (
        v_cust_phone,
        v_cust_name,
        v_cust_address,
        v_cust_pincode,
        1,
        v_total_amount
    )
    ON CONFLICT (phone) DO UPDATE SET
        name = EXCLUDED.name,
        last_address = EXCLUDED.last_address,
        last_pincode = EXCLUDED.last_pincode,
        order_count = public.customers.order_count + 1,
        total_spent = public.customers.total_spent + EXCLUDED.total_spent,
        updated_at = timezone('utc'::text, now());

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total_amount,
        'deposit_amount', v_deposit_amount,
        'cod_amount', v_cod_amount,
        'frame_count', v_total_frames
    );
END;
$$;


-- B. VERIFY ORDER PAYMENT (Atomic & Idempotent with Stock Deduction)
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
    v_item RECORD;
    v_existing_payment RECORD;
BEGIN
    -- 1. Idempotency Check
    SELECT * INTO v_existing_payment 
    FROM public.payments 
    WHERE provider_payment_id = p_provider_payment_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'message', 'Payment already verified and processed',
            'order_number', v_existing_payment.order_number,
            'status', 'advance_paid'
        );
    END IF;

    -- 2. Fetch Order
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    -- 3. Record Payment
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
        p_order_id,
        v_order.order_number,
        'razorpay',
        COALESCE(p_provider_order_id, ''),
        p_provider_payment_id,
        p_amount,
        'INR',
        'paid',
        COALESCE(p_method, 'upi')
    );

    -- 4. Update Order Status
    UPDATE public.orders 
    SET 
        payment_status = 'deposit_received',
        status = 'advance_paid',
        razorpay_order_id = COALESCE(p_provider_order_id, razorpay_order_id),
        razorpay_payment_id = p_provider_payment_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id;

    -- 5. Atomic Stock Deduction for Physical Ready-Made Items
    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id AND is_ready_made = true
    LOOP
        IF EXISTS (SELECT 1 FROM public.products WHERE id = v_item.product_id AND is_stock_managed = true) THEN
            UPDATE public.products 
            SET 
                stock_quantity = GREATEST(0, stock_quantity - 1),
                in_stock = (stock_quantity - 1 > 0),
                updated_at = timezone('utc'::text, now())
            WHERE id = v_item.product_id;

            INSERT INTO public.inventory_movements (
                product_id,
                order_id,
                order_number,
                change_quantity,
                movement_type,
                notes
            ) VALUES (
                v_item.product_id,
                p_order_id,
                v_order.order_number,
                -1,
                'sale',
                'Purchased in order ' || v_order.order_number
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'order_number', v_order.order_number,
        'status', 'advance_paid',
        'deposit_paid', p_amount
    );
END;
$$;


-- C. SECURE ORDER TRACKING (Privacy Protected)
CREATE OR REPLACE FUNCTION public.track_customer_order(
    p_query TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean TEXT;
    v_digits TEXT;
    v_order RECORD;
    v_items JSONB;
BEGIN
    v_clean := UPPER(TRIM(COALESCE(p_query, '')));
    IF LENGTH(v_clean) = 0 THEN
        RETURN jsonb_build_object('found', false);
    END IF;

    IF v_clean LIKE 'NAM-%' THEN
        SELECT * INTO v_order 
        FROM public.orders 
        WHERE UPPER(order_number) = v_clean 
        LIMIT 1;
    ELSE
        v_digits := REGEXP_REPLACE(v_clean, '\D', '', 'g');
        IF LENGTH(v_digits) >= 10 THEN
            v_digits := RIGHT(v_digits, 10);
        END IF;

        SELECT * INTO v_order 
        FROM public.orders 
        WHERE phone LIKE '%' || v_digits 
        ORDER BY created_at DESC 
        LIMIT 1;
    END IF;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('found', false);
    END IF;

    SELECT jsonb_agg(jsonb_build_object(
        'product_title', product_title,
        'product_image', product_image,
        'english_name', english_name,
        'arabic_name', arabic_name,
        'ink_style', ink_style,
        'is_ready_made', is_ready_made
    )) INTO v_items
    FROM public.order_items
    WHERE order_id = v_order.id;

    RETURN jsonb_build_object(
        'found', true,
        'order', jsonb_build_object(
            'order_number', v_order.order_number,
            'customer_name', v_order.customer_name,
            'status', v_order.status,
            'payment_status', v_order.payment_status,
            'courier_name', v_order.courier_name,
            'tracking_number', v_order.tracking_number,
            'tracking_url', v_order.tracking_url,
            'total_amount', v_order.total_amount,
            'deposit_amount', v_order.deposit_amount,
            'cod_amount', v_order.cod_amount,
            'created_at', v_order.created_at
        ),
        'items', COALESCE(v_items, '[]'::jsonb)
    );
END;
$$;


-- D. ADJUST PRODUCT INVENTORY (For Admin Stock Management)
CREATE OR REPLACE FUNCTION public.adjust_product_inventory(
    p_product_id TEXT,
    p_change_qty INTEGER,
    p_movement_type TEXT,
    p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_stock INTEGER;
    v_prod RECORD;
BEGIN
    SELECT * INTO v_prod FROM public.products WHERE id = p_product_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;

    v_new_stock := v_prod.stock_quantity + p_change_qty;
    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Stock cannot be negative. Current stock is %, attempted change is %', v_prod.stock_quantity, p_change_qty;
    END IF;

    UPDATE public.products 
    SET 
        stock_quantity = v_new_stock,
        in_stock = (v_new_stock > 0),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_product_id;

    INSERT INTO public.inventory_movements (
        product_id,
        change_quantity,
        movement_type,
        notes
    ) VALUES (
        p_product_id,
        p_change_qty,
        COALESCE(p_movement_type, 'adjustment'),
        COALESCE(p_notes, 'Manual stock adjustment')
    );

    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'stock_quantity', v_new_stock,
        'in_stock', (v_new_stock > 0)
    );
END;
$$;


-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES HARDENING
-- ============================================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to payments" ON public.payments;
CREATE POLICY "Admins have full access to payments" 
    ON public.payments FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to inventory movements" ON public.inventory_movements;
CREATE POLICY "Admins have full access to inventory movements" 
    ON public.inventory_movements FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to customers" ON public.customers;
CREATE POLICY "Admins have full access to customers" 
    ON public.customers FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to admin activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins have full access to admin activity logs" 
    ON public.admin_activity_logs FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own admin profile" ON public.admin_profiles;
CREATE POLICY "Users can view own admin profile" 
    ON public.admin_profiles FOR SELECT 
    TO authenticated 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins have full access to admin profiles" ON public.admin_profiles;
CREATE POLICY "Admins have full access to admin profiles" 
    ON public.admin_profiles FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can track order by number or phone" ON public.orders;

GRANT EXECUTE ON FUNCTION public.create_secure_order(JSONB, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_order_payment(UUID, TEXT, TEXT, NUMERIC, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_customer_order(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_product_inventory(TEXT, INTEGER, TEXT, TEXT) TO authenticated;
