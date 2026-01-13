
import { NextResponse } from 'next/server';
import { getCoupons } from '@/lib/actions';

export async function GET() {
  try {
    const coupons = await getCoupons();
    return NextResponse.json({ coupons });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load coupons' }, { status: 500 });
  }
}
