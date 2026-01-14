
-- Drop functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS get_unique_tags();

-- Create PRODUCTS table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    regular_price NUMERIC(10, 2) NOT NULL,
    sale_price NUMERIC(10, 2),
    category_id TEXT,
    sub_category TEXT,
    image_url TEXT,
    image_alt TEXT,
    image_hint TEXT,
    gallery_images TEXT[],
    video_url TEXT,
    image_attribution TEXT,
    license TEXT,
    inventory INTEGER DEFAULT 0,
    tags TEXT[],
    features TEXT[],
    allow_image_upload BOOLEAN DEFAULT FALSE,
    weight_grams INTEGER,
    dimensions_length NUMERIC,
    dimensions_width NUMERIC,
    dimensions_height NUMERIC,
    specific_description TEXT,
    material TEXT,
    color TEXT,
    badge TEXT,
    rating NUMERIC(2, 1),
    review_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    price NUMERIC(10, 2) GENERATED ALWAYS AS (COALESCE(sale_price, regular_price)) STORED
);

-- Create CATEGORIES table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    image_hint TEXT,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ORDERS table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_order_id TEXT UNIQUE,
    customer_name TEXT,
    customer_phone TEXT,
    shipping_address TEXT,
    total_amount NUMERIC(10, 2),
    status TEXT DEFAULT 'PENDING',
    payment_status TEXT DEFAULT 'PENDING',
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    return_reason TEXT,
    refund_reason TEXT,
    refund_amount NUMERIC(10,2),
    admin_notes TEXT
);

-- Create ORDER_ITEMS table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT,
    product_name TEXT,
    sku TEXT,
    quantity INTEGER,
    unit_price NUMERIC(10, 2),
    total_price NUMERIC(10, 2),
    image_url TEXT,
    image_hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create PAYMENTS table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    provider TEXT,
    status TEXT,
    amount NUMERIC(10, 2),
    currency TEXT,
    transaction_id TEXT,
    provider_order_id TEXT,
    session_id TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ORDER_STATUS_HISTORY table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    reason TEXT,
    admin_note TEXT,
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create COUPONS table
CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'percent' or 'flat'
    value NUMERIC NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    show_on_offers_page BOOLEAN DEFAULT FALSE
);

-- Create BLOG_POSTS table
CREATE TABLE IF NOT EXISTS blog_posts (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    published_at TIMESTAMPTZ,
    author TEXT,
    excerpt TEXT,
    image_key TEXT,
    image_url TEXT,
    image_hint TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create SITE_IMAGES table
CREATE TABLE IF NOT EXISTS site_images (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    image_url TEXT,
    image_hint TEXT
);

-- Create NAVIGATION_LINKS table
CREATE TABLE IF NOT EXISTS navigation_links (
    id SERIAL PRIMARY KEY,
    area TEXT NOT NULL, -- e.g., 'header', 'footer'
    section TEXT, -- e.g., 'Shop', 'About'
    href TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_mega_menu BOOLEAN DEFAULT FALSE,
    special BOOLEAN DEFAULT FALSE
);

-- Create SUBSCRIPTIONS table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create VIDEOS table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  type TEXT,
  url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create SITE_SETTINGS table
CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    owner_first_name TEXT,
    owner_last_name TEXT,
    logo_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    contact_address TEXT,
    contact_hours TEXT,
    maintenance_mode_enabled BOOLEAN,
    maintenance_mode_message TEXT,
    social_facebook TEXT,
    social_instagram TEXT,
    social_youtube TEXT,
    social_linkedin TEXT,
    social_twitter TEXT,
    home_meta_title TEXT,
    home_meta_description TEXT,
    google_verification_code TEXT,
    google_tag_manager_id TEXT,
    invoice_business_name TEXT,
    invoice_business_address TEXT,
    invoice_logo_url TEXT,
    invoice_tax_percent NUMERIC,
    invoice_currency_symbol TEXT,
    invoice_gst_number TEXT,
    expected_delivery_min_days INTEGER,
    expected_delivery_max_days INTEGER,
    free_shipping_threshold NUMERIC,
    promo_banner_enabled BOOLEAN,
    promo_banner_title TEXT,
    promo_banner_subtitle TEXT,
    timer_banner_enabled BOOLEAN,
    timer_banner_title TEXT,
    timer_banner_image_url TEXT,
    timer_banner_end_date TEXT,
    theme_background TEXT,
    theme_muted TEXT,
    redirects TEXT,
    whatsapp_only_checkout_enabled BOOLEAN,
    product_id_prefix TEXT,
    CONSTRAINT single_row_constraint CHECK (id = 1)
);

-- Create CUSTOMERS table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create REVIEWS table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    customer_name TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RPC to get unique tags
CREATE OR REPLACE FUNCTION get_unique_tags()
RETURNS TABLE(tag TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT unnest(tags) AS tag FROM products ORDER BY tag;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
DROP POLICY IF EXISTS "Public read access" ON products;
CREATE POLICY "Public read access" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON categories;
CREATE POLICY "Public read access" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON blog_posts;
CREATE POLICY "Public read access" ON blog_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON site_images;
CREATE POLICY "Public read access" ON site_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON navigation_links;
CREATE POLICY "Public read access" ON navigation_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON videos;
CREATE POLICY "Public read access" ON videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON site_settings;
CREATE POLICY "Public read access" ON site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access on reviews" ON reviews;
CREATE POLICY "Public read access on reviews" ON reviews FOR SELECT USING (is_approved = true);

-- Policies for anon write access
DROP POLICY IF EXISTS "Allow anon insert for subscriptions" ON subscriptions;
CREATE POLICY "Allow anon insert for subscriptions" ON subscriptions FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert for reviews" ON reviews;
CREATE POLICY "Allow anon insert for reviews" ON reviews FOR INSERT TO anon WITH CHECK (true);

-- Policies for admin access (using service_role)
-- Admin can perform all operations
DROP POLICY IF EXISTS "Admin all access" ON products;
CREATE POLICY "Admin all access" ON products FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON categories;
CREATE POLICY "Admin all access" ON categories FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON orders;
CREATE POLICY "Admin all access" ON orders FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON order_items;
CREATE POLICY "Admin all access" ON order_items FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON payments;
CREATE POLICY "Admin all access" ON payments FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON order_status_history;
CREATE POLICY "Admin all access" ON order_status_history FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON coupons;
CREATE POLICY "Admin all access" ON coupons FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON blog_posts;
CREATE POLICY "Admin all access" ON blog_posts FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON site_images;
CREATE POLICY "Admin all access" ON site_images FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON navigation_links;
CREATE POLICY "Admin all access" ON navigation_links FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON subscriptions;
CREATE POLICY "Admin all access" ON subscriptions FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON videos;
CREATE POLICY "Admin all access" ON videos FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON site_settings;
CREATE POLICY "Admin all access" ON site_settings FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON customers;
CREATE POLICY "Admin all access" ON customers FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin all access" ON reviews;
CREATE POLICY "Admin all access" ON reviews FOR ALL USING (true);
