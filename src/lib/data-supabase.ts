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
    return { products: data || [] };
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
    return data;
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
