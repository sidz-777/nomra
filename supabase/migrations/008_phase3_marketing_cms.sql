-- ============================================================================
-- NAMORA PHASE 3: MARKETING CMS, CUSTOMER EXPERIENCE & CONVERSION
-- Migration: 008_phase3_marketing_cms.sql
-- Description:
--   1. Creates homepage_content table for dynamic announcement bar & hero content
--   2. Non-destructively enhances existing reviews table (is_featured, display_order, location, order_id)
--   3. Creates customer_gallery table for real finished works lookbook photos
--   4. Creates seo_metadata table for per-page SEO & Open Graph meta
--   5. Creates campaigns table for promotional badges and marketing campaigns
--   6. Enforces strict RLS (public read-only for approved/active, service_role full access, zero anon writes)
--   7. Creates performance indices
-- ============================================================================

-- 1. Create homepage_content table
CREATE TABLE IF NOT EXISTS public.homepage_content (
    key TEXT PRIMARY KEY,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT DEFAULT 'admin@namoraworld.com'
);

ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- Seed default homepage content if not present
INSERT INTO public.homepage_content (key, content, is_active)
VALUES 
(
    'announcement_bar',
    '{
        "enabled": true,
        "badge": "FESTIVE GIFTING",
        "text": "Handcrafted in India • Free Express Air Delivery • Reserve with Rs. 49, Pay Balance Rs. 450 on COD",
        "cta_label": "Customize Yours →",
        "cta_link": "#create",
        "start_date": null,
        "end_date": null
    }'::jsonb,
    true
),
(
    'hero_section',
    '{
        "enabled": true,
        "eyebrow": "Real Handmade Wall Frames",
        "title": "Because some names deserve to be framed.",
        "description": "Personalized A4 framed calligraphy crafted on authentic Persian & oriental aesthetic backgrounds — hand-finished, delivered to your door.",
        "cta_primary_label": "Customize Yours",
        "cta_primary_link": "#create",
        "cta_secondary_label": "See Real Works",
        "cta_secondary_link": "#gallery",
        "trust_line": "Handmade in India · Dispatches in 24–48 hrs · Free remake if not happy",
        "video_url": "/hero-video.mp4",
        "poster_url": "/design1.jpg"
    }'::jsonb,
    true
)
ON CONFLICT (key) DO NOTHING;

-- 2. Non-destructively enhance existing reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_status_created ON public.reviews(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON public.reviews(is_featured, display_order);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Create customer_gallery table
CREATE TABLE IF NOT EXISTS public.customer_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT NOT NULL,
    caption TEXT DEFAULT '',
    customer_name TEXT DEFAULT '',
    is_approved BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customer_gallery ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_customer_gallery_approved ON public.customer_gallery(is_approved, sort_order ASC);

-- Seed initial lookbook gallery items if empty
INSERT INTO public.customer_gallery (image_url, title, caption, is_approved, is_featured, sort_order)
VALUES 
    ('/frame1.jpg', 'Fatima — Red Persian Frame', 'Customized Wall Frame Sample 1', true, true, 1),
    ('/frame2.jpeg', 'Omar — Blue Oriental Frame', 'Customized Wall Frame Sample 2', true, true, 2),
    ('/frame3.jpeg', 'Aisha — Purple Floral Frame', 'Customized Wall Frame Sample 3', true, true, 3),
    ('/frame4.jpg', 'Zayd — Book Stack Rug Frame', 'Customized Wall Frame Sample 4', true, true, 4)
ON CONFLICT DO NOTHING;

-- 4. Create seo_metadata table
CREATE TABLE IF NOT EXISTS public.seo_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    canonical_url TEXT DEFAULT '',
    og_title TEXT DEFAULT '',
    og_description TEXT DEFAULT '',
    og_image TEXT DEFAULT '',
    robots TEXT DEFAULT 'index, follow',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_seo_metadata_path ON public.seo_metadata(page_path);

-- Seed default SEO metadata
INSERT INTO public.seo_metadata (page_path, title, meta_description, canonical_url, og_title, og_description, og_image)
VALUES
(
    '/',
    'NAMORA | Personalized Handcrafted A4 Wall Frames with Arabic & Persian Calligraphy',
    'Order personalized handmade A4 framed calligraphy with Arabic & English names on authentic Persian designs. Rs. 499 with Rs. 49 advance deposit and Rs. 450 Cash on Delivery.',
    'https://namoraworld.com',
    'NAMORA — Handcrafted Personalized Calligraphy Frames',
    'Because some names deserve to be framed. A4 luxury frames hand-finished and delivered across India.',
    'https://namoraworld.com/assets/designs/design1.jpg'
),
(
    '/customize',
    'Customize Your Handcrafted Frame | NAMORA Calligraphy Studio',
    'Design your custom A4 wall frame. Real-time preview with dual English & Arabic calligraphy on authentic Persian rugs and heritage backgrounds.',
    'https://namoraworld.com/customize',
    'Personalize Your Frame — NAMORA Studio',
    'Create your bespoke calligraphy frame in seconds with live preview.',
    'https://namoraworld.com/assets/designs/design1.jpg'
)
ON CONFLICT (page_path) DO NOTHING;

-- 5. Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    badge_text TEXT NOT NULL,
    headline TEXT DEFAULT '',
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    product_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_campaigns_active ON public.campaigns(is_active, created_at DESC);

-- 6. Row Level Security (RLS) Policies

-- 6a. homepage_content Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view active homepage content" ON public.homepage_content;
    CREATE POLICY "Public can view active homepage content"
        ON public.homepage_content
        FOR SELECT
        TO anon, authenticated
        USING (is_active = true);

    DROP POLICY IF EXISTS "Service role full access to homepage_content" ON public.homepage_content;
    CREATE POLICY "Service role full access to homepage_content"
        ON public.homepage_content
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
END $$;

-- 6b. reviews Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
    CREATE POLICY "Public can view approved reviews"
        ON public.reviews
        FOR SELECT
        TO anon, authenticated
        USING (status = 'approved');

    DROP POLICY IF EXISTS "Service role full access to reviews" ON public.reviews;
    CREATE POLICY "Service role full access to reviews"
        ON public.reviews
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
END $$;

-- 6c. customer_gallery Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view approved gallery" ON public.customer_gallery;
    CREATE POLICY "Public can view approved gallery"
        ON public.customer_gallery
        FOR SELECT
        TO anon, authenticated
        USING (is_approved = true);

    DROP POLICY IF EXISTS "Service role full access to customer_gallery" ON public.customer_gallery;
    CREATE POLICY "Service role full access to customer_gallery"
        ON public.customer_gallery
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
END $$;

-- 6d. seo_metadata Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view seo metadata" ON public.seo_metadata;
    CREATE POLICY "Public can view seo metadata"
        ON public.seo_metadata
        FOR SELECT
        TO anon, authenticated
        USING (true);

    DROP POLICY IF EXISTS "Service role full access to seo_metadata" ON public.seo_metadata;
    CREATE POLICY "Service role full access to seo_metadata"
        ON public.seo_metadata
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
END $$;

-- 6e. campaigns Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view active campaigns" ON public.campaigns;
    CREATE POLICY "Public can view active campaigns"
        ON public.campaigns
        FOR SELECT
        TO anon, authenticated
        USING (is_active = true);

    DROP POLICY IF EXISTS "Service role full access to campaigns" ON public.campaigns;
    CREATE POLICY "Service role full access to campaigns"
        ON public.campaigns
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
END $$;
