import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: settings, error } = await supabaseAdmin()
      .from('site_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json(settings || {});
  } catch (error: any) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const settingsData = await req.json();
    
    const { data: settings, error } = await supabaseAdmin()
      .from('site_settings')
      .upsert(settingsData, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
