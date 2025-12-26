
'use server';
import path from 'path';
import type { Category, Product, ProductsData, BlogPost, SiteSettings } from './types';
import imageData from './placeholder-images.json';
import { unstable_noStore as noStore } from 'next/cache';
import { 
  getCategories as getCategoriesFromSupabase, 
  getProducts as getProductsFromSupabase, 
  getProductById as getProductByIdFromSupabase, 
  getOrders as getOrdersFromSupabase, 
  getSiteSettings as getSiteSettingsFromSupabase, 
  getBlogPosts as getBlogPostsFromSupabase, 
  getBlogPostBySlug as getBlogPostBySlugFromSupabase,
  getTags as getTagsFromSupabase 
} from './data-supabase';

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

export async function getBlogPosts(): Promise<BlogPost[]> {
  const posts = await getBlogPostsFromSupabase();
  return posts.map(post => {
    const img = getImage((post as any).image_key || '');
    const finalUrl = (post as any).image_url || img.imageUrl;
    const finalHint = img.imageHint;
    return {
      slug: (post as any).slug,
      title: (post as any).title,
      date: (post as any).published_at || '',
      excerpt: '',
      imageUrl: finalUrl,
      imageHint: finalHint,
      author: (post as any).author || '',
      content: (post as any).content || '',
      imageKey: (post as any).image_key || '',
    } as BlogPost;
  });
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const post = await getBlogPostBySlugFromSupabase(slug);
  if (!post) return undefined;
  const img = getImage((post as any).image_key || '');
  const finalUrl = (post as any).image_url || img.imageUrl;
  const finalHint = img.imageHint;
  return {
    slug: (post as any).slug,
    title: (post as any).title,
    date: (post as any).published_at || '',
    excerpt: '',
    imageUrl: finalUrl,
    imageHint: finalHint,
    author: (post as any).author || '',
    content: (post as any).content || '',
    imageKey: (post as any).image_key || '',
  } as BlogPost;
}

export async function getTags(): Promise<string[]> {
    return getTagsFromSupabase();
}

export async function getSiteSettings(): Promise<SiteSettings> {
  noStore();
  return getSiteSettingsFromSupabase();
}
