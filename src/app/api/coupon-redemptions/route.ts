import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const code = String(payload.code || '').toUpperCase();
    const subtotal = Number(payload.subtotal || 0);
    const discountAmount = Number(payload.discountAmount || 0);
    const orderId = String(payload.orderId || '');
    const sessionId = String(payload.sessionId || '');
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }
    const supabase = supabaseAdmin();
    const { error } = await supabase.from('coupon_redemptions').insert({
      code,
      subtotal,
      discount_amount: discountAmount,
      order_id: orderId || null,
      session_id: sessionId || null,
    });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record redemption' }, { status: 500 });
  }
}
