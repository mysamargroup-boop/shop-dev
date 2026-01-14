
// This file defines API endpoints for managing product categories.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Handles GET requests to fetch all product categories.
 * @returns {NextResponse} A JSON response with the list of categories or an error message.
 */
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

/**
 * Handles POST requests to create a new product category.
 * @param {NextRequest} req The incoming request object.
 * @returns {NextResponse} A JSON response with the newly created category or an error message.
 */
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
