import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin()
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const categoryData = await req.json();
    
    const { data: category, error } = await supabaseAdmin()
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
