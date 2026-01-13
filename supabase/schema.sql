create extension if not exists "uuid-ossp";

-- Customers
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categories
create table if not exists categories (
  id text primary key,
  name text not null,
  description text,
  image_url text,
  image_hint text,
  link_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products
create table if not exists products (
  id text primary key,
  name text not null,
  short_description text,
  description text,
  regular_price numeric(12,2) not null,
  sale_price numeric(12,2),
  category_id text not null references categories(id) on delete restrict,
  image_url text,
  image_alt text,
  image_hint text,
  tags text[],
  inventory integer default 0,
  rating numeric(4,2),
  review_count integer default 0,
  gallery_images text[],
  allow_image_upload boolean default false,
  video_url text,
  image_attribution text,
  license text,
  sub_category text,
  material text,
  color text,
  badge text,
  specific_description text,
  features text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_tags on products using gin(tags);
create index if not exists idx_products_rating on products(rating desc);
create index if not exists idx_products_regular_price on products(regular_price);
create index if not exists idx_products_sale_price on products(sale_price);
create index if not exists idx_products_inventory on products(inventory);

-- Product Options
create table if not exists product_options (
  id uuid primary key default uuid_generate_v4(),
  product_id text not null references products(id) on delete cascade,
  label text not null,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, label, value)
);

-- Coupons
do $$
begin
  if not exists (select 1 from pg_type where typname = 'coupon_type') then
    create type coupon_type as enum ('percent', 'flat');
  end if;
end $$;

create table if not exists coupons (
  code text primary key,
  type coupon_type not null,
  value numeric(12,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  external_order_id text,
  transaction_id text,
  customer_id uuid references customers(id) on delete set null,
  customer_name text,
  customer_phone text,
  customer_address text,
  status text check (status in ('PENDING', 'PAID', 'CANCELLED', 'RETURNED', 'REFUNDED')),
  subtotal_amount numeric(12,2) default 0,
  shipping_cost numeric(12,2) default 0,
  total_amount numeric(12,2) default 0,
  advance_amount numeric(12,2) default 0,
  refund_amount numeric(12,2) default 0,
  extra_note text,
  payment_status text,
  return_reason text,
  refund_reason text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_external on orders(external_order_id);
create index if not exists idx_orders_customer on orders(customer_phone);
create index if not exists idx_orders_created on orders(created_at desc);

-- Customer Uploads Storage
create table if not exists customer_uploads (
  id uuid primary key default uuid_generate_v4(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size bigint,
  mime_type text,
  google_drive_url text,
  upload_status text default 'pending' check (upload_status in ('pending', 'uploading', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_uploads_order_item on customer_uploads(order_item_id);
create index if not exists idx_customer_uploads_status on customer_uploads(upload_status);

-- RLS for Customer Uploads
alter table customer_uploads enable row level security;
create policy "Admin can manage customer_uploads" on customer_uploads for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Users can insert their uploads" on customer_uploads for insert with check (true);
create policy "Users can view their uploads" on customer_uploads for select using (true);

-- Order Items
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text references products(id) on delete set null,
  product_name text not null,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  image_url text,
  image_hint text,
  customer_uploaded_images jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id, product_id, sku)
);

-- Banners
create table if not exists banners (
  id uuid primary key default uuid_generate_v4(),
  type text not null, -- 'timer', 'slider', 'promo'
  title text,
  image_url text,
  link_url text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean default true,
  display_order integer default 0,
  meta jsonb, -- for 'effect', etc.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payments
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,
  status text not null,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  session_id text,
  provider_order_id text,
  transaction_id text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_order on payments(order_id);
create index if not exists idx_payments_status on payments(status);
create index if not exists idx_payments_provider on payments(provider);
create index if not exists idx_payments_transaction_id on payments(transaction_id);
create index if not exists idx_payments_created on payments(created_at desc);

-- Coupon Redemptions
create table if not exists coupon_redemptions (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  coupon_code text not null references coupons(code) on delete restrict,
  discount_amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);

-- Site Settings
create table if not exists site_settings (
  id boolean primary key default true,
  logo_url text,
  contact_email text,
  contact_phone text,
  contact_address text,
  contact_hours text,
  maintenance_mode_enabled boolean default false,
  maintenance_mode_message text,
  social_facebook text,
  social_instagram text,
  social_youtube text,
  social_linkedin text,
  social_twitter text,
  home_meta_title text,
  home_meta_description text,
  google_verification_code text,
  google_tag_manager_id text,
  invoice_business_name text,
  invoice_business_address text,
  invoice_gst_number text,
  invoice_phone text,
  invoice_email text,
  invoice_terms text,
  invoice_logo_url text,
  invoice_tax_percent numeric(5,2),
  invoice_currency_symbol text,
  expected_delivery_min_days integer default 7,
  expected_delivery_max_days integer default 15,
  free_shipping_threshold numeric(12,2),
  promo_banner_enabled boolean default false,
  promo_banner_title text,
  promo_banner_subtitle text,
  timer_banner_enabled boolean default false,
  timer_banner_title text,
  timer_banner_end_date timestamptz,
  banner_effect text,
  timer_banner_image_url text,
  theme_background text,
  theme_muted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id)
);

-- Site Images
create table if not exists site_images (
  id text primary key,
  name text,
  image_url text not null,
  image_hint text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Blog Posts
create table if not exists blog_posts (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  author text,
  content text,
  image_url text,
  image_key text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Marketing Campaigns
create table if not exists marketing_campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  template_name text,
  variable_names text[],
  variables jsonb,
  recipients text[],
  status text,
  created_by text,
  created_at timestamptz not null default now()
);

-- WhatsApp Messages
create table if not exists whatsapp_messages (
  id uuid primary key default uuid_generate_v4(),
  to_number text not null,
  template_name text,
  language_code text,
  header_parameters jsonb,
  body_parameters jsonb,
  status text,
  error text,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

-- Tags
create table if not exists tags (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subscriptions
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Videos
create table if not exists videos (
  id text primary key,
  type text not null check (type in ('instagram', 'youtube')),
  url text not null,
  thumbnail_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order Status History (for audit trail)
create table if not exists order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  reason text,
  admin_note text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_status_history_order on order_status_history(order_id);
create index if not exists idx_order_status_history_created on order_status_history(created_at desc);

-- Lead Analytics
create table if not exists lead_analytics (
  id uuid primary key default uuid_generate_v4(),
  session_id text,
  ip_address inet,
  user_agent text,
  city text,
  country text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  page_url text,
  event_type text not null check (event_type in ('page_view', 'click', 'impression', 'form_submit')),
  element_selector text,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Additional indexes
create index if not exists idx_banners_type on banners(type);
create index if not exists idx_banners_active on banners(is_active);
create index if not exists idx_banners_dates on banners(start_date, end_date);
create index if not exists idx_blog_posts_slug on blog_posts(slug);
create index if not exists idx_blog_posts_published on blog_posts(published_at desc);
create index if not exists idx_subscriptions_phone on subscriptions(phone);
create index if not exists idx_whatsapp_status on whatsapp_messages(status);
create index if not exists idx_whatsapp_to on whatsapp_messages(to_number);
create index if not exists idx_lead_analytics_session on lead_analytics(session_id);
create index if not exists idx_lead_analytics_event on lead_analytics(event_type);
create index if not exists idx_lead_analytics_timestamp on lead_analytics(timestamp desc);

-- Triggers for updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_customers before update on customers for each row execute procedure set_updated_at();
create trigger set_updated_at_categories before update on categories for each row execute procedure set_updated_at();
create trigger set_updated_at_products before update on products for each row execute procedure set_updated_at();
create trigger set_updated_at_coupons before update on coupons for each row execute procedure set_updated_at();
create trigger set_updated_at_videos before update on videos for each row execute procedure set_updated_at();
create trigger set_updated_at_order_status_history before update on order_status_history for each row execute procedure set_updated_at();
create trigger set_updated_at_lead_analytics before update on lead_analytics for each row execute procedure set_updated_at();
create trigger set_updated_at_payments before update on payments for each row execute procedure set_updated_at();

create trigger set_updated_at_blog_posts before update on blog_posts for each row execute procedure set_updated_at();
create trigger set_updated_at_product_options before update on product_options for each row execute procedure set_updated_at();
create trigger set_updated_at_order_items before update on order_items for each row execute procedure set_updated_at();
create trigger set_updated_at_site_images before update on site_images for each row execute procedure set_updated_at();
create trigger set_updated_at_tags before update on tags for each row execute procedure set_updated_at();
create trigger set_updated_at_subscriptions before update on subscriptions for each row execute procedure set_updated_at();
create trigger set_updated_at_marketing_campaigns before update on marketing_campaigns for each row execute procedure set_updated_at();
create trigger set_updated_at_whatsapp_messages before update on whatsapp_messages for each row execute procedure set_updated_at();

-- Enable RLS
alter table customers enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_options enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table banners enable row level security;
alter table payments enable row level security;
alter table coupon_redemptions enable row level security;

alter table site_images enable row level security;
alter table blog_posts enable row level security;
alter table marketing_campaigns enable row level security;
alter table whatsapp_messages enable row level security;

alter table subscriptions enable row level security;alter table videos enable row level security;
alter table order_status_history enable row level security;
alter table lead_analytics enable row level security;

-- Customers - Restricted access (no public read)
create policy "Service role manage customers" on customers for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Categories - Public read for storefront
create policy "Public read categories" on categories for select using (true);
create policy "Service role manage categories" on categories for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Products - Public read for storefront
create policy "Public read products" on products for select using (true);
create policy "Service role manage products" on products for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Product Options - Public read for storefront
create policy "Public read product_options" on product_options for select using (true);
create policy "Service role manage product_options" on product_options for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Coupons - Public read for active coupons only
create policy "Public read active coupons" on coupons for select using (active = true);
create policy "Service role manage coupons" on coupons for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Orders - Restricted access (no public read)
create policy "Service role manage orders" on orders for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Order Items - Restricted access (no public read)
create policy "Service role manage order_items" on order_items for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Banners - Public read for active banners only
create policy "Public read active banners" on banners for select using (is_active = true and (start_date is null or start_date <= now()) and (end_date is null or end_date >= now()));
create policy "Service role manage banners" on banners for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Payments - Restricted access (no public read)
create policy "Service role manage payments" on payments for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Coupon Redemptions - Restricted access (no public read)
create policy "Service role manage coupon_redemptions" on coupon_redemptions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Site Settings - Restricted access (no public read)
create policy "Service role manage site_settings" on site_settings for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Site Images - Public read for storefront
create policy "Public read site_images" on site_images for select using (true);
create policy "Service role manage site_images" on site_images for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Blog Posts - Public read for published posts only
create policy "Public read published blog_posts" on blog_posts for select using (published_at is not null and published_at <= now());
create policy "Service role manage blog_posts" on blog_posts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Marketing Campaigns - Restricted access (no public read)
create policy "Service role manage marketing_campaigns" on marketing_campaigns for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- WhatsApp Messages - Restricted access (no public read)
create policy "Service role manage whatsapp_messages" on whatsapp_messages for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Tags - Public read for storefront
create policy "Public read tags" on tags for select using (true);
create policy "Service role manage tags" on tags for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Subscriptions - Restricted access (no public read)
create policy "Service role manage subscriptions" on subscriptions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Videos - Public read for storefront
create policy "Public read videos" on videos for select using (true);
create policy "Service role manage videos" on videos for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Order Status History - Restricted access (no public read)
create policy "Service role manage order_status_history" on order_status_history for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Lead Analytics - Restricted access (no public read)
create policy "Service role manage lead_analytics" on lead_analytics for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create index if not exists idx_orders_transaction_id on orders(transaction_id);
create index if not exists idx_orders_refund_amount on orders(refund_amount) where refund_amount > 0;

create or replace function update_order_status(
    order_uuid uuid,
    new_status text,
    reason text default null,
    admin_note text default null
)
returns boolean as $$
declare
    current_status text;
begin
    select status into current_status from orders where id = order_uuid;
    if current_status is null then
        raise exception 'Order not found';
    end if;
    if new_status not in ('PENDING', 'PAID', 'CANCELLED', 'RETURNED', 'REFUNDED') then
        raise exception 'Invalid status: %', new_status;
    end if;
    update orders set 
        status = new_status,
        return_reason = case when new_status = 'RETURNED' then reason else return_reason end,
        refund_reason = case when new_status = 'REFUNDED' then reason else refund_reason end,
        admin_notes = coalesce(admin_note, admin_notes),
        updated_at = now()
    where id = order_uuid;
    return true;
end;
$$ language plpgsql security definer;

insert into videos (id, type, url, thumbnail_url) values
('video1','youtube','https://www.youtube.com/watch?v=dQw4w9WgXcQ','https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg')
on conflict (id) do nothing;

insert into videos (id, type, url, thumbnail_url) values
('video2','instagram','https://www.instagram.com/p/Cx1234567/','https://picsum.photos/seed/insta/400/600')
on conflict (id) do nothing;

