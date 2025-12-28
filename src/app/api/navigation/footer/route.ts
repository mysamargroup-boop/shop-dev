import { NextResponse } from 'next/server';
import { getFooterLinkSections } from '@/lib/data-supabase';

export async function GET() {
  try {
    const sections = await getFooterLinkSections();
    return NextResponse.json(sections, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load footer links' }, { status: 500 });
  }
}
