import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    const { type, days } = await req.json();
    const supabase = supabaseAdmin();
    if (type === 'all') {
      const { error } = await supabase.from('lead_analytics').delete().neq('id', '');
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    if (type === 'olderThan' && days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const { error } = await supabase
        .from('lead_analytics')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete analytics' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
