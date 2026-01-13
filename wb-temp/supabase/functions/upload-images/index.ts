
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper to decode base64 and get content type
const decodeBase64 = (base64String: string) => {
    const matches = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 string format');
    }
    const contentType = matches[1];
    const base64 = matches[2];
    const decodedData = atob(base64);
    const arrayBuffer = new Uint8Array(decodedData.length);
    for (let i = 0; i < decodedData.length; i++) {
        arrayBuffer[i] = decodedData.charCodeAt(i);
    }
    return { buffer: arrayBuffer.buffer, contentType };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // The order confirmation page sends `base64Files`
    const { base64Files, orderId } = await req.json();

    if (!base64Files || !Array.isArray(base64Files) || !orderId) {
      throw new Error('Missing or invalid parameters. Required: base64Files (array), orderId');
    }

    if (base64Files.length === 0) {
        return new Response(JSON.stringify({ message: "No files to upload." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 1. Upload all files to Supabase Storage
    const bucketName = Deno.env.get('CUSTOM_IMAGES_BUCKET') || 'user-custom-images';
    const uploadPromises = base64Files.map(async (file, index) => {
        const { buffer, contentType } = decodeBase64(file);
        const fileExt = contentType.split('/')[1] || 'png';
        const fileName = `image_${Date.now()}_${index + 1}.${fileExt}`;
        const filePath = `${orderId}/${fileName}`; // Store images in a folder named after the orderId

        let { error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(filePath, buffer, { contentType, upsert: false });

        if (uploadError) {
            if (String(uploadError.message).toLowerCase().includes('bucket not found')) {
                await supabaseAdmin.storage.createBucket(bucketName, { public: true }).catch(() => null);
                const retry = await supabaseAdmin.storage
                    .from(bucketName)
                    .upload(filePath, buffer, { contentType, upsert: false });
                uploadError = retry.error || null;
            }
            if (uploadError) {
                throw new Error(`Failed to upload image ${index + 1}: ${uploadError.message}`);
            }
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrl;
    });

    const urls = await Promise.all(uploadPromises);

    // 2. Update the corresponding order in the database with the new image URLs
    const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ custom_image_urls: urls })
        .eq('id', orderId);

    if (updateError) {
        console.warn(`Failed to save image URLs to order: ${updateError.message}`);
    }

    // 3. Return a success response
    return new Response(JSON.stringify({ 
        message: "Images uploaded and order updated successfully",
        urls 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Main error handler in upload-images:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
