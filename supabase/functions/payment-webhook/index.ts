import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const getCashfreeConfig = () => {
  const env = Deno.env.get('CASHFREE_ENV')?.trim().toUpperCase() || 'SANDBOX';
  return {
    env,
    secretKey: Deno.env.get('CASHFREE_SECRET_KEY')?.trim(),
  };
};

// Helper to verify signature
async function verifySignature(ts: string, rawBody: string, signature: string, secretKey: string) {
  const data = ts + rawBody;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  return computedSignature === signature;
}

serve(async (req) => {
  try {
    const { secretKey } = getCashfreeConfig();
    
    // 1. Read Headers
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');
    
    // 2. Read Body
    const rawBody = await req.text();
    let body;
    try {
        body = JSON.parse(rawBody);
    } catch (e) {
        return new Response('Invalid JSON', { status: 400 });
    }

    console.log('Webhook Received:', body.type);

    // 3. Verify Signature strictly
    if (secretKey && signature && timestamp) {
        const isValid = await verifySignature(timestamp, rawBody, signature, secretKey);
        if (!isValid) {
            console.error('Invalid Signature');
            return new Response('Invalid Signature', { status: 403 });
        }
    } else {
        return new Response('Missing signature headers', { status: 400 });
    }

    // 4. Initialize Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 5. Handle Event
    if (body.type === 'PAYMENT_SUCCESS_WEBHOOK' || body.type === 'PAYMENT_SUCCESS') {
        const orderData = body.data.order;
        const paymentData = body.data.payment;
        
        const orderId = orderData.order_id;
        const transactionId = paymentData.cf_payment_id;
        const paymentStatus = paymentData.payment_status; // SUCCESS
        const amount = orderData.order_amount;

        // Update Orders Table
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                status: 'PAID',
                payment_status: 'PAID',
                transaction_id: String(transactionId),
                total_amount: Number(amount) // Ensure amount matches
            })
            .eq('external_order_id', orderId); // Assuming external_order_id matches Cashfree order_id

        if (updateError) {
            console.error('Error updating order:', updateError);
            throw updateError;
        }

        // Insert into Payments Table
        const { error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert({
                order_id: await getOrderIdByExternalId(supabaseAdmin, orderId),
                provider: 'CASHFREE',
                status: paymentStatus,
                amount: Number(amount),
                transaction_id: String(transactionId),
                raw_response: body,
                currency: orderData.order_currency
            });

        if (paymentError) {
             console.error('Error creating payment record:', paymentError);
             // Don't fail the webhook if payment record fails but order is updated? 
             // Better to log.
        }
        
        console.log(`Order ${orderId} marked as PAID.`);
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function getOrderIdByExternalId(supabase: any, externalId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('external_order_id', externalId)
        .single();
    if (error || !data) return null;
    return data.id;
}
