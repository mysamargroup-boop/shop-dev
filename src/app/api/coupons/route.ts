
// This file defines API endpoints for managing discount coupons.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Handles GET requests to fetch all discount coupons.
 * @returns {NextResponse} A JSON response with the list of coupons or an error message.
 */
export async function GET() {
  try {
    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('code');

    if (error) throw error;

    return NextResponse.json(coupons);
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Handles POST requests to create a new discount coupon.
 * @param {NextRequest} req The incoming request object.
 * @returns {NextResponse} A JSON response with the newly created coupon or an error message.
 */
export async function POST(req: NextRequest) {
  try {
    const couponData = await req.json();
    
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .insert(couponData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(coupon);
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
