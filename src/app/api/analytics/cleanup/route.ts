import { NextRequest, NextResponse } from 'next/server';

// DELETE endpoint for analytics data cleanup
export async function DELETE(req: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    deleted: 0,
    remaining: 0 
  });
}

// PUT endpoint for updating retention settings
export async function PUT(req: NextRequest) {
  try {
    const { autoDeleteDays, maxRecords, dataRetentionEnabled } = await req.json();
    // Settings update ignored as file storage is removed
    return NextResponse.json({ 
      success: true, 
      settings: { autoDeleteDays, maxRecords, dataRetentionEnabled } 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
