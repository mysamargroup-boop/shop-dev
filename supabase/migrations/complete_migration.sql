
-- Drop existing tables if they exist
DROP TABLE IF EXISTS "order_items" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "coupons" CASCADE;
DROP TABLE IF EXISTS "site_settings" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "order_status_history" CASCADE;
DROP TABLE IF EXISTS "navigation_links" CASCADE;
DROP TABLE IF EXISTS "site_images" CASCADE;
DROP TABLE IF EXISTS "videos" CASCADE;
DROP TABLE IF EXISTS "subscriptions" CASCADE;
DROP TABLE IF EXISTS "blog_posts" CASCADE;
DROP TABLE IF EXISTS "reviews" CASCADE;

-- Create Categories Table
CREATE TABLE "categories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "image_url" TEXT,
  "image_hint" TEXT,
  "link_url" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Products Table
CREATE TABLE "products" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "short_description" TEXT,
  "regular_price" NUMERIC,
  "sale_price" NUMERIC,
  "price" NUMERIC GENERATED ALWAYS AS (COALESCE(sale_price, regular_price)) STORED,
  "category_id" TEXT REFERENCES categories(id),
  "sub_category" TEXT,
  "inventory" INTEGER DEFAULT 0,
  "image_url" TEXT,
  "image_alt" TEXT,
  "image_hint" TEXT,
  "gallery_images" TEXT[],
  "video_url" TEXT,
  "image_attribution" TEXT,
  "license" TEXT,
  "tags" TEXT[],
  "features" TEXT[],
  "material" TEXT,
  "color" TEXT,
  "badge" TEXT,
  "specific_description" TEXT,
  "rating" NUMERIC(2,1),
  "review_count" INTEGER DEFAULT 0,
  "allow_image_upload" BOOLEAN DEFAULT FALSE,
  "weight_grams" INTEGER,
  "dimensions_length" NUMERIC,
  "dimensions_width" NUMERIC,
  "dimensions_height" NUMERIC,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Orders Table
CREATE TABLE "orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "external_order_id" TEXT UNIQUE,
  "customer_name" TEXT,
  "customer_phone" TEXT,
  "status" TEXT DEFAULT 'PENDING',
  "payment_status" TEXT DEFAULT 'PENDING',
  "total_amount" NUMERIC,
  "shipping_address" TEXT,
  "transaction_id" TEXT,
  "admin_notes" TEXT,
  "return_reason" TEXT,
  "refund_reason" TEXT,
  "refund_amount" NUMERIC,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Order Items Table
CREATE TABLE "order_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID REFERENCES orders(id) ON DELETE CASCADE,
  "product_id" TEXT,
  "product_name" TEXT,
  "sku" TEXT,
  "quantity" INTEGER,
  "unit_price" NUMERIC,
  "total_price" NUMERIC,
  "image_url" TEXT,
  "image_hint" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Coupons Table
CREATE TABLE "coupons" (
  "code" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL, -- 'percent' or 'flat'
  "value" NUMERIC NOT NULL,
  "active" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Site Settings Table
CREATE TABLE "site_settings" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "logo_url" TEXT,
  "contact_email" TEXT,
  "contact_phone" TEXT,
  "contact_address" TEXT,
  "contact_hours" TEXT,
  "maintenance_mode_enabled" BOOLEAN DEFAULT FALSE,
  "maintenance_mode_message" TEXT,
  "social_facebook" TEXT,
  "social_instagram" TEXT,
  "social_youtube" TEXT,
  "social_linkedin" TEXT,
  "social_twitter" TEXT,
  "home_meta_title" TEXT,
  "home_meta_description" TEXT,
  "google_tag_manager_id" TEXT,
  "invoice_business_name" TEXT,
  "invoice_business_address" TEXT,
  "invoice_logo_url" TEXT,
  "invoice_tax_percent" NUMERIC,
  "invoice_currency_symbol" TEXT,
  "invoice_gst_number" TEXT,
  "expected_delivery_min_days" INTEGER,
  "expected_delivery_max_days" INTEGER,
  "free_shipping_threshold" NUMERIC,
  "promo_banner_enabled" BOOLEAN,
  "promo_banner_title" TEXT,
  "promo_banner_subtitle" TEXT,
  "timer_banner_enabled" BOOLEAN,
  "timer_banner_title" TEXT,
  "timer_banner_image_url" TEXT,
  "timer_banner_end_date" TEXT,
  "theme_background" TEXT,
  "theme_muted" TEXT,
  "redirects" TEXT,
  "whatsapp_only_checkout_enabled" BOOLEAN,
  "product_id_prefix" VARCHAR(2),
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT settings_id_check CHECK (id = 1)
);

-- Create Payments Table
CREATE TABLE "payments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID REFERENCES orders(id),
  "provider" TEXT,
  "status" TEXT,
  "amount" NUMERIC,
  "currency" TEXT,
  "session_id" TEXT,
  "provider_order_id" TEXT,
  "transaction_id" TEXT,
  "raw_response" JSONB,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Order Status History Table
CREATE TABLE "order_status_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID REFERENCES orders(id) ON DELETE CASCADE,
  "old_status" TEXT,
  "new_status" TEXT,
  "reason" TEXT,
  "admin_note" TEXT,
  "created_by" TEXT DEFAULT 'system',
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Navigation Links Table
CREATE TABLE "navigation_links" (
  "id" SERIAL PRIMARY KEY,
  "area" TEXT NOT NULL, -- 'header' or 'footer'
  "section" TEXT, -- for footer grouping
  "href" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sort_order" INTEGER,
  "is_mega_menu" BOOLEAN,
  "special" BOOLEAN,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Site Images Table
CREATE TABLE "site_images" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "description" TEXT,
  "image_url" TEXT NOT NULL,
  "image_hint" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Videos Table
CREATE TABLE "videos" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT, -- 'youtube' or 'instagram'
  "url" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Subscriptions Table
CREATE TABLE "subscriptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT,
  "phone" TEXT NOT NULL,
  "source" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Blog Posts Table
CREATE TABLE "blog_posts" (
  "slug" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "published_at" TIMESTAMPTZ,
  "author" TEXT,
  "excerpt" TEXT,
  "image_key" TEXT,
  "image_url" TEXT,
  "image_hint" TEXT,
  "content" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Reviews Table
CREATE TABLE "reviews" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" TEXT REFERENCES products(id) ON DELETE CASCADE,
  "rating" INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  "comment" TEXT NOT NULL,
  "author_name" TEXT NOT NULL,
  "is_verified" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);


-- Create RPC function to get unique tags
CREATE OR REPLACE FUNCTION get_unique_tags()
RETURNS TABLE(tag TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT unnest(tags) as tag FROM products WHERE tags IS NOT NULL ORDER BY tag;
END;
$$ LANGUAGE plpgsql;

-- Set up Row Level Security (RLS) - Basic Example
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read products" ON products FOR SELECT USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read categories" ON categories FOR SELECT USING (true);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read site settings" ON site_settings FOR SELECT USING (true);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published blog posts" ON blog_posts FOR SELECT USING (published_at <= NOW());

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read verified reviews" ON reviews FOR SELECT USING (is_verified = TRUE);
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (true);

ALTER TABLE navigation_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read navigation links" ON navigation_links FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_orders_external_order_id ON orders(external_order_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
