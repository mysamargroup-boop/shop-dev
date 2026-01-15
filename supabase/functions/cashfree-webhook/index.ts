import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper to get allowed origin from environment
const getAllowedOrigin = () => {
  const publicUrl = Deno.env.get('PUBLIC_URL');
  const allowedUrl = Deno.env.get('ALLOWED_ORIGIN');
  return publicUrl || allowedUrl || 'http://localhost:3000';
};

function createSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function hexFromBytes(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  );
  return hexFromBytes(new Uint8Array(signature));
}

function getEnv(name: string): string | undefined {
  const value = Deno.env.get(name);
  return value && value.length > 0 ? value : undefined;
}

async function sendWhatsAppTemplateMessageEdge(input: {
  to: string;
  templateName: string;
  languageCode: string;
  bodyParameters: string[];
  headerParameters: string[];
}) {
  const accessToken =
    getEnv('WHATSAPP_CLOUD_ACCESS_TOKEN') || getEnv('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId =
    getEnv('WHATSAPP_CLOUD_PHONE_NUMBER_ID') ||
    getEnv('WHATSAPP_PHONE_NUMBER_ID');
  const apiVersion = getEnv('WHATSAPP_API_VERSION') || 'v20.0';

  if (!accessToken || !phoneNumberId) {
    return;
  }

  const normalizedLanguage =
    input.languageCode === 'en' ? 'en_US' : input.languageCode;

  const components: Array<{
    type: 'header' | 'body';
    parameters: Array<{ type: 'text'; text: string }>;
  }> = [];

  if (input.headerParameters.length > 0) {
    components.push({
      type: 'header',
      parameters: input.headerParameters.map((text) => ({ type: 'text', text })),
    });
  }

  if (input.bodyParameters.length > 0) {
    components.push({
      type: 'body',
      parameters: input.bodyParameters.map((text) => ({ type: 'text', text })),
    });
  }

  await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: input.to,
        type: 'template',
        template: {
          name: input.templateName,
          language: { code: normalizedLanguage },
          ...(components.length > 0 ? { components } : {}),
        },
      }),
    },
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    const allowedOrigin = getAllowedOrigin();
    
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, apikey, x-client-info',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      const allowedOrigin = getAllowedOrigin();
      
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowedOrigin,
          },
        },
      );
    }

    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (_e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const signature = req.headers.get('x-webhook-signature');
    const webhookSecret = getEnv('CASHFREE_WEBHOOK_SECRET');

    if (webhookSecret && signature) {
      const expected = await hmacSha256Hex(webhookSecret, rawBody);
      if (!timingSafeEqualHex(signature, expected)) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    const {
      order_id,
      order_status,
      payment_status,
      customer_details,
      order_amount,
      payment_session_id,
      transaction_id,
    } = body || {};

    const supabase = createSupabaseAdmin();
    const externalOrderId = String(order_id || '');

    if (!externalOrderId) {
      return new Response(JSON.stringify({ error: 'Missing order_id' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('external_order_id', externalOrderId)
      .maybeSingle();

    if (existingOrder) {
      const updateData = {
        status:
          payment_status === 'SUCCESS' || order_status === 'PAID'
            ? 'PAID'
            : order_status,
        payment_status: payment_status,
        transaction_id:
          transaction_id || payment_session_id || (existingOrder as any).transaction_id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', (existingOrder as any).id);

      if (error) throw error;
    } else {
      const newOrder = {
        external_order_id: externalOrderId,
        customer_name: customer_details?.customer_name || 'Customer',
        customer_phone: customer_details?.customer_phone || '',
        status:
          payment_status === 'SUCCESS' || order_status === 'PAID'
            ? 'PAID'
            : order_status,
        payment_status: payment_status,
        transaction_id: transaction_id || payment_session_id,
        total_amount: Number(order_amount),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('orders').insert(newOrder);
      if (error) throw error;
    }

    const { data: updatedOrderForPayment } = await supabase
      .from('orders')
      .select('id')
      .eq('external_order_id', externalOrderId)
      .maybeSingle();

    await supabase.from('payments').insert({
      order_id: updatedOrderForPayment?.id || null,
      provider: 'cashfree',
      status: payment_status,
      amount: Number(order_amount),
      currency: 'INR',
      session_id: payment_session_id,
      provider_order_id: externalOrderId,
      transaction_id: transaction_id,
      raw_response: body,
      created_at: new Date().toISOString(),
    });

    if (payment_status === 'SUCCESS' || order_status === 'PAID') {
      const toPhone =
        customer_details?.customer_phone ||
        getEnv('WHATSAPP_TEST_TO') ||
        getEnv('DEFAULT_TEST_WHATSAPP_TO');
      const templateName =
        getEnv('WHATSAPP_ORDER_TEMPLATE_NAME') || getEnv('WHATSAPP_TEMPLATE_NAME');
      const languageCode =
        getEnv('WHATSAPP_ORDER_TEMPLATE_LANGUAGE') ||
        getEnv('WHATSAPP_TEMPLATE_LANGUAGE') ||
        'en_US';

      if (toPhone && templateName) {
        const templateValues: Record<string, string> = {
          orderId: externalOrderId,
          totalCost: typeof order_amount !== 'undefined' ? String(order_amount) : '',
          customerName: customer_details?.customer_name || '',
          customerPhone: customer_details?.customer_phone || '',
        };

        const bodyKeys = (getEnv('WHATSAPP_ORDER_TEMPLATE_BODY_KEYS') ||
          getEnv('WHATSAPP_TEMPLATE_BODY_KEYS') ||
          'customerName,orderId,totalCost')
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);
        const headerKeys = (getEnv('WHATSAPP_ORDER_TEMPLATE_HEADER_KEYS') ||
          getEnv('WHATSAPP_TEMPLATE_HEADER_KEYS') ||
          '')
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);

        const bodyParameters = bodyKeys.map((key) => templateValues[key] || '');
        const headerParameters = headerKeys.map((key) => templateValues[key] || '');

        await sendWhatsAppTemplateMessageEdge({
          to: toPhone,
          templateName,
          languageCode,
          bodyParameters,
          headerParameters,
        });
      }
    }

    const allowedOrigin = getAllowedOrigin();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
      },
    });
  } catch (error) {
    const allowedOrigin = getAllowedOrigin();
    
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as any).message)
        : 'Webhook processing failed';

    return new Response(
      JSON.stringify({
        error: 'Webhook processing failed',
        details: message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
        },
      },
    );
  }
});
