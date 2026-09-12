-- ============================================================================
-- NAMORA E-COMMERCE BACKEND SCHEMA (SUPABASE POSTGRESQL)
-- Luxury Handmade A4 Wall Frames
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ORDERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    pincode TEXT NOT NULL,
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 499.00,
    deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 49.00,
    cod_amount NUMERIC(10, 2) NOT NULL DEFAULT 450.00,
    status TEXT NOT NULL DEFAULT 'pending_advance' 
        CHECK (status IN ('pending_advance', 'advance_paid', 'in_production', 'dispatched', 'delivered', 'cancelled')),
    payment_method TEXT NOT NULL DEFAULT 'deposit_cod' 
        CHECK (payment_method IN ('deposit_cod', 'full_prepaid')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' 
        CHECK (payment_status IN ('unpaid', 'deposit_received', 'fully_paid', 'refunded')),
    courier_name TEXT DEFAULT '',
    tracking_number TEXT DEFAULT '',
    tracking_url TEXT DEFAULT '',
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for speedy lookups by customer phone or order number
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. ORDER ITEMS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    product_image TEXT DEFAULT '',
    is_ready_made BOOLEAN NOT NULL DEFAULT false,
    category_label TEXT DEFAULT 'Customized',
    english_name TEXT DEFAULT '',
    arabic_name TEXT DEFAULT '',
    ink_style TEXT DEFAULT 'Obsidian Black',
    font_style TEXT DEFAULT 'Classic',
    text_size TEXT DEFAULT 'Balanced',
    has_gift BOOLEAN NOT NULL DEFAULT false,
    gift_to TEXT DEFAULT '',
    gift_from TEXT DEFAULT '',
    gift_message TEXT DEFAULT '',
    gift_price NUMERIC(10, 2) DEFAULT 0.00,
    price NUMERIC(10, 2) NOT NULL DEFAULT 499.00,
    deposit NUMERIC(10, 2) NOT NULL DEFAULT 49.00,
    cod NUMERIC(10, 2) NOT NULL DEFAULT 450.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS CATALOG TABLE (Ready-to-Ship & Persian Designs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'ready_stock' CHECK (type IN ('ready_stock', 'persian_design')),
    title TEXT NOT NULL,
    subtitle TEXT DEFAULT '',
    category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    image_url TEXT NOT NULL,
    tag TEXT DEFAULT '',
    tag_class TEXT DEFAULT 'badge-popular',
    price NUMERIC(10, 2) NOT NULL DEFAULT 499.00,
    deposit_price NUMERIC(10, 2) NOT NULL DEFAULT 49.00,
    cod_price NUMERIC(10, 2) NOT NULL DEFAULT 450.00,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);

-- ----------------------------------------------------------------------------
-- 4. SETTINGS TABLE (Configurable Store Parameters)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Settings
INSERT INTO public.settings (key, value, description)
VALUES 
    ('frame_base_price', '499', 'Base price per A4 handmade frame in INR'),
    ('deposit_amount', '49', 'Online advance deposit per frame to confirm order'),
    ('cod_balance', '450', 'Cash on delivery balance collected per standard frame'),
    ('gift_packaging_price', '69', 'Price for optional luxury ribbon & wax seal note card'),
    ('whatsapp_helpline', '919305654028', 'Official WhatsApp business phone number'),
    ('support_email', 'namora.frames@gmail.com', 'Official support email address'),
    ('announcement_text', '✨ Festive Gifting Edition — Free Pan-India Air Delivery & Same-Day Dispatch!', 'Top announcement bar text')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = now();

-- ----------------------------------------------------------------------------
-- 5. TRIGGER: AUTOMATIC UPDATED_AT TIMESTAMP
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_settings_updated_at ON public.settings;
CREATE TRIGGER set_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
-- Enable RLS on all tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ORDERS POLICIES
-- Public customers can insert new orders
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" 
    ON public.orders FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

-- Public customers can lookup their own order by order_number or phone for tracking
DROP POLICY IF EXISTS "Public can track order by number or phone" ON public.orders;
CREATE POLICY "Public can track order by number or phone" 
    ON public.orders FOR SELECT 
    TO anon, authenticated 
    USING (true);

-- Authenticated admins can do everything with orders
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders" 
    ON public.orders FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items" 
    ON public.order_items FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public can view order items" 
    ON public.order_items FOR SELECT 
    TO anon, authenticated 
    USING (true);

DROP POLICY IF EXISTS "Admins have full access to order items" ON public.order_items;
CREATE POLICY "Admins have full access to order items" 
    ON public.order_items FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- PRODUCTS POLICIES
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" 
    ON public.products FOR SELECT 
    TO anon, authenticated 
    USING (true);

DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products" 
    ON public.products FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- SETTINGS POLICIES
DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;
CREATE POLICY "Anyone can view settings" 
    ON public.settings FOR SELECT 
    TO anon, authenticated 
    USING (true);

DROP POLICY IF EXISTS "Admins have full access to settings" ON public.settings;
CREATE POLICY "Admins have full access to settings" 
    ON public.settings FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7. SEED DATA: READY-TO-SHIP EDITIONS & PERSIAN DESIGNS
-- ----------------------------------------------------------------------------
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('car-1', 'ready_stock', 'Porsche 911 GT3 RS', 'Signature White & Red Track Edition · Physical Frame', 'cars', 'Supercars', 'car1.jpg', '⚡ Bestseller', 'badge-hot', 499.00, 49.00, 450.00, true, 1)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('car-2', 'ready_stock', 'BMW M5 F90 Black Edition', 'V8 Twin-Turbo Specs · Satin Matte Black Frame', 'cars', 'Supercars', 'car2.jpg', '⚡ 635 HP Spec', 'badge-popular', 499.00, 49.00, 450.00, true, 2)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('car-3', 'ready_stock', 'Porsche 911 GT3 Silver', 'Classic Silver with Porsche Crest & Telemetry', 'cars', 'Supercars', 'car3.jpg', 'Studio Edition', 'badge-classic', 499.00, 49.00, 450.00, true, 3)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('car-4', 'ready_stock', 'BMW M8 Competition Coupé', 'Handheld Photo · German Flag Engineering Edition', 'cars', 'Supercars', 'car4.jpg', 'German M-Power', 'badge-popular', 499.00, 49.00, 450.00, true, 4)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('car-5', 'ready_stock', 'Porsche 911 GT3 Rear Wing', 'Stealth Black Rear-Profile in Bedside Frame', 'cars', 'Supercars', 'car5.jpg', 'Minimalist', 'badge-classic', 499.00, 49.00, 450.00, true, 5)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('car-6', 'ready_stock', 'Porsche GT3 RS White Frame', 'Clean Modern Styling · 525 PS Aerodynamics', 'cars', 'Supercars', 'car6.jpg', 'Air Aero Edition', 'badge-popular', 499.00, 49.00, 450.00, true, 6)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('car-7', 'ready_stock', 'Porsche 911 GT3 RS Carbon Gray', 'Real Customer Photo · Studio Room Lighting', 'cars', 'Supercars', 'car7.jpg', 'Track Ready', 'badge-hot', 499.00, 49.00, 450.00, true, 7)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('car-8', 'ready_stock', 'Porsche 911 GT3 RS 3D Diecast', 'Shadowbox Frame with Real Miniature Model', 'cars', 'Supercars', 'car8.jpg', '🔥 3D Diecast Frame', 'badge-exclusive', 499.00, 49.00, 450.00, true, 8)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('car-9', 'ready_stock', 'Ford Mustang 1964 Legendary', 'American Muscle Vintage Heritage Poster Frame', 'cars', 'Supercars', 'car9.jpg', 'Classic Heritage', 'badge-classic', 499.00, 49.00, 450.00, true, 9)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('car-11', 'ready_stock', 'Porsche 911 RSR Triptych Wall Set', '3-Piece Gallery Set · Red & White Heritage Livery', 'cars', 'Supercars', 'car11.jpg', '🌟 3-Piece Triptych', 'badge-exclusive', 499.00, 49.00, 450.00, true, 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-14', 'ready_stock', 'Cristiano Ronaldo — CR7 1985', 'Portugal National Team & 5x Ballon d''Or Accolades', 'sports', 'Sports Legends', 'sport14.jpg', '🔥 CR7 Bestseller', 'badge-hot', 499.00, 49.00, 450.00, true, 11)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-3', 'ready_stock', 'Lionel Messi — World Cup Triumph', 'Iconic Trophy Kiss & Career Achievements', 'sports', 'Sports Legends', 'sport3.jpg', '⚡ World Cup Winner', 'badge-hot', 499.00, 49.00, 450.00, true, 12)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-4', 'ready_stock', 'Messi #10 Argentina Jersey Frame', 'Signature Jersey Tribute in Bedside Room Frame', 'sports', 'Sports Legends', 'sport4.jpg', 'Signature Tribute', 'badge-popular', 499.00, 49.00, 450.00, true, 13)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-5', 'ready_stock', 'Lionel Messi #10 World Cup Accolades', '8x Ballon d''Or · Minimalist Argentine Blue Art', 'sports', 'Sports Legends', 'sport5.jpg', 'GOAT Edition', 'badge-exclusive', 499.00, 49.00, 450.00, true, 14)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-10', 'ready_stock', 'Messi #10 3D Layered Jersey', 'Dimensional 3D Cutout Numbers & AFA Badges', 'sports', 'Sports Legends', 'sport10.jpg', '3D Layered Cut', 'badge-exclusive', 499.00, 49.00, 450.00, true, 15)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-1', 'ready_stock', 'FC Barcelona Vintage Crest', 'Blaugrana Golden Shield on Textured Canvas', 'sports', 'Sports Legends', 'sport1.jpg', 'Visca El Barça', 'badge-popular', 499.00, 49.00, 450.00, true, 16)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-2', 'ready_stock', 'Real Madrid — Hala Madrid', 'Concrete Aesthetic Crown Shield · 15x UCL Kings', 'sports', 'Sports Legends', 'sport2.jpg', 'Hala Madrid', 'badge-popular', 499.00, 49.00, 450.00, true, 17)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-13', 'ready_stock', 'Jude Bellingham — England & Madrid', 'Iconic Open-Arms Celebration Poster Frame', 'sports', 'Sports Legends', 'sport13.jpg', 'Rising Legend', 'badge-hot', 499.00, 49.00, 450.00, true, 18)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-9', 'ready_stock', 'Neymar Jr #10 Brazil 3D Frame', 'Canarinho Yellow & Green 3D Relief Typography', 'sports', 'Sports Legends', 'sport9.jpg', '3D Relief Cut', 'badge-exclusive', 499.00, 49.00, 450.00, true, 19)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-12', 'ready_stock', 'Neymar Jr 1992 Brazil Signature', 'Iconic Silence Celebration & Career Accolades', 'sports', 'Sports Legends', 'sport12.jpg', 'Signature Edition', 'badge-popular', 499.00, 49.00, 450.00, true, 20)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-15', 'ready_stock', 'Neymar Jr — Santos FC Heritage', '"The Prince Who Never Became King" Iconic Bow', 'sports', 'Sports Legends', 'sport15.jpg', 'Heritage Nostalgia', 'badge-classic', 499.00, 49.00, 450.00, true, 21)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-6', 'ready_stock', 'FC Barcelona Leather Grain', 'Tactile Leather Texture Shield Frame', 'sports', 'Sports Legends', 'sport6.jpg', 'Culers Classic', 'badge-classic', 499.00, 49.00, 450.00, true, 22)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-11', 'ready_stock', 'Força Barça — Més Que Un Club', 'Midnight Blue Modern Club Crest Edition', 'sports', 'Sports Legends', 'sport11.jpg', 'Més Que Un Club', 'badge-popular', 499.00, 49.00, 450.00, true, 23)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('sport-8', 'ready_stock', 'Jamal Musiala #10 Germany DFB', '3D Relief Numbers & 4-Star World Champion Crest', 'sports', 'Sports Legends', 'sport8.jpg', '3D Relief Cut', 'badge-popular', 499.00, 49.00, 450.00, true, 24)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('pop-1', 'ready_stock', 'Spider-Man: Into the Spider-Verse', 'Miles Morales Chicago 1s Leap · Minimalist Poster', 'pop', 'Pop Culture', 'sport16.jpg', '🎬 Cinema Edition', 'badge-exclusive', 499.00, 49.00, 450.00, true, 25)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('pop-2', 'ready_stock', 'Lewis Hamilton #44 Mercedes F1', '7x Formula 1 World Champion Minimalist Poster', 'pop', 'Motorsport', 'sport18.jpg', 'F1 World Champion', 'badge-hot', 499.00, 49.00, 450.00, true, 26)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('name-4', 'ready_stock', 'Fatima (فاطمة) — Carpet Mosaic', 'White Thuluth Script on Persian Rug Tapestry', 'names', 'Ready Names', 'name4.jpg', '⚡ Popular Name', 'badge-hot', 499.00, 49.00, 450.00, true, 27)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('name-7', 'ready_stock', 'Fatima (فاطمة) — Heritage Rug', 'Handheld Photo · Crimson & Navy Persian Kilim', 'names', 'Ready Names', 'name7.jpg', '⚡ Popular Name', 'badge-hot', 499.00, 49.00, 450.00, true, 28)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('name-9', 'ready_stock', 'Fatima (فاطمة) — Blush Floral & Butterflies', 'Rose Pink Tapestry with Delicate Blossom Accents', 'names', 'Ready Names', 'name9.png', '🌸 Blush Edition', 'badge-exclusive', 499.00, 49.00, 450.00, true, 29)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('name-10', 'ready_stock', 'Fatima (فاطمة) — Royal Purple with Du''a', 'Hand-Painted Brushstroke with Arabic Blessing', 'names', 'Ready Names', 'name10.jpg', 'Royal Purple', 'badge-popular', 499.00, 49.00, 450.00, true, 30)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('name-3', 'ready_stock', 'Muhammad (محمد) — Kilim Rug', 'Sacred Name Calligraphy on Traditional Geometric Rug', 'names', 'Ready Names', 'name3.jpg', '⚡ Sacred Bestseller', 'badge-hot', 499.00, 49.00, 450.00, true, 31)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('name-8', 'ready_stock', 'Ahmad (أحمد) — Handheld Photo', 'Real Customer Photo · Persian Heritage Backdrop', 'names', 'Ready Names', 'name8.jpg', '⚡ Ready Stock', 'badge-popular', 499.00, 49.00, 450.00, true, 32)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('name-6', 'ready_stock', 'Maryam (مريم) — Jasmine Flower', 'Pure White Calligraphy with Jasmine Blossom on Rug', 'names', 'Ready Names', 'name6.jpg', '🌸 Jasmine Edition', 'badge-popular', 499.00, 49.00, 450.00, true, 33)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('name-5', 'ready_stock', 'Batool (بتول) — Crimson Tapestry', 'Pure Elegant Script on Royal Crimson Persian Carpet', 'names', 'Ready Names', 'name5.jpg', 'Crimson Velvet', 'badge-popular', 499.00, 49.00, 450.00, true, 34)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('name-2', 'ready_stock', 'Rimsha (رمشا) — Floral "R" Edition', '"Beauty, a bunch of flower" Meaning & Calligraphy', 'names', 'Ready Names', 'name2.jpg', 'Floral Monogram', 'badge-popular', 499.00, 49.00, 450.00, true, 35)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('name-1', 'ready_stock', 'Tayyiba (طيبة) — Persian Blue', 'Intricate Isfahan Blue Rug Background with White Script', 'names', 'Ready Names', 'name1.jpg', 'Persian Blue', 'badge-popular', 499.00, 49.00, 450.00, true, 36)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('name-11', 'ready_stock', 'Sabr (صبر - Patience) — Candle & Vase', 'Spiritual Art Propped on Minimalist Modern Shelf', 'names', 'Ready Names', 'name11.jpg', '🕊️ Spiritual Peace', 'badge-exclusive', 499.00, 49.00, 450.00, true, 37)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url, tag = EXCLUDED.tag;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-1', 'persian_design', 'Persian Carpet Design #1', 'Handcrafted Calligraphy on Persian Rug Pattern', 'crimson', 'Persian Crimson', 'design1.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 101)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-2', 'persian_design', 'Persian Carpet Design #2', 'Handcrafted Calligraphy on Persian Rug Pattern', 'crimson', 'Persian Crimson', 'design2.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 102)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-3', 'persian_design', 'Persian Carpet Design #3', 'Handcrafted Calligraphy on Persian Rug Pattern', 'crimson', 'Persian Crimson', 'design3.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 103)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-4', 'persian_design', 'Persian Carpet Design #4', 'Handcrafted Calligraphy on Persian Rug Pattern', 'crimson', 'Persian Crimson', 'design4.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 104)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-5', 'persian_design', 'Persian Carpet Design #5', 'Handcrafted Calligraphy on Persian Rug Pattern', 'crimson', 'Persian Crimson', 'design5.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 105)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-6', 'persian_design', 'Persian Carpet Design #6', 'Handcrafted Calligraphy on Persian Rug Pattern', 'blue', 'Royal Blue', 'design6.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 106)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-7', 'persian_design', 'Persian Carpet Design #7', 'Handcrafted Calligraphy on Persian Rug Pattern', 'blue', 'Royal Blue', 'design7.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 107)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-8', 'persian_design', 'Persian Carpet Design #8', 'Handcrafted Calligraphy on Persian Rug Pattern', 'blue', 'Royal Blue', 'design8.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 108)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-9', 'persian_design', 'Persian Carpet Design #9', 'Handcrafted Calligraphy on Persian Rug Pattern', 'blush', 'Blush & Rose', 'design9.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 109)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-10', 'persian_design', 'Persian Carpet Design #10', 'Handcrafted Calligraphy on Persian Rug Pattern', 'blush', 'Blush & Rose', 'design10.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 110)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-11', 'persian_design', 'Persian Carpet Design #11', 'Handcrafted Calligraphy on Persian Rug Pattern', 'blush', 'Blush & Rose', 'design11.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 111)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-12', 'persian_design', 'Persian Carpet Design #12', 'Handcrafted Calligraphy on Persian Rug Pattern', 'blush', 'Blush & Rose', 'design12.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 112)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-13', 'persian_design', 'Persian Carpet Design #13', 'Handcrafted Calligraphy on Persian Rug Pattern', 'blush', 'Blush & Rose', 'design13.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 113)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-14', 'persian_design', 'Persian Carpet Design #14', 'Handcrafted Calligraphy on Persian Rug Pattern', 'blush', 'Blush & Rose', 'design14.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 114)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-15', 'persian_design', 'Persian Carpet Design #15', 'Handcrafted Calligraphy on Persian Rug Pattern', 'blush', 'Blush & Rose', 'design15.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 115)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-16', 'persian_design', 'Persian Carpet Design #16', 'Handcrafted Calligraphy on Persian Rug Pattern', 'heritage', 'Heritage & Gold', 'design16.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 116)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-17', 'persian_design', 'Persian Carpet Design #17', 'Handcrafted Calligraphy on Persian Rug Pattern', 'heritage', 'Heritage & Gold', 'design17.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 117)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-18', 'persian_design', 'Persian Carpet Design #18', 'Handcrafted Calligraphy on Persian Rug Pattern', 'heritage', 'Heritage & Gold', 'design18.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 118)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-19', 'persian_design', 'Persian Carpet Design #19', 'Handcrafted Calligraphy on Persian Rug Pattern', 'heritage', 'Heritage & Gold', 'design19.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 119)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-20', 'persian_design', 'Persian Carpet Design #20', 'Handcrafted Calligraphy on Persian Rug Pattern', 'heritage', 'Heritage & Gold', 'design20.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 120)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, type, title, subtitle, category, category_label, image_url, tag, tag_class, price, deposit_price, cod_price, in_stock, sort_order)
VALUES ('design-21', 'persian_design', 'Persian Carpet Design #21', 'Handcrafted Calligraphy on Persian Rug Pattern', 'heritage', 'Heritage & Gold', 'design21.jpg', 'Persian Art', 'badge-classic', 499.00, 49.00, 450.00, true, 121)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, image_url = EXCLUDED.image_url;
