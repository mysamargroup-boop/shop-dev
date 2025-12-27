// This file is for data-fetching functions that are safe to use on the client-side.
// Do not import any server-only modules like 'fs' or 'path' here.

import type { Category } from './types';
import categoriesJson from './json-seeds/categories.json';
import imageData from './json-seeds/placeholder-images.json';
import tagsJson from './json-seeds/tags.json';

export async function getTags(): Promise<string[]> {
    const data = tagsJson as { tags: string[] };
    return Array.isArray(data.tags) ? data.tags : [];
}

export async function getCategories(): Promise<Category[]> {
    const data = categoriesJson as { categories: Category[] };
    return Array.isArray(data.categories) ? data.categories : [];
}

export async function getImageData() {
    return imageData;
}
