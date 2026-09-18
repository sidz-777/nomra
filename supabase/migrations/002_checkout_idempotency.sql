-- ============================================================================
-- NAMORA CHECKOUT IDEMPOTENCY MIGRATION
-- Migration: 002_checkout_idempotency.sql
-- Description:
--   Creates a database-backed checkout_requests table to prevent duplicate
--   order creation, double charging, and race conditions upon retry.
-- ============================================================================

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

ALTER TABLE public.checkout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages checkout requests" ON public.checkout_requests;
CREATE POLICY "Service role manages checkout requests"
    ON public.checkout_requests FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

REVOKE ALL ON TABLE public.checkout_requests FROM anon, authenticated;
GRANT ALL ON TABLE public.checkout_requests TO service_role;
