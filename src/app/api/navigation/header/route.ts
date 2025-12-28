import { NextResponse } from 'next/server';
import { getHeaderLinks } from '@/lib/data-supabase';

export async function GET() {
  try {
    const links = await getHeaderLinks();
    return NextResponse.json(links, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load header links' }, { status: 500 });
  }
}
