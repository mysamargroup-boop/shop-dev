import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const analyticsFilePath = path.join(process.cwd(), 'src', 'lib', 'analytics.json');

// DELETE endpoint for analytics data cleanup
export async function DELETE(req: NextRequest) {
  try {
    const { type, days, olderThan } = await req.json();
    
    let analyticsData = { analytics: [], settings: { autoDeleteDays: 30, maxRecords: 1000, dataRetentionEnabled: true } };
    try {
      const fileContent = await fs.readFile(analyticsFilePath, 'utf-8');
      analyticsData = JSON.parse(fileContent);
    } catch (error) {
      console.log('No analytics data found');
    }

    let filteredAnalytics = [...analyticsData.analytics];

    if (type === 'olderThan' && days) {
      // Delete records older than specified days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filteredAnalytics = filteredAnalytics.filter((record: any) => 
        new Date(record.timestamp) > cutoffDate
      );
    } else if (type === 'all') {
      // Delete all records
      filteredAnalytics = [];
    }

    // Update analytics data
    analyticsData.analytics = filteredAnalytics;

    // Update settings if provided
    if (olderThan !== undefined) {
      analyticsData.settings.autoDeleteDays = olderThan;
    }

    await fs.writeFile(analyticsFilePath, JSON.stringify(analyticsData, null, 2));

    return NextResponse.json({ 
      success: true, 
      deleted: analyticsData.analytics.length - filteredAnalytics.length,
      remaining: filteredAnalytics.length 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete analytics' }, { status: 500 });
  }
}

// PUT endpoint for updating retention settings
export async function PUT(req: NextRequest) {
  try {
    const { autoDeleteDays, maxRecords, dataRetentionEnabled } = await req.json();
    
    let analyticsData = { analytics: [], settings: { autoDeleteDays: 30, maxRecords: 1000, dataRetentionEnabled: true } };
    try {
      const fileContent = await fs.readFile(analyticsFilePath, 'utf-8');
      analyticsData = JSON.parse(fileContent);
    } catch (error) {
      console.log('No analytics data found');
    }

    // Update settings
    if (autoDeleteDays !== undefined) analyticsData.settings.autoDeleteDays = autoDeleteDays;
    if (maxRecords !== undefined) analyticsData.settings.maxRecords = maxRecords;
    if (dataRetentionEnabled !== undefined) analyticsData.settings.dataRetentionEnabled = dataRetentionEnabled;

    await fs.writeFile(analyticsFilePath, JSON.stringify(analyticsData, null, 2));

    return NextResponse.json({ success: true, settings: analyticsData.settings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
