
'use server';
import path from 'path';
import type { Category, Product, ProductsData, BlogPost, SiteSettings } from './types';
import blogData from './blogs.json';
import imageData from './placeholder-images.json';
import { unstable_noStore as noStore } from 'next/cache';
import tagsData from './tags.json';
// Import from Supabase instead of JSON files
import { 
  getCategories as getCategoriesFromSupabase, 
  getProducts as getProductsFromSupabase, 
  getProductById as getProductByIdFromSupabase, 
  getOrders as getOrdersFromSupabase, 
  getSiteSettings as getSiteSettingsFromSupabase, 
  getBlogPosts as getBlogPostsFromSupabase, 
  getTags as getTagsFromSupabase 
} from './data-supabase';


const fs = require('fs').promises;

const categoriesFilePath = path.join(process.cwd(), 'src', 'lib', 'categories.json');
const productsFilePath = path.join(process.cwd(), 'src', 'lib', 'products.json');
const ordersFilePath = path.join(process.cwd(), 'src', 'lib', 'orders.json');
const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'site-settings.json');
const bannersFilePath = path.join(process.cwd(), 'src', 'lib', 'banners.json');


const { placeholderImages } = imageData;

const getImage = (id: string) => {
  const image = placeholderImages.find(img => img.id === id);
  return image || { imageUrl: `https://picsum.photos/seed/${id}/1200/1200`, imageHint: 'placeholder' };
};

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
    const p = await getProductByIdFromSupabase(id);
    return p || undefined;
}

export async function getImageData() {
    return imageData;
}

const blogPosts: BlogPost[] = (blogData as { posts: BlogPost[] }).posts.map(post => ({
  ...post,
  imageUrl: getImage(post.imageKey).imageUrl,
  imageHint: getImage(post.imageKey).imageHint,
}));

export async function getBlogPosts(): Promise<BlogPost[]> {
  return blogPosts;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return blogPosts.find(post => post.slug === slug);
}

export async function getTags(): Promise<string[]> {
    return getTagsFromSupabase();
}

export async function getSiteSettings(): Promise<SiteSettings> {
  noStore();
  return getSiteSettingsFromSupabase();
}
