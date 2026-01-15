import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin().functions.invoke('lead-analytics', {
      body: {},
    });

    if (error) {
      console.error('Supabase lead-analytics error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to load lead analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Lead analytics API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

