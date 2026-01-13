

declare global {
  interface Window {
    Cashfree?: any;
    dataLayer: any[];
  }
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  regularPrice?: number;
  imageUrl: string;
  imageAlt?: string;
  imageHint?: string;
  galleryImages?: string[];
  videoUrl?: string;
  imageAttribution?: string;
  license?: string;
  category: string;
  subCategory?: string;
  tags?: string[];
  material?: string;
  color?: string;
  badge?: 'Best Seller' | 'New' | 'Limited' | string;
  rating?: number;
  reviewCount?: number;
  shortDescription?: string;
  specificDescription?: string;
  options?: { label: string; value: string }[];
  features: string[];
  inventory: number;
  allowImageUpload?: boolean;
  weightGrams?: number;
  dimensionsCm?: { length: number; width: number; height: number };
  /** legacy */
  weight?: string;
  dimensions?: string;
}

export interface Category {
  id: string;
  name:string;
  imageUrl: string;
  imageHint: string;
  linkUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  imageUrl: string;
  imageHint: string;
  author: string;
  content: string;
  imageKey: string;
}

export interface ProductsData {
    products: Product[];
}

export interface SiteImage {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  name?: string;
}

export interface Video {
    id: string;
    type: 'instagram' | 'youtube';
    url: string;
    thumbnailUrl: string;
}

export interface SiteImageData {
    placeholderImages: SiteImage[];
    videos: Video[];
}

export interface CategoriesData {
    categories: Category[];
}

export interface SiteSettings {
  social_facebook?: string;
  social_instagram?: string;
  social_youtube?: string;
  social_linkedin?: string;
  social_twitter?: string;
  upload_provider?: 'supabase' | 'r2';
  logo_url?: string;
  home_meta_title?: string;
  home_meta_description?: string;
  google_verification_code?: string;
  google_tag_manager_id?: string;
  invoice_business_name?: string;
  invoice_business_address?: string;
  invoice_logo_url?: string;
  invoice_tax_percent?: number;
  invoice_currency_symbol?: string;
  invoice_gst_number?: string;
  expected_delivery_min_days?: number;
  expected_delivery_max_days?: number;
  free_shipping_threshold?: number;
  whatsapp_only_checkout_enabled?: boolean;
  whatsapp_business_number?: string;
  whatsapp_message_template?: string;
  promo_banner_enabled?: boolean;
  promo_banner_title?: string;
  promo_banner_subtitle?: string;
  timer_banner_enabled?: boolean;
  timer_banner_title?: string;
  timer_banner_image_url?: string;
  timer_banner_end_date?: string;
  theme_background?: string;
  theme_muted?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  contact_hours?: string;
  redirects?: string;
  maintenance_mode_enabled?: boolean;
  maintenance_mode_message?: string;
  shiprocket_enabled?: boolean;
  shiprocket_api_email?: string;
  shiprocket_api_password?: string;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  active: boolean;
}

export interface CouponsData {
  coupons: Coupon[];
}

export interface Subscription {
  id: string;
  name: string;
  phone: string;
  source?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl: string;
  imageHint?: string;
}

export interface Order {
  id: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | string;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
  paymentStatus?: string;
  customImageUrls?: string[];
}

export interface Sample {
  id: string;
  productName: string;
  customerName: string;
  category: string;
  imageUrl: string;
}
