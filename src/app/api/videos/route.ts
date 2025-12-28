import { NextResponse } from 'next/server';
import { getSiteVideos } from '@/lib/data-supabase';

export async function GET() {
  try {
    const videos = await getSiteVideos();
    return NextResponse.json(videos, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load videos' }, { status: 500 });
  }
}
