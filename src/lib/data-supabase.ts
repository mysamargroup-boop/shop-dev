'use server';
import { supabaseAdmin } from './supabase';
import type { Category, Product, ProductsData, BlogPost, SiteSettings } from './types';

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getProducts(): Promise<ProductsData> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform snake_case to camelCase to match TypeScript interface
    const transformedProducts = (data || []).map(product => {
      const regularPrice = typeof product.regular_price === 'number' ? product.regular_price : undefined;
      const salePrice = typeof product.sale_price === 'number' ? product.sale_price : undefined;
      const price = typeof salePrice === 'number' ? salePrice : (typeof regularPrice === 'number' ? regularPrice : 0);
      const hasDims = [product.dimensions_length, product.dimensions_width, product.dimensions_height].some(v => typeof v === 'number');
      return {
        ...product,
        imageUrl: product.image_url,
        imageAlt: product.image_alt,
        imageHint: product.image_hint,
        galleryImages: product.gallery_images,
        videoUrl: product.video_url,
        imageAttribution: product.image_attribution,
        allowImageUpload: product.allow_image_upload,
        weightGrams: product.weight_grams,
        dimensionsCm: hasDims ? {
          length: Number(product.dimensions_length || 0),
          width: Number(product.dimensions_width || 0),
          height: Number(product.dimensions_height || 0),
        } : undefined,
        specificDescription: product.specific_description,
        reviewCount: product.review_count,
        price,
        regularPrice,
        salePrice,
        category: product.category_id
      };
    });
    
    return { products: transformedProducts };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [] };
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    // Transform snake_case to camelCase to match TypeScript interface
    const regularPrice = typeof data.regular_price === 'number' ? data.regular_price : undefined;
    const salePrice = typeof data.sale_price === 'number' ? data.sale_price : undefined;
    const price = typeof salePrice === 'number' ? salePrice : (typeof regularPrice === 'number' ? regularPrice : 0);
    const hasDims = [data.dimensions_length, data.dimensions_width, data.dimensions_height].some(v => typeof v === 'number');
    return {
      ...data,
      imageUrl: data.image_url,
      imageAlt: data.image_alt,
      imageHint: data.image_hint,
      galleryImages: data.gallery_images,
      videoUrl: data.video_url,
      imageAttribution: data.image_attribution,
      allowImageUpload: data.allow_image_upload,
      weightGrams: data.weight_grams,
      dimensionsCm: hasDims ? {
        length: Number(data.dimensions_length || 0),
        width: Number(data.dimensions_width || 0),
        height: Number(data.dimensions_height || 0),
      } : undefined,
      specificDescription: data.specific_description,
      reviewCount: data.review_count,
      price,
      regularPrice,
      salePrice,
      category: data.category_id
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getOrders() {
  try {
    const { data, error } = await supabaseAdmin()
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('site_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    return data || {};
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return {};
  }
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('blog_posts')
      .select('*')
      .eq('published_at', 'not null')
      .order('published_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function getTags(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('tags')
      .select('name')
      .order('name');
    
    if (error) throw error;
    return data?.map(tag => tag.name) || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}
