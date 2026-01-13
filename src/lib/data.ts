// This file is for data-fetching functions that are safe to use on the client-side.
// Do not import any server-only modules like 'fs' or 'path' here.

import type { Category } from './types';
import { getTags as getTagsFromSupabase, getCategories as getCategoriesFromSupabase } from './data-supabase';
import { unstable_noStore as noStore } from 'next/cache';

export async function getCategories(): Promise<Category[]> {
    noStore();
    return getCategoriesFromSupabase();
}

export async function getTags(): Promise<string[]> {
    noStore();
    return getTagsFromSupabase();
}
