import { NextRequest, NextResponse } from 'next/server';
import { uploadCustomerImage, getCustomerUploads } from '@/lib/supabase-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderItemId = formData.get('orderItemId') as string;

    if (!file || !orderItemId) {
      return NextResponse.json(
        { error: 'File and orderItemId are required' },
        { status: 400 }
      );
    }

    const result = await uploadCustomerImage(file, orderItemId, file.name);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      fileUrl: result.fileUrl 
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderItemId = searchParams.get('orderItemId');

    if (!orderItemId) {
      return NextResponse.json(
        { error: 'orderItemId is required' },
        { status: 400 }
      );
    }

    const uploads = await getCustomerUploads(orderItemId);
    
    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Fetch uploads API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    );
  }
}
