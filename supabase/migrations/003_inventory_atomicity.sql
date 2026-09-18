-- ============================================================================
-- NAMORA ATOMIC INVENTORY & FAIL-CLOSED ORDER CREATION
-- Migration: 003_inventory_atomicity.sql
-- Description:
--   1. Transactional row locking (SELECT ... FOR UPDATE)
--   2. Strict product validation (NO fallback to ₹499)
--   3. Upfront atomic reservation of idempotency key (prevents race conditions)
--   4. Non-digit regex sanitization [^0-9] for phone and PIN
--   5. Respects is_stock_managed semantics
--   6. Consistent deposit authority (sum of item deposits = order deposit)
-- ============================================================================

-- Ensure products table columns exist safely
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_stock_managed BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deposit_price NUMERIC(10, 2) DEFAULT 49.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cod_price NUMERIC(10, 2) DEFAULT 450.00;

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
    IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
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

        SELECT * INTO v_existing_req 
        FROM public.checkout_requests 
        WHERE idempotency_key = trim(p_idempotency_key)
        FOR UPDATE;

        IF v_existing_req.status = 'completed' AND v_existing_req.response_payload IS NOT NULL THEN
            RETURN v_existing_req.response_payload;
        END IF;

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

        -- Resolve authoritative frame deposit
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

        -- Consistent Deposit Calculation
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
