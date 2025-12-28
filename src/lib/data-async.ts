'use server';
import path from 'path';
import type { Category, Product, ProductsData, BlogPost, SiteSettings, SiteImage } from './types';
import { unstable_noStore as noStore } from 'next/cache';
// Import from Supabase instead of JSON files
import { 
  getCategories as getCategoriesFromSupabase, 
  getProducts as getProductsFromSupabase, 
  getProductById as getProductByIdFromSupabase, 
  getOrders as getOrdersFromSupabase, 
  getSiteSettings as getSiteSettingsFromSupabase, 
  getBlogPosts as getBlogPostsFromSupabase, 
  getTags as getTagsFromSupabase,
  getSiteImages as getSiteImagesFromSupabase
} from './data-supabase';




export async function getCategories(): Promise<Category[]> {
  noStore();
  return getCategoriesFromSupabase();
}

export async function getProducts(): Promise<Product[]> {
    noStore();
    const result = await getProductsFromSupabase();
    return result.products || [];
}

export async function getOrders(): Promise<any[]> {
  noStore();
  return getOrdersFromSupabase();
}


export async function getProductById(id: string): Promise<Product | undefined> {
    noStore();
    const res = await getProductByIdFromSupabase(id);
    return res ?? undefined;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  noStore();
  return getBlogPostsFromSupabase();
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  noStore();
  const posts = await getBlogPostsFromSupabase();
  return posts.find(post => post.slug === slug);
}

export async function getTags(): Promise<string[]> {
    return getTagsFromSupabase();
}

export async function getSiteSettings(): Promise<SiteSettings> {
  noStore();
  return getSiteSettingsFromSupabase();
}

export async function getSiteImages(): Promise<SiteImage[]> {
  noStore();
  return getSiteImagesFromSupabase();
}
