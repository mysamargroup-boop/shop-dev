import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/actions';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings || {}, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load settings' }, { status: 500 });
  }
}

