
'use server';
import path from 'path';
import type { Category, Product, ProductsData, BlogPost, SiteSettings } from './types';
import imageData from './json-seeds/placeholder-images.json';
import { unstable_noStore as noStore } from 'next/cache';
import { 
  getCategories as getCategoriesFromSupabase, 
  getProducts as getProductsFromSupabase, 
  getProductById as getProductByIdFromSupabase, 
  getOrders as getOrdersFromSupabase, 
  getSiteSettings as getSiteSettingsFromSupabase, 
  getBlogPosts as getBlogPostsFromSupabase, 
  getBlogPostBySlug as getBlogPostBySlugFromSupabase,
  getTags as getTagsFromSupabase,
  getSiteImages as getSiteImagesFromSupabase 
} from './data-supabase';

const pickImage = (images: Array<{ id: string; image_url: string; image_hint?: string }>, id: string) => {
  const image = images.find(img => img.id === id);
  return image || { id, image_url: `https://picsum.photos/seed/${id}/1200/1200`, image_hint: 'placeholder' };
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
  const [posts, images] = await Promise.all([
    getBlogPostsFromSupabase(),
    getSiteImagesFromSupabase()
  ]);
  return posts.map(post => {
    const img = pickImage(images, (post as any).image_key || '');
    const finalUrl = (post as any).image_url || img.image_url;
    const finalHint = img.image_hint;
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
  const [post, images] = await Promise.all([
    getBlogPostBySlugFromSupabase(slug),
    getSiteImagesFromSupabase()
  ]);
  if (!post) return undefined;
  const img = pickImage(images, (post as any).image_key || '');
  const finalUrl = (post as any).image_url || img.image_url;
  const finalHint = img.image_hint;
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

export async function getSiteImages() {
  noStore();
  return getSiteImagesFromSupabase();
}
