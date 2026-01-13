import { NextResponse } from "next/server";
import { getCategories as getCategoriesFromSupabase } from '@/lib/data-supabase';

export async function GET() {
  const categories = await getCategoriesFromSupabase();
  return NextResponse.json(categories);
}
