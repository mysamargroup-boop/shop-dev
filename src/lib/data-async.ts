

'use server';
import path from 'path';
import type { Category, Product, ProductsData, BlogPost, SiteSettings, Sample, Order, Review, SiteImageData } from './types';
import { unstable_noStore as noStore } from 'next/cache';
// Import from Supabase instead of JSON files
import { 
  getProducts as getProductsFromSupabase, 
  getProductById as getProductByIdFromSupabase, 
  getProductByName as getProductByNameFromSupabase, 
  getOrders as getOrdersFromSupabase, 
  getBlogPosts as getBlogPostsFromSupabase, 
  getBlogPostsAdmin as getBlogPostsAdminFromSupabase, 
  getTags as getTagsFromSupabase,
  getSiteImages as getSiteImagesFromSupabase,
  getCategories as getCategoriesFromSupabase,
  getReviewsByProductId as getReviewsByProductIdFromSupabase
} from './data-supabase';

import { slugify } from './utils';

const fs = require('fs').promises;

const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'site-settings.json');
const imagesFilePath = path.join(process.cwd(), 'src', 'lib', 'placeholder-images.json');

// This function now uses the Supabase client
export async function getCategories(): Promise<Category[]> {
  noStore();
  return getCategoriesFromSupabase();
}

export async function getProducts(): Promise<Product[]> {
    noStore();
    const { products } = await getProductsFromSupabase();
    return products || [];
}

export async function getOrders(): Promise<Order[]> {
  noStore();
  return getOrdersFromSupabase();
}

export async function getProductById(id: string): Promise<Product | undefined> {
    noStore();
    const res = await getProductByIdFromSupabase(id);
    return res ?? undefined;
}

export async function getProductByName(name: string): Promise<Product | undefined> {
    noStore();
    return await getProductByNameFromSupabase(name);
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  noStore();
  return getBlogPostsFromSupabase();
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  noStore();
  return getBlogPostsAdminFromSupabase();
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  noStore();
  const posts = await getBlogPostsFromSupabase();
  return posts.find(post => post.slug === slug);
}

export async function getTags(): Promise<string[]> {
  noStore();
  return getTagsFromSupabase();
}

export async function getSiteSettings(): Promise<SiteSettings> {
  noStore();
  const data = await readJsonFile(settingsFilePath);
  return data || {};
}

export async function getSiteImages(): Promise<SiteImageData> {
  noStore();
  const data = await readJsonFile(imagesFilePath);
  return data || { placeholderImages: [], videos: [] };
}

const samplesFilePath = path.join(process.cwd(), 'src', 'lib', 'samples.json');

async function readJsonFile(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

export async function getSamples(): Promise<Sample[]> {
  noStore();
  const data = await readJsonFile(samplesFilePath);
  return data.samples || [];
}

export async function generateStaticParams() {
    const products = await getProducts();
    return products.map((product) => ({
      categoryName: slugify(product.category.split(',')[0].trim()),
      productName: slugify(product.name),
    }));
}

export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  noStore();
  return getReviewsByProductIdFromSupabase(productId);
}
