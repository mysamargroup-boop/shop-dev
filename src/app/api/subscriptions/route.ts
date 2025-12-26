import { NextRequest, NextResponse } from 'next/server';
import { createSubscription, getSubscriptions } from '@/lib/actions';

export async function GET() {
  try {
    const list = await getSubscriptions();
    return NextResponse.json({ subscriptions: list });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    const phone = String(body?.phone || '').replace(/\D/g, '');
    const source = String(body?.source || '').trim() || undefined;
    if (!name || !phone) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const res = await createSubscription({ name, phone, source });
    if (!res.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save' }, { status: 500 });
  }
}
