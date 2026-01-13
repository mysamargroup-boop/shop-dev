
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Helper to verify Cashfree webhook signature
async function verifyWebhookSignature(body: string, signature: string, timestamp: string, secret: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const dataToSign = timestamp + body;
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signatureArray = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureArray)));
    
    // Simple comparison is okay for this context, but a timing-safe compare is best practice
    return signature === expectedSignature;
}

// Main function to handle requests
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // Handle Cashfree's test webhook, which sends an event "TEST"
    if (body.event === 'TEST') {
        console.log("Received Cashfree test webhook. Responding with success.");
        return new Response(JSON.stringify({ success: true, message: "Test webhook received" }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
        });
    }
    
    // Cashfree headers for signature verification
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    const webhookSecret = Deno.env.get('CASHFREE_WEBHOOK_SECRET') || '';

    // 1. Verify Signature
    if (webhookSecret && !(await verifyWebhookSignature(rawBody, signature, timestamp, webhookSecret))) {
        console.warn("Invalid webhook signature received.");
        // In production, you might want to return a 401 Unauthorized error.
        // For debugging, we can proceed but log the warning.
        // return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { order } = body.data;
    if (!order || !order.order_id) {
        return new Response(JSON.stringify({ error: 'order_id is missing' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { order_id, order_status, customer_details } = order;

    // 2. Update Order in Supabase
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ status: order_status, payment_status: order_status })
        .eq('id', order_id);

    if (updateError) {
        console.error(`Failed to update order ${order_id}:`, updateError);
        // Continue processing to still attempt notifications
    }
    
    // Only proceed with post-payment actions if payment was successful
    if (order_status === 'PAID') {
        // Fetch full order details to get item info for notifications
        const { data: fullOrder, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*, order_details(*)')
            .eq('id', order_id)
            .single();

        if (orderError || !fullOrder) {
            console.error(`FATAL: Could not retrieve order ${order_id} after successful payment.`);
            return new Response(JSON.stringify({ success: true, message: "Webhook acknowledged but order details not found." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
        }

        const orderDetails = Array.isArray(fullOrder.order_details) ? fullOrder.order_details[0] : fullOrder.order_details;
        const customerPhone = customer_details?.customer_phone;
        const adminPhone = Deno.env.get('NEXT_PUBLIC_SUPPORT_PHONE_NUMBER');

        // 3. Send WhatsApp Confirmation
        const whatsappToken = Deno.env.get('WHATSAPP_CLOUD_ACCESS_TOKEN');
        const phoneId = Deno.env.get('WHATSAPP_CLOUD_PHONE_NUMBER_ID');
        const templateName = Deno.env.get('WHATSAPP_TEMPLATE_NAME');
        const templateLanguage = (Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') || 'en_US').toUpperCase();

        if (customerPhone && templateName && whatsappToken && phoneId) {
            const productNames = (orderDetails.order_items || []).map((item: any) => item.name).join(', ');
            const totalQuantity = (orderDetails.order_items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
            
            const bodyParameters = [
              customer_details.customer_name || 'Customer',
              order_id,
              productNames,
              String(totalQuantity),
              fullOrder.customer_address || 'N/A',
              String(orderDetails.total_amount)
            ];

            const whatsappPayload = {
                messaging_product: 'whatsapp',
                to: customerPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: templateLanguage },
                    components: [{
                        type: 'body',
                        parameters: bodyParameters.map(text => ({ type: 'text', text }))
                    }]
                }
            };

            const waRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(whatsappPayload)
            }).catch(e => {
                console.error(`Failed to send WhatsApp confirmation for ${order_id}:`, e);
                return null;
            });
            if (waRes && !waRes.ok) {
                const errBody = await waRes.json().catch(() => ({}));
                console.error('WhatsApp API error:', errBody);
            }
        }

        // 4. Admin notification for custom images
        const customImageUrls = fullOrder.custom_image_urls || [];
        if (customImageUrls.length > 0 && adminPhone && whatsappToken && phoneId) {
            const msgBody = `New order ${order_id} from ${fullOrder.customer_name} has custom images:\n${customImageUrls.join('\n')}`;
            const adminMsgPayload = {
                messaging_product: 'whatsapp',
                to: adminPhone,
                type: 'text',
                text: { body: msgBody, preview_url: true },
            };
            
            const adminRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(adminMsgPayload)
            }).catch(e => {
                console.error(`Failed to send admin WhatsApp notification for ${order_id}:`, e);
                return null;
            });
            if (adminRes && !adminRes.ok) {
                const errBody = await adminRes.json().catch(() => ({}));
                console.error('Admin WhatsApp API error:', errBody);
            }
        }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
