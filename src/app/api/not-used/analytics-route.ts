// This API route is not currently used in the application.

import { NextRequest, NextResponse } from 'next/server';

// API endpoint for lead analytics
export async function POST(req: NextRequest) {
  try {
    const { events } = await req.json();
    
    // Get client IP and location data
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               '127.0.0.1';
    
    // Log events (migrated from JSON file to console/database pending)
    console.log('Analytics events received:', events?.length, 'from IP:', ip);
    
    return NextResponse.json({ success: true, processed: events?.length || 0 });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to process analytics' }, { status: 500 });
  }
}

// GET endpoint for admin dashboard
export async function GET(req: NextRequest) {
  // Return default structure since JSON file storage is removed
  // TODO: Implement Supabase analytics storage if needed
  const analyticsData = { 
    analytics: [], 
    settings: { autoDeleteDays: 30, maxRecords: 1000, dataRetentionEnabled: true } 
  };
  
  return NextResponse.json(analyticsData);
}
