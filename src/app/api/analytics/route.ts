import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const analyticsFilePath = path.join(process.cwd(), 'src', 'lib', 'analytics.json');

// API endpoint for lead analytics
export async function POST(req: NextRequest) {
  try {
    const { events } = await req.json();
    
    // Get client IP and location data
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               '127.0.0.1';
    
    const userAgent = req.headers.get('user-agent') || '';
    
    // Get location data (mock for now)
    let location = { city: 'Unknown', country: 'Unknown' };
    
    // Process events and store in JSON file
    const processedEvents = events.map((event: any) => ({
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    // Read existing analytics data
    let analyticsData = { analytics: [] };
    try {
      const fileContent = await fs.readFile(analyticsFilePath, 'utf-8');
      analyticsData = JSON.parse(fileContent);
    } catch (error) {
      console.log('Creating new analytics file');
    }

    // Add new events
    (analyticsData.analytics as any[]).push(...processedEvents);
    
    // Keep only last 1000 events to prevent file from getting too large
    if (analyticsData.analytics.length > 1000) {
      analyticsData.analytics = analyticsData.analytics.slice(-1000);
    }

    // Write back to file
    await fs.writeFile(analyticsFilePath, JSON.stringify(analyticsData, null, 2));
    
    console.log('Analytics events saved:', processedEvents.length);
    
    return NextResponse.json({ success: true, processed: processedEvents.length });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to process analytics' }, { status: 500 });
  }
}

// GET endpoint for admin dashboard
export async function GET(req: NextRequest) {
  try {
    // Read from JSON file
    let analyticsData = { analytics: [], settings: { autoDeleteDays: 30, maxRecords: 1000, dataRetentionEnabled: true } };
    try {
      const fileContent = await fs.readFile(analyticsFilePath, 'utf-8');
      analyticsData = JSON.parse(fileContent);
    } catch (error) {
      console.log('NoNo analytics data found');
    }

    // Apply auto-cleanup if enabled
    if (analyticsData.settings.dataRetentionEnabled && analyticsData.settings.autoDeleteDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - analyticsData.settings.autoDeleteDays);
      
      analyticsData.analytics = analyticsData.analytics.filter((record: any) => 
        new Date(record.timestamp) > cutoffDate
      );
    }

    // Apply max records limit
    if (analyticsData.analytics.length > analyticsData.settings.maxRecords) {
      analyticsData.analytics = analyticsData.analytics.slice(-analyticsData.settings.maxRecords);
    }

    // Sort by timestamp (newest first)
    const sortedData = analyticsData.analytics.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ data: sortedData, settings: analyticsData.settings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
