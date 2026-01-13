

'use server';
import path from 'path';
import type { Category, Product, ProductsData, BlogPost, SiteSettings, Sample, Order } from './types';
import blogData from './blogs.json';
import imageData from './placeholder-images.json';
import { unstable_noStore as noStore } from 'next/cache';
import tagsData from './tags.json';
import { slugify } from './utils';
import { supabaseAdmin } from './supabase-client'; // Corrected import

const fs = require('fs').promises;

const categoriesFilePath = path.join(process.cwd(), 'src', 'lib', 'categories.json');
const productsFilePath = path.join(process.cwd(), 'src', 'lib', 'products.json');
const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'site-settings.json');
const bannersFilePath = path.join(process.cwd(), 'src', 'lib', 'banners.json');
const samplesFilePath = path.join(process.cwd(), 'src', 'lib', 'samples.json');


const { placeholderImages } = imageData;

const getImage = (id: string) => {
  const image = placeholderImages.find(img => img.id === id);
  return image || { imageUrl: `https://picsum.photos/seed/${id}/1200/1200`, imageHint: 'placeholder' };
};

export async function getCategories(): Promise<Category[]> {
  noStore();
  try {
    const fileContent = await fs.readFile(categoriesFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.categories;
  } catch (error) {
    console.error("Error reading categories file:", error);
    return [];
  }
}

export async function getProducts(): Promise<Product[]> {
    noStore();
    try {
        const fileContent = await fs.readFile(productsFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent) as unknown;
        if (Array.isArray(parsed)) {
          return parsed as Product[];
        }
        const data = parsed as Partial<ProductsData>;
        return Array.isArray(data.products) ? data.products : [];
    } catch (error) {
        console.error("Error reading products file:", error);
        return [];
    }
}

export async function getOrders(): Promise<Order[]> {
  noStore();
  // Use the new supabaseAdmin client
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('orders')
    // Also fetch the related order_details for each order
    .select('*, order_details(*)') 
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders from Supabase:', error);
    return [];
  }
  
  return data as Order[];
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  noStore();
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_details(*)')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error(`Error fetching order with id ${orderId} from Supabase:`, error);
    return null;
  }

  return data as Order | null;
}


export async function getProductById(id: string): Promise<Product | undefined> {
    noStore();
    const products = await getProducts();
    return products.find(p => p.id === id);
}

export async function getProductByName(name: string): Promise<Product | undefined> {
    noStore();
    const products = await getProducts();
    return products.find(p => slugify(p.name) === name);
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
    const data = tagsData as { tags: string[] };
    return Array.isArray(data.tags) ? data.tags : [];
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

export async function getSamples(): Promise<Sample[]> {
  noStore();
  try {
    const fileContent = await fs.readFile(samplesFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.samples || [];
  } catch (error) {
    console.error("Error reading samples file:", error);
    return [];
  }
}
