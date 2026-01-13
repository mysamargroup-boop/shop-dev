// This file is for data-fetching functions that are safe to use on the client-side.
// Do not import any server-only modules like 'fs' or 'path' here.

import type { Category } from './types';
import categoriesJson from './categories.json';
import imageData from './placeholder-images.json';
import { getTags as getTagsFromSupabase } from './data-supabase';
import { unstable_noStore as noStore } from 'next/cache';

export async function getCategories(): Promise<Category[]> {
    const data = categoriesJson as { categories: Category[] };
    return Array.isArray(data.categories) ? data.categories : [];
}

export async function getImageData() {
    return imageData;
}

export async function getTags(): Promise<string[]> {
    noStore();
    return getTagsFromSupabase();
}
