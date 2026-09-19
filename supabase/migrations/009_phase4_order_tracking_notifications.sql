-- ============================================================================
-- NAMORA PHASE 4: CUSTOMER ORDER EXPERIENCE + NOTIFICATION INFRASTRUCTURE
-- Migration: 009_phase4_order_tracking_notifications.sql
-- Description:
--   1. Non-destructively enhances public.orders with:
--      - tracking_token (128-bit cryptographic random hex token, UNIQUE)
--      - carrier (TEXT default '')
--      - estimated_delivery_date (TIMESTAMPTZ)
--   2. Safely populates collision-free tracking tokens for all existing orders
--   3. Creates public.notification_logs for durable log-first notifications
--   4. Creates public.notification_settings for channel/provider configuration
--   5. Seeds mock-only default notification settings
--   6. Enforces strict RLS (service_role full access, public/anon denied)
--   7. Creates performance and idempotency indexes
-- ============================================================================

-- 1. Ensure cryptographic extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Non-destructively enhance public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;

-- 3. Populate collision-free tracking tokens for existing orders lacking one
-- Uses pgcrypto gen_random_bytes(16) -> 32 hex chars (128-bit cryptographic entropy)
UPDATE public.orders
SET tracking_token = encode(gen_random_bytes(16), 'hex')
WHERE tracking_token IS NULL;

-- Enforce UNIQUE constraint on tracking_token
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_tracking_token_unique'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_tracking_token_unique UNIQUE (tracking_token);
    END IF;
END $$;

-- Index for fast token-based customer lookup
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders(tracking_token);

-- 4. Create public.notification_logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    channel TEXT NOT NULL,
    masked_recipient TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    provider TEXT NOT NULL DEFAULT 'mock',
    provider_message_id TEXT DEFAULT '',
    error_message TEXT DEFAULT '',
    idempotency_key TEXT UNIQUE NOT NULL,
    payload_summary JSONB DEFAULT '{}'::jsonb,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    locked_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_notification_status CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    CONSTRAINT chk_notification_channel CHECK (channel IN ('email', 'whatsapp', 'sms'))
);

-- Performance & Idempotency Indexes for notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_order_created ON public.notification_logs(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type_status ON public.notification_logs(notification_type, status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_idempotency ON public.notification_logs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notification_logs_claim ON public.notification_logs(status, locked_at);

-- 5. Create public.notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    provider TEXT DEFAULT 'mock',
    test_mode BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_notification_settings_channel CHECK (channel IN ('email', 'whatsapp', 'sms'))
);

-- 6. Seed default configuration (Mock-only mode for Phase 4)
INSERT INTO public.notification_settings (channel, is_enabled, provider, test_mode)
VALUES
    ('email', true, 'mock', true),
    ('whatsapp', true, 'mock', true),
    ('sms', true, 'mock', true)
ON CONFLICT (channel) DO UPDATE
SET updated_at = NOW();

-- 7. Strict Row Level Security (RLS)
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Deny public/anon access. Zero anon policies exist.
-- Service role has full administrative bypass in Supabase.
-- For authenticated Postgres roles:
DROP POLICY IF EXISTS "Service role full access on notification_logs" ON public.notification_logs;
CREATE POLICY "Service role full access on notification_logs"
    ON public.notification_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on notification_settings" ON public.notification_settings;
CREATE POLICY "Service role full access on notification_settings"
    ON public.notification_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
