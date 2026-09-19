-- ============================================================================
-- NAMORA PHASE 2: ORDER OPERATIONS, INTERNAL NOTES & AUDIT ENFORCEMENT
-- Migration: 007_phase2_order_operations.sql
-- Description:
--   1. Creates order_notes table for multi-entry internal operational notes
--   2. Enforces strict RLS on order_notes (anon DENY, service_role full access)
--   3. Creates performance indices for order_notes
--   4. Validates audit log structure for phase 2 operations
-- ============================================================================

-- 1. Create order_notes table
CREATE TABLE IF NOT EXISTS public.order_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    author_email TEXT NOT NULL DEFAULT 'admin@namoraworld.com',
    note_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indices for high performance queries
CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON public.order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_created_at ON public.order_notes(created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- Anonymous users cannot read or write internal order notes under any circumstances
DO $$
BEGIN
    DROP POLICY IF EXISTS "Deny anon access to order_notes" ON public.order_notes;
    CREATE POLICY "Deny anon access to order_notes"
        ON public.order_notes
        FOR ALL
        TO anon
        USING (false);
END $$;

-- Service role has full administrative access
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow service_role full access to order_notes" ON public.order_notes;
    CREATE POLICY "Allow service_role full access to order_notes"
        ON public.order_notes
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
END $$;

-- 4. Ensure admin_audit_logs table has indices for fast filtering
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity ON public.admin_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
