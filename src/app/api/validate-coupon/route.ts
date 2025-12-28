import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code) return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    
    const codeUpper = String(code).toUpperCase();
    const { data: coupon, error } = await supabaseAdmin()
      .from('coupons')
      .select('*')
      .eq('code', codeUpper)
      .eq('active', true)
      .single();
      
    if (error || !coupon) {
      return NextResponse.json({ error: 'Invalid coupon' }, { status: 400 });
    }
    
    const sub = Number(subtotal || 0);
    let discountAmount = 0;
    if (coupon.type === 'percent') {
      discountAmount = Math.min(sub, sub * (Number(coupon.value) / 100));
    } else if (coupon.type === 'flat') {
      discountAmount = Math.min(sub, Number(coupon.value));
    }
    return NextResponse.json({
      code: coupon.code,
      discountAmount,
      message: `Applied ${coupon.type === 'percent' ? coupon.value + '% OFF' : '₹' + coupon.value + ' OFF'}`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to validate coupon' }, { status: 500 });
  }
}
