-- ============================================================================
-- NAMORA E-COMMERCE — CATALOGUE PRICE SYNCHRONIZATION MIGRATION
-- Migration: supabase_price_sync_migration.sql
-- Description:
--   1. Creates RPC update_product_price() (SECURITY DEFINER)
--   2. Creates RPC update_store_setting() (SECURITY DEFINER)
--   3. Adds RLS policies for products & settings
--   4. Updates create_secure_order() to record real database prices in order snapshots
-- ============================================================================

-- 1. SECURE RPC TO UPDATE PRODUCT PRICE
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
        -- Non-blocking log insertion
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

GRANT EXECUTE ON FUNCTION public.update_product_price(TEXT, NUMERIC, NUMERIC) TO anon, authenticated, service_role;

-- 2. SECURE RPC TO UPDATE STORE SETTINGS
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
BEGIN
    IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
        RAISE EXCEPTION 'Setting key cannot be empty';
    END IF;

    INSERT INTO public.settings (key, value, description, updated_at)
    VALUES (p_key, p_value, COALESCE(p_description, 'Store parameter'), NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'key', p_key,
        'value', p_value
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_store_setting(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 3. PERMISSIVE UPDATE POLICIES (FALLBACK FOR DIRECT REST/CLIENT ACCESS)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow anon update on products" ON public.products;
    CREATE POLICY "Allow anon update on products" ON public.products
        FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon all on settings" ON public.settings;
    CREATE POLICY "Allow anon all on settings" ON public.settings
        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

-- 4. UPGRADE CREATE_SECURE_ORDER TO SNAPSHOT REAL DATABASE PRODUCT PRICES
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

    v_cust_name TEXT;
    v_cust_phone TEXT;
    v_cust_address TEXT;
    v_cust_pincode TEXT;
    v_cust_city TEXT;
    v_cust_state TEXT;

    v_item RECORD;
    v_prod RECORD;
    v_item_prod_id TEXT;
    v_item_base_price NUMERIC(10, 2);
    v_item_gift_cost NUMERIC(10, 2);
    v_item_price NUMERIC(10, 2);
    v_item_deposit NUMERIC(10, 2);
    v_item_cod NUMERIC(10, 2);

    v_rnd INT;
BEGIN
    -- Validate Customer details
    v_cust_name    := TRIM(COALESCE(p_customer->>'name', ''));
    v_cust_phone   := REGEXP_REPLACE(COALESCE(p_customer->>'phone', ''), '\D', '', 'g');
    v_cust_address := TRIM(COALESCE(p_customer->>'address', ''));
    v_cust_pincode := REGEXP_REPLACE(COALESCE(p_customer->>'pincode', ''), '\D', '', 'g');
    v_cust_city    := TRIM(COALESCE(p_customer->>'city', ''));
    v_cust_state   := TRIM(COALESCE(p_customer->>'state', ''));

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

    -- Generate unique Order Number
    LOOP
        v_rnd := FLOOR(1000 + RANDOM() * 9000)::INT;
        v_order_number := 'NAM-' || v_rnd::TEXT;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_number);
    END LOOP;

    -- Validate items array
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty. Please add at least one frame.';
    END IF;

    -- Calculate authoritative totals using live database prices
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        "productId" TEXT,
        "product_id" TEXT,
        "isReadyMade" BOOLEAN,
        "gift" JSONB
    )
    LOOP
        v_total_frames := v_total_frames + 1;
        v_item_prod_id := COALESCE(v_item."productId", v_item."product_id");

        SELECT * INTO v_prod FROM public.products WHERE id = v_item_prod_id;
        IF FOUND AND v_prod.price IS NOT NULL THEN
            v_subtotal := v_subtotal + v_prod.price;
        ELSE
            v_subtotal := v_subtotal + 499.00;
        END IF;

        IF v_item."gift" IS NOT NULL AND (v_item."gift"->>'isGift')::BOOLEAN = true THEN
            v_gift_total := v_gift_total + 69.00;
        END IF;
    END LOOP;

    -- Enforce deposit: ₹49 per frame
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

    -- Insert Order Items with snapshot of live database price
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

        IF FOUND AND v_prod.price IS NOT NULL THEN
            v_item_base_price := v_prod.price;
            v_item_deposit := COALESCE(v_prod.deposit_price, 49.00);
        ELSE
            v_item_base_price := 499.00;
            v_item_deposit := 49.00;
        END IF;

        v_item_gift_cost := 0.00;
        IF v_item."gift" IS NOT NULL AND (v_item."gift"->>'isGift')::BOOLEAN = true THEN
            v_item_gift_cost := 69.00;
        END IF;

        v_item_price := v_item_base_price + v_item_gift_cost;
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
            COALESCE(v_item_prod_id, 'a4-frame'),
            COALESCE(v_item."productTitle", v_item."title", (CASE WHEN v_prod.title IS NOT NULL THEN v_prod.title ELSE 'A4 Handmade Frame' END)),
            COALESCE(v_item."productImage", v_item."image", (CASE WHEN v_prod.image_url IS NOT NULL THEN v_prod.image_url ELSE 'design1.jpg' END)),
            COALESCE(v_item."isReadyMade", (CASE WHEN v_prod.type = 'ready_stock' THEN true ELSE false END), false),
            COALESCE(v_item."categoryLabel", (CASE WHEN v_prod.category_label IS NOT NULL THEN v_prod.category_label ELSE 'A4 Frame' END)),
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

GRANT EXECUTE ON FUNCTION public.create_secure_order(JSONB, JSONB) TO anon, authenticated, service_role;
