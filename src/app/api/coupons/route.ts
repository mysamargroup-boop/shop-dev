import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: coupons, error } = await supabaseAdmin()
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

export async function POST(req: NextRequest) {
  try {
    const couponData = await req.json();
    
    const { data: coupon, error } = await supabaseAdmin()
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
