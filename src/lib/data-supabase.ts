'use server';
import { supabaseAdmin } from './supabase';
import type { Category, Product, ProductsData, BlogPost, SiteSettings, SiteImage } from './types';

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
    const transformedProducts = (data || []).map(product => ({
      ...product,
      imageUrl: product.image_url,
      imageAlt: product.image_alt,
      imageHint: product.image_hint,
      galleryImages: product.gallery_images,
      videoUrl: product.video_url,
      imageAttribution: product.image_attribution,
      allowImageUpload: product.allow_image_upload,
      weightGrams: product.weight_grams,
      dimensionsLength: product.dimensions_length,
      dimensionsWidth: product.dimensions_width,
      dimensionsHeight: product.dimensions_height,
      specificDescription: product.specific_description,
      reviewCount: product.review_count,
      // Map price fields
      price: product.sale_price || product.regular_price,
      // Map category
      category: product.category_id
    }));
    
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
      dimensionsLength: data.dimensions_length,
      dimensionsWidth: data.dimensions_width,
      dimensionsHeight: data.dimensions_height,
      specificDescription: data.specific_description,
      reviewCount: data.review_count,
      price: data.sale_price || data.regular_price,
      category: data.category_id
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getOrders(): Promise<any[]> {
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
      .not('published_at', 'is', null) // Corrected filter syntax if needed, or stick to previous if valid
      .order('published_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(post => ({
      slug: post.slug,
      title: post.title,
      date: post.published_at ? new Date(post.published_at).toISOString().split('T')[0] : '', // Assuming date is stored as timestamp
      author: post.author,
      excerpt: post.excerpt,
      imageKey: post.image_key,
      imageUrl: post.image_url,
      imageHint: post.image_hint,
      content: post.content
    }));
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

export async function getSiteImages(): Promise<SiteImage[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('site_images')
      .select('*');
    
    if (error) throw error;
    
    return (data || []).map(img => ({
      id: img.id,
      name: img.name,
      description: img.description,
      imageUrl: img.image_url,
      imageHint: img.image_hint
    }));
  } catch (error) {
    console.error('Error fetching site images:', error);
    return [];
  }
}

export async function getHeaderLinks(): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('navigation_links')
      .select('*')
      .eq('area', 'header')
      .order('sort_order');
    if (error) throw error;
    return (data || []).map(link => ({
      id: link.id,
      href: link.href,
      label: link.label,
      special: !!link.special,
      isMegaMenu: !!link.is_mega_menu,
      icon: null
    }));
  } catch (error) {
    console.error('Error fetching header links:', error);
    return [];
  }
}

export async function getFooterLinkSections(): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('navigation_links')
      .select('*')
      .eq('area', 'footer')
      .order('sort_order');
    if (error) throw error;
    const bySection: Record<string, { title: string; links: { id: number; href: string; label: string }[] }> = {};
    (data || []).forEach(link => {
      const section = link.section || 'Links';
      if (!bySection[section]) bySection[section] = { title: section, links: [] };
      bySection[section].links.push({ id: link.id, href: link.href, label: link.label });
    });
    return Object.values(bySection);
  } catch (error) {
    console.error('Error fetching footer links:', error);
    return [];
  }
}
