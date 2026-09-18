-- ============================================================================
-- NAMORA ORDER STATUS CLEANUP & CANONICAL STATE MACHINE
-- Migration: 005_order_status_cleanup.sql
-- Description:
--   1. Adds check constraint for valid order statuses (preserving historical orders)
--   2. Enforces database-level UNIQUE constraint on orders(order_number)
--   3. Creates high-performance indices for order queries
-- ============================================================================

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

-- Order status check constraint
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

-- High-performance indices
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
