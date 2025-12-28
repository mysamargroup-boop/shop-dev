import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function uploadCustomerImage(
  file: File,
  orderItemId: string,
  fileName: string
): Promise<{ fileUrl: string; error?: string }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate unique file path
    const filePath = `customer-uploads/${orderItemId}/${Date.now()}-${fileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('customer-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('customer-images')
      .getPublicUrl(filePath);

    // Store in database
    const { error: dbError } = await supabase
      .from('customer_uploads')
      .insert({
        order_item_id: orderItemId,
        file_name: fileName,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        upload_status: 'completed'
      });

    if (dbError) throw dbError;

    return { fileUrl: publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      fileUrl: '', 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

export async function getCustomerUploads(orderItemId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('customer_uploads')
      .select('*')
      .eq('order_item_id', orderItemId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fetch uploads error:', error);
    return [];
  }
}

export async function syncToGoogleDrive(fileUrl: string, fileName: string): Promise<string> {
  // TODO: Implement Google Drive API integration
  // This would use Google Drive API to create a copy of the image
  // Return Google Drive URL
  return fileUrl; // Placeholder
}
