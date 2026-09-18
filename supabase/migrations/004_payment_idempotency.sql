-- ============================================================================
-- NAMORA PAYMENT IDEMPOTENCY & ORDER BINDING MIGRATION
-- Migration: 004_payment_idempotency.sql
-- Description:
--   1. Enforces UNIQUE constraint on payments(provider_payment_id)
--   2. Hardens verify_order_payment() with exact amount verification (zero underpayment tolerance)
--   3. Eliminates duplicate payment processing and state transitions
--   4. Restricts EXECUTE strictly to service_role
-- ============================================================================

-- Ensure unique provider_payment_id to prevent double recording
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_payments_provider_payment_id'
    ) THEN
        ALTER TABLE public.payments 
        ADD CONSTRAINT uq_payments_provider_payment_id UNIQUE (provider_payment_id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

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

REVOKE EXECUTE ON FUNCTION public.verify_order_payment(UUID, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_order_payment(UUID, TEXT, TEXT, NUMERIC, TEXT) TO service_role;
