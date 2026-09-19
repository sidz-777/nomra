-- ============================================================================
-- NAMORA PHASE 1: ADMIN CMS + MEDIA + DESIGN MANAGER SCHEMA
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. COLLECTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('persian', 'ready_stock', 'custom')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON public.collections(is_active);

-- ----------------------------------------------------------------------------
-- 2. DESIGNS TABLE (Persian & Oriental Frame Designs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.designs (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'crimson' CHECK (category IN ('crimson', 'blue', 'pastel', 'amber', 'vintage', 'custom')),
    category_label TEXT NOT NULL DEFAULT 'Persian Crimson',
    image_url TEXT NOT NULL,
    preview_image_url TEXT DEFAULT '',
    description TEXT DEFAULT '',
    overlay_config JSONB NOT NULL DEFAULT '{
      "posX": 50,
      "posY": 46,
      "maxWidth": 68,
      "fontSizeEn": 28,
      "fontSizeAr": 34,
      "fontEn": "''Cinzel'', serif",
      "fontAr": "''Amiri'', serif",
      "textColor": "#3b0a16",
      "textShadow": "0 1px 2px rgba(255,255,255,0.6)"
    }'::jsonb,
    collection_id TEXT REFERENCES public.collections(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_designs_category ON public.designs(category);
CREATE INDEX IF NOT EXISTS idx_designs_is_active ON public.designs(is_active);
CREATE INDEX IF NOT EXISTS idx_designs_sort_order ON public.designs(sort_order);

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS EXTENSION COLUMNS
-- ----------------------------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS collection_id TEXT REFERENCES public.collections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- ----------------------------------------------------------------------------
-- 4. MEDIA ASSETS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    storage_path TEXT UNIQUE NOT NULL,
    public_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    folder TEXT NOT NULL DEFAULT 'general',
    alt_text TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_folder ON public.media(folder);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON public.media(created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. ADMIN AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.admin_audit_logs(entity_type, entity_id);

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active collections" ON public.collections;
DROP POLICY IF EXISTS "Service role full access collections" ON public.collections;
DROP POLICY IF EXISTS "Public can view active designs" ON public.designs;
DROP POLICY IF EXISTS "Service role full access designs" ON public.designs;
DROP POLICY IF EXISTS "Public can view media" ON public.media;
DROP POLICY IF EXISTS "Service role full access media" ON public.media;
DROP POLICY IF EXISTS "Service role full access audit logs" ON public.admin_audit_logs;

-- Collections policies
CREATE POLICY "Public can view active collections" ON public.collections
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access collections" ON public.collections
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Designs policies
CREATE POLICY "Public can view active designs" ON public.designs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access designs" ON public.designs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Media policies
CREATE POLICY "Public can view media" ON public.media
    FOR SELECT USING (true);

CREATE POLICY "Service role full access media" ON public.media
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Audit logs policies (strictly service_role)
CREATE POLICY "Service role full access audit logs" ON public.admin_audit_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 7. UPDATED_AT TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_collections_updated_at ON public.collections;
CREATE TRIGGER set_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_designs_updated_at ON public.designs;
CREATE TRIGGER set_designs_updated_at
    BEFORE UPDATE ON public.designs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 8. CANONICAL SEED DATA
-- ----------------------------------------------------------------------------
-- Canonical Collections
INSERT INTO public.collections (id, slug, title, description, image_url, type, is_active, sort_order)
VALUES
    ('col_persian', 'persian-heritage', 'Persian & Oriental Heritage', 'Master-calligraphy A4 wall frames on authentic Persian carpet backgrounds.', '/assets/designs/design1.jpg', 'persian', true, 1),
    ('col_ready_stock', 'ready-to-ship', 'Ready-to-Ship Editions', 'Curated supercar, sports, names, and pop art frames dispatched in 24 hours.', '/assets/products/car-1.jpg', 'ready_stock', true, 2)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url;

-- Canonical 21 Persian Designs
INSERT INTO public.designs (id, slug, title, category, category_label, image_url, preview_image_url, overlay_config, collection_id, is_active, sort_order)
VALUES
('persian_red', 'persian-red', 'Red Persian Carpet Frame', 'crimson', 'Crimson & Ruby', '/assets/designs/design1.jpg', '/assets/designs/design1.jpg', '{"posX": 50, "posY": 46, "maxWidth": 68, "fontSizeEn": 28, "fontSizeAr": 34, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#3b0a16", "textShadow": "0 1px 2px rgba(255,255,255,0.6)"}', 'col_persian', true, 1),
('blue_floral', 'blue-floral', 'Blue Oriental & Floral Frame', 'blue', 'Royal Blue & Indigo', '/assets/designs/design2.jpg', '/assets/designs/design2.jpg', '{"posX": 50, "posY": 38, "maxWidth": 62, "fontSizeEn": 26, "fontSizeAr": 32, "fontEn": "''Playfair Display'', serif", "fontAr": "''Reem Kufi'', sans-serif", "textColor": "#0f2744", "textShadow": "0 1px 3px rgba(255,255,255,0.8)"}', 'col_persian', true, 2),
('purple_butterfly', 'purple-butterfly', 'Purple Floral Butterfly Frame', 'pastel', 'Pastel & Garden', '/assets/designs/design3.jpg', '/assets/designs/design3.jpg', '{"posX": 50, "posY": 48, "maxWidth": 70, "fontSizeEn": 27, "fontSizeAr": 35, "fontEn": "''Playfair Display'', serif", "fontAr": "''Amiri'', serif", "textColor": "#ffffff", "textShadow": "0 2px 8px rgba(30,10,40,0.85)"}', 'col_persian', true, 3),
('purple_pattern', 'purple-pattern', 'Purple Tile Collage Frame', 'pastel', 'Pastel & Garden', '/assets/designs/design4.jpg', '/assets/designs/design4.jpg', '{"posX": 50, "posY": 47, "maxWidth": 65, "fontSizeEn": 25, "fontSizeAr": 32, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#ffffff", "textShadow": "0 2px 6px rgba(0,0,0,0.7)"}', 'col_persian', true, 4),
('blue_carpet_books', 'blue-carpet-books', 'Blue Rug & Book Stack Frame', 'blue', 'Royal Blue & Indigo', '/assets/designs/design5.jpg', '/assets/designs/design5.jpg', '{"posX": 50, "posY": 42, "maxWidth": 60, "fontSizeEn": 25, "fontSizeAr": 33, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#1a3050", "textShadow": "0 1px 3px rgba(255,255,255,0.9)"}', 'col_persian', true, 5),
('antique_books_flower', 'antique-books-flower', 'Vintage Botanical Study Frame', 'vintage', 'Vintage & Classical', '/assets/designs/design6.jpg', '/assets/designs/design6.jpg', '{"posX": 50, "posY": 44, "maxWidth": 64, "fontSizeEn": 26, "fontSizeAr": 34, "fontEn": "''Playfair Display'', serif", "fontAr": "''Amiri'', serif", "textColor": "#2e1c0c", "textShadow": "0 1px 2px rgba(255,255,255,0.7)"}', 'col_persian', true, 6),
('dark_oriental_carpet', 'dark-oriental-carpet', 'Heritage Crimson Medallion Frame', 'crimson', 'Crimson & Ruby', '/assets/designs/design7.jpg', '/assets/designs/design7.jpg', '{"posX": 50, "posY": 45, "maxWidth": 66, "fontSizeEn": 28, "fontSizeAr": 36, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#ffffff", "textShadow": "0 2px 8px rgba(0,0,0,0.9)"}', 'col_persian', true, 7),
('blue_tile_carpet', 'blue-tile-carpet', 'Cobalt Persian Court Frame', 'blue', 'Royal Blue & Indigo', '/assets/designs/design8.jpg', '/assets/designs/design8.jpg', '{"posX": 50, "posY": 46, "maxWidth": 66, "fontSizeEn": 27, "fontSizeAr": 35, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#ffffff", "textShadow": "0 2px 6px rgba(0,0,0,0.85)"}', 'col_persian', true, 8),
('pink_floral_butterfly', 'pink-floral-butterfly', 'Rose Petal & Gold Leaf Frame', 'pastel', 'Pastel & Garden', '/assets/designs/design9.jpg', '/assets/designs/design9.jpg', '{"posX": 50, "posY": 46, "maxWidth": 68, "fontSizeEn": 27, "fontSizeAr": 34, "fontEn": "''Playfair Display'', serif", "fontAr": "''Amiri'', serif", "textColor": "#ffffff", "textShadow": "0 2px 6px rgba(40,10,20,0.85)"}', 'col_persian', true, 9),
('blue_floral_vase', 'blue-floral-vase', 'Azure Damask Heritage Frame', 'blue', 'Royal Blue & Indigo', '/assets/designs/design10.jpg', '/assets/designs/design10.jpg', '{"posX": 50, "posY": 40, "maxWidth": 60, "fontSizeEn": 26, "fontSizeAr": 33, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#102844", "textShadow": "0 1px 3px rgba(255,255,255,0.85)"}', 'col_persian', true, 10),
('teal_floral_arch', 'teal-floral-arch', 'Teal Silk Mihrab Frame', 'blue', 'Royal Blue & Indigo', '/assets/designs/design11.jpg', '/assets/designs/design11.jpg', '{"posX": 50, "posY": 42, "maxWidth": 62, "fontSizeEn": 26, "fontSizeAr": 33, "fontEn": "''Cinzel'', serif", "fontAr": "''Reem Kufi'', sans-serif", "textColor": "#0c2828", "textShadow": "0 1px 3px rgba(255,255,255,0.8)"}', 'col_persian', true, 11),
('orange_floral_bird', 'orange-floral-bird', 'Amber Orchard Blossom Frame', 'amber', 'Amber & Heritage', '/assets/designs/design12.jpg', '/assets/designs/design12.jpg', '{"posX": 50, "posY": 44, "maxWidth": 64, "fontSizeEn": 27, "fontSizeAr": 34, "fontEn": "''Playfair Display'', serif", "fontAr": "''Amiri'', serif", "textColor": "#3a1804", "textShadow": "0 1px 2px rgba(255,255,255,0.7)"}', 'col_persian', true, 12),
('persian_gold_medallion', 'persian-gold-medallion', 'Antique Gold Medallion Frame', 'amber', 'Amber & Heritage', '/assets/designs/design13.jpg', '/assets/designs/design13.jpg', '{"posX": 50, "posY": 47, "maxWidth": 65, "fontSizeEn": 28, "fontSizeAr": 35, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#2a1a06", "textShadow": "0 1px 3px rgba(255,255,255,0.8)"}', 'col_persian', true, 13),
('persian_emerald_palace', 'persian-emerald-palace', 'Emerald Palace Brocade Frame', 'blue', 'Royal Blue & Indigo', '/assets/designs/design14.jpg', '/assets/designs/design14.jpg', '{"posX": 50, "posY": 45, "maxWidth": 66, "fontSizeEn": 27, "fontSizeAr": 34, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#0a2a18", "textShadow": "0 1px 3px rgba(255,255,255,0.85)"}', 'col_persian', true, 14),
('persian_maroon_crest', 'persian-maroon-crest', 'Maroon Imperial Crest Frame', 'crimson', 'Crimson & Ruby', '/assets/designs/design15.jpg', '/assets/designs/design15.jpg', '{"posX": 50, "posY": 46, "maxWidth": 66, "fontSizeEn": 28, "fontSizeAr": 35, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#ffffff", "textShadow": "0 2px 7px rgba(0,0,0,0.85)"}', 'col_persian', true, 15),
('persian_sapphire_crest', 'persian-sapphire-crest', 'Sapphire Royal Crest Frame', 'blue', 'Royal Blue & Indigo', '/assets/designs/design16.jpg', '/assets/designs/design16.jpg', '{"posX": 50, "posY": 46, "maxWidth": 66, "fontSizeEn": 28, "fontSizeAr": 35, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#ffffff", "textShadow": "0 2px 7px rgba(0,0,0,0.85)"}', 'col_persian', true, 16),
('persian_midnight_mosaic', 'persian-midnight-mosaic', 'Midnight Onyx Mosaic Frame', 'vintage', 'Vintage & Classical', '/assets/designs/design17.jpg', '/assets/designs/design17.jpg', '{"posX": 50, "posY": 47, "maxWidth": 66, "fontSizeEn": 28, "fontSizeAr": 36, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#ffffff", "textShadow": "0 2px 8px rgba(0,0,0,0.9)"}', 'col_persian', true, 17),
('persian_burgundy_velvet', 'persian-burgundy-velvet', 'Burgundy Velvet Damask Frame', 'crimson', 'Crimson & Ruby', '/assets/designs/design18.jpg', '/assets/designs/design18.jpg', '{"posX": 50, "posY": 45, "maxWidth": 65, "fontSizeEn": 27, "fontSizeAr": 34, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#ffffff", "textShadow": "0 2px 6px rgba(0,0,0,0.8)"}', 'col_persian', true, 18),
('persian_turquoise_silk', 'persian-turquoise-silk', 'Turquoise Silk Arabesque Frame', 'blue', 'Royal Blue & Indigo', '/assets/designs/design19.jpg', '/assets/designs/design19.jpg', '{"posX": 50, "posY": 45, "maxWidth": 65, "fontSizeEn": 27, "fontSizeAr": 34, "fontEn": "''Cinzel'', serif", "fontAr": "''Reem Kufi'', sans-serif", "textColor": "#0e2c34", "textShadow": "0 1px 3px rgba(255,255,255,0.8)"}', 'col_persian', true, 19),
('persian_ivory_bloom', 'persian-ivory-bloom', 'Ivory Bloom Filigree Frame', 'pastel', 'Pastel & Garden', '/assets/designs/design20.jpg', '/assets/designs/design20.jpg', '{"posX": 50, "posY": 46, "maxWidth": 66, "fontSizeEn": 27, "fontSizeAr": 34, "fontEn": "''Playfair Display'', serif", "fontAr": "''Amiri'', serif", "textColor": "#241a10", "textShadow": "0 1px 3px rgba(255,255,255,0.9)"}', 'col_persian', true, 20),
('persian_scarlet_crown', 'persian-scarlet-crown', 'Scarlet Royal Crown Frame', 'crimson', 'Crimson & Ruby', '/assets/designs/design21.jpg', '/assets/designs/design21.jpg', '{"posX": 50, "posY": 46, "maxWidth": 66, "fontSizeEn": 28, "fontSizeAr": 35, "fontEn": "''Cinzel'', serif", "fontAr": "''Amiri'', serif", "textColor": "#ffffff", "textShadow": "0 2px 7px rgba(0,0,0,0.85)"}', 'col_persian', true, 21)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    category_label = EXCLUDED.category_label,
    image_url = EXCLUDED.image_url,
    overlay_config = EXCLUDED.overlay_config;
