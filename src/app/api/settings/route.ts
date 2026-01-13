import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/actions';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings || {}, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load settings' }, { status: 500 });
  }
}
