import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { events } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || '';
    const location = { city: 'Unknown', country: 'Unknown' };
    const supabase = supabaseAdmin();
    const rows = (events || []).map((event: any) => ({
      session_id: event.sessionId,
      ip_address: ip,
      user_agent: userAgent,
      city: location.city,
      country: location.country,
      referrer: event.referrer,
      utm_source: event.utmSource,
      utm_medium: event.utmMedium,
      utm_campaign: event.utmCampaign,
      page_url: event.pageUrl,
      event_type: event.eventType,
      element_selector: event.elementSelector,
      timestamp: new Date().toISOString(),
    }));
    if (rows.length) {
      const { error } = await supabase.from('lead_analytics').insert(rows);
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process analytics' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('lead_analytics')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
