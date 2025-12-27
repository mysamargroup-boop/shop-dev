import { NextResponse } from 'next/server';
import { getBlogPosts } from '@/lib/data-async';

export async function GET() {
  try {
    const posts = await getBlogPosts();
    return NextResponse.json(posts);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch blogs' }, { status: 500 });
  }
}
