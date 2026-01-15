// Upstash Redis implementation for caching
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedData(key: string): Promise<any> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCachedData(key: string, data: any, ttl: number = 300): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), { ex: ttl });
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function deleteCachedData(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

// Site settings specific functions
export async function getCachedSiteSettings(): Promise<any> {
  return getCachedData('site-settings');
}

export async function setCachedSiteSettings(settings: any): Promise<void> {
  return setCachedData('site-settings', settings, 300); // 5 minutes
}

export async function getCachedProducts(): Promise<any> {
  return getCachedData('products');
}

export async function setCachedProducts(products: any): Promise<void> {
  return setCachedData('products', products, 600); // 10 minutes
}

export async function getCachedCategories(): Promise<any> {
  return getCachedData('categories');
}

export async function setCachedCategories(categories: any): Promise<void> {
  return setCachedData('categories', categories, 1800); // 30 minutes
}
