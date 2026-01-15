-- Add performance indexes for frequently queried fields
-- This migration optimizes common queries for better performance

-- Products table indexes for search and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_description_search ON products USING gin(to_tsvector('english', description));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_lower ON products (lower(name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status_active ON products (inventory) WHERE inventory > 0;

-- Orders table indexes for admin and customer queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_phone_status ON orders (customer_phone, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_status ON orders (created_at DESC, status);

-- Order items for product analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_created_at ON order_items (created_at DESC);

-- Coupon redemptions for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupon_redemptions_code ON coupon_redemptions (coupon_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupon_redemptions_created_at ON coupon_redemptions (created_at DESC);

-- Customers for admin queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_created_at ON customers (created_at DESC);

-- Blog posts for content queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_published ON blog_posts (is_published) WHERE is_published = true;

-- Site settings for admin access
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_settings_id ON site_settings (id);

-- Banners for active display
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_banners_active ON banners (is_active, display_order) WHERE is_active = true;

-- Payments for transaction tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_provider_status ON payments (provider, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_created_at ON payments (created_at DESC);
