// This API route is not currently used in the application.

import { NextResponse } from 'next/server';
import { getTags } from '@/lib/data-async';

export async function GET() {
  try {
    const tags = await getTags();
    return NextResponse.json({ tags });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load tags' }, { status: 500 });
  }
}
