import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp-cloud';
import { supabaseAdmin } from '@/lib/supabase';

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const body = JSON.parse(rawBody);
        
        // Verify webhook signature for security
        const signature = request.headers.get('x-webhook-signature');
        const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
        
        if (!webhookSecret) {
            console.warn('CASHFREE_WEBHOOK_SECRET is not configured. Skipping signature verification.');
        } else if (signature) {
            const isValidSignature = verifyWebhookSignature(rawBody, signature, webhookSecret);
            if (!isValidSignature) {
                console.error('Invalid webhook signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
            console.log('Webhook signature verified successfully');
        } else {
            console.warn('Missing x-webhook-signature header');
        }
        
        console.log('Payment webhook received:', JSON.stringify(body, null, 2));

        const { 
            order_id, 
            order_status, 
            payment_status,
            customer_details,
            order_amount,
            payment_session_id,
            transaction_id
        } = body;

        // Update Local Order Status
        // Get Supabase client
        const supabase = supabaseAdmin();
        
        // Check if order already exists
        const { data: existingOrder } = await supabase
            .from('orders')
            .select('*')
            .eq('external_order_id', String(order_id))
            .single();

        if (existingOrder) {
            // Update existing order
            const updateData = {
                status: (payment_status === 'SUCCESS' || order_status === 'PAID') ? 'PAID' : order_status,
                payment_status: payment_status,
                transaction_id: transaction_id || payment_session_id || existingOrder.transaction_id,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', existingOrder.id);
            
            if (error) throw error;
        } else {
            // Create new order
            const newOrder = {
                external_order_id: String(order_id),
                customer_name: customer_details?.customer_name || "Customer",
                customer_phone: customer_details?.customer_phone || "",
                status: (payment_status === 'SUCCESS' || order_status === 'PAID') ? 'PAID' : order_status,
                payment_status: payment_status,
                transaction_id: transaction_id || payment_session_id,
                total_amount: Number(order_amount),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('orders')
                .insert(newOrder);
            
            if (error) throw error;
        }

        // Create payment record
        const paymentData = {
            order_id: existingOrder?.id || null,
            provider: 'cashfree',
            status: payment_status,
            amount: Number(order_amount),
            currency: 'INR',
            session_id: payment_session_id,
            provider_order_id: String(order_id),
            transaction_id: transaction_id,
            raw_response: body,
            created_at: new Date().toISOString()
        };

        await supabase
            .from('payments')
            .insert(paymentData);

        console.log(`Order ${order_id} updated in Supabase.`);

        if (payment_status === 'SUCCESS' || order_status === 'PAID') {
            console.log(`Payment successful for order ${order_id}`);
            const toPhone = customer_details?.customer_phone || process.env.WHATSAPP_TEST_TO || process.env.DEFAULT_TEST_WHATSAPP_TO;
            const templateName =
              process.env.WHATSAPP_ORDER_TEMPLATE_NAME ||
              process.env.WHATSAPP_TEMPLATE_NAME;
            const languageCode =
              process.env.WHATSAPP_ORDER_TEMPLATE_LANGUAGE ||
              process.env.WHATSAPP_TEMPLATE_LANGUAGE ||
              'en_US';
            
            if (toPhone && templateName) {
              const templateValues: Record<string, string> = {
                orderId: String(order_id || ''),
                totalCost: typeof order_amount !== 'undefined' ? String(order_amount) : '',
                customerName: customer_details?.customer_name || '',
                customerPhone: customer_details?.customer_phone || '',
              };
              
              const bodyKeys = (process.env.WHATSAPP_ORDER_TEMPLATE_BODY_KEYS || process.env.WHATSAPP_TEMPLATE_BODY_KEYS || 'customerName,orderId,totalCost')
                .split(',')
                .map(k => k.trim())
                .filter(Boolean);
              const headerKeys = (process.env.WHATSAPP_ORDER_TEMPLATE_HEADER_KEYS || process.env.WHATSAPP_TEMPLATE_HEADER_KEYS || '')
                .split(',')
                .map(k => k.trim())
                .filter(Boolean);
              
              const bodyParameters = bodyKeys.map(key => templateValues[key] || '');
              const headerParameters = headerKeys.map(key => templateValues[key] || '');
              
              try {
                await sendWhatsAppTemplateMessage({
                  to: toPhone,
                  templateName,
                  languageCode,
                  bodyParameters,
                  headerParameters,
                });
                console.log(`WhatsApp confirmation sent to ${toPhone} for order ${order_id}`);
              } catch (e) {
                console.error('Failed to send WhatsApp confirmation:', e);
              }
            } else {
              console.warn('WhatsApp template or recipient not configured; skipping message send');
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ 
            error: 'Webhook processing failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
