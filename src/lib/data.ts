// This file is for data-fetching functions that are safe to use on the client-side.
// Do not import any server-only modules like 'fs' or 'path' here.

import type { Category } from './types';

export async function getTags(): Promise<string[]> {
    return [];
}

export async function getCategories(): Promise<Category[]> {
    return [];
}
