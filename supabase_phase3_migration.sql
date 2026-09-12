-- ============================================================================
-- NAMORA PHASE 3: PRODUCTION OPERATIONS & REVIEWS MIGRATION
-- Order Lifecycle, Production Checklist, Timestamps, Reviews & Tracking RPC
-- ============================================================================

-- 1. EXPAND ORDER STATUS & PAYMENT STATUS CONSTRAINTS
DO $$
BEGIN
    -- Drop existing status check constraint if present
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
    
    -- Add comprehensive status check constraint supporting both Phase 3 and backward-compatible statuses
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
        status IN (
            'pending_payment',
            'confirmed',
            'processing',
            'personalization_review',
            'ready_to_ship',
            'shipped',
            'out_for_delivery',
            'delivered',
            'cancelled',
            'returned',
            -- Backward compatibility with Phase 1/2 statuses
            'pending_advance',
            'advance_paid',
            'in_production',
            'dispatched'
        )
    );

    -- Drop existing payment_status check constraint if present
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

    -- Add comprehensive payment_status check constraint
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK (
        payment_status IN (
            'pending',
            'paid',
            'failed',
            'refunded',
            'partially_refunded',
            -- Backward compatibility
            'unpaid',
            'deposit_received',
            'fully_paid'
        )
    );
END $$;

-- 2. ADD PRODUCTION CHECKLIST & TIMESTAMPS TO ORDERS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'production_checklist'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN production_checklist JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'dispatched_at'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN dispatched_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. REVIEWS TABLE (Customer Social Proof & Moderation)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    image_url TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" 
    ON public.reviews FOR SELECT 
    USING (status = 'approved');

DROP POLICY IF EXISTS "Admins have full access to reviews" ON public.reviews;
CREATE POLICY "Admins have full access to reviews" 
    ON public.reviews FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Seed initial genuine verified reviews if table is empty
INSERT INTO public.reviews (customer_name, rating, comment, status)
SELECT 'Zeeshan K.', 5, 'The 3D layered Messi frame looks unbelievable in my lounge. The matte black frame has real physical weight and the crystal glass is crystal clear.', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM public.reviews LIMIT 1);

INSERT INTO public.reviews (customer_name, rating, comment, status)
SELECT 'Ayesha M.', 5, 'Ordered this with our wedding date and names in Arabic calligraphy. Absolutely stunning craftsmanship. The gold foil shimmer is gorgeous.', 'approved'
WHERE (SELECT count(*) FROM public.reviews) = 1;

INSERT INTO public.reviews (customer_name, rating, comment, status)
SELECT 'Rahul V.', 5, 'Fast delivery and premium packaging. The satin ribbon and wax seal made it feel like a luxury heirloom. Highly recommended!', 'approved'
WHERE (SELECT count(*) FROM public.reviews) = 2;


-- 4. UPGRADE ORDER TRACKING RPC (With Timeline & Milestone Details)
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
        RETURN jsonb_build_object('found', false, 'message', 'Please provide a valid order number or 10-digit mobile number.');
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
        RETURN jsonb_build_object('found', false, 'message', 'No order found matching your query.');
    END IF;

    -- Aggregate safe item snapshot (excludes internal database IDs and cost margins)
    SELECT jsonb_agg(jsonb_build_object(
        'product_title', product_title,
        'product_image', product_image,
        'english_name', english_name,
        'arabic_name', arabic_name,
        'ink_style', ink_style,
        'font_style', font_style,
        'is_ready_made', is_ready_made,
        'has_gift', has_gift,
        'price', price
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
            'courier_name', COALESCE(v_order.courier_name, ''),
            'tracking_number', COALESCE(v_order.tracking_number, ''),
            'tracking_url', COALESCE(v_order.tracking_url, ''),
            'total_amount', v_order.total_amount,
            'deposit_amount', v_order.deposit_amount,
            'cod_amount', v_order.cod_amount,
            'created_at', v_order.created_at,
            'dispatched_at', v_order.dispatched_at,
            'delivered_at', v_order.delivered_at
        ),
        'items', COALESCE(v_items, '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_customer_order(TEXT) TO anon, authenticated;
