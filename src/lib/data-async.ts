

'use server';
import path from 'path';
import type { Category, Product, ProductsData, BlogPost, SiteSettings, SiteImage, Sample, Order } from './types';
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
  getSiteImages as getSiteImagesFromSupabase
} from './data-supabase';

import { getCategories as getCategoriesFromJson } from './data';
import fs from 'fs/promises';

const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'site-settings.json');
const bannersFilePath = path.join(process.cwd(), 'src', 'lib', 'banners.json');


export async function getCategories(): Promise<Category[]> {
  noStore();
  return getCategoriesFromJson();
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
    const products = await getProducts();
    const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    return products.find(p => slugify(p.name) === name);
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
    return getTagsFromSupabase();
}

export async function getSiteSettings(): Promise<SiteSettings> {
  noStore();
  try {
    const [settingsContent, bannersContent] = await Promise.all([
      fs.readFile(settingsFilePath, 'utf-8').catch(() => '{}'),
      fs.readFile(bannersFilePath, 'utf-8').catch(() => '{}'),
    ]);
    const settings = JSON.parse(settingsContent);
    const banners = JSON.parse(bannersContent);
    return { ...settings, ...banners };
  } catch (error) {
    console.error("Error reading settings file:", error);
    return {};
  }
}

export async function getSiteImages(): Promise<SiteImage[]> {
  noStore();
  return getSiteImagesFromSupabase();
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
    const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    return products.map((product) => ({
      categoryName: slugify(product.category.split(',')[0].trim()),
      productName: slugify(product.name),
    }));
}
