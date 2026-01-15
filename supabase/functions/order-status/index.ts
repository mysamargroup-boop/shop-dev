import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

type CashfreeConfig = {
  appId: string | undefined;
  secretKey: string | undefined;
  baseUrl: string;
};

function getCashfreeConfig(): CashfreeConfig {
  const env = Deno.env.get('CASHFREE_ENV')?.trim().toUpperCase() || 'SANDBOX';
  const baseUrl =
    env === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

  return {
    appId: Deno.env.get('CASHFREE_APP_ID')?.trim(),
    secretKey: Deno.env.get('CASHFREE_SECRET_KEY')?.trim(),
    baseUrl,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, apikey, x-client-info',
      },
    });
  }

  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    const url = new URL(req.url);
    let orderId =
      url.searchParams.get('order_id') || url.searchParams.get('orderId');

    if (!orderId && req.method === 'POST') {
      const body = (await req.json().catch(() => null)) as
        | { orderId?: string; order_id?: string }
        | null;
      orderId =
        (body && (body.orderId || body.order_id) ? String(body.orderId || body.order_id) : null) ||
        null;
    }

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing query param: order_id' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    const { appId, secretKey, baseUrl } = getCashfreeConfig();

    if (!appId || !secretKey) {
      throw new Error('Cashfree credentials missing');
    }

    const response = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const message =
        (data && (data.message || data.error)) ||
        'Failed to fetch order status';
      throw new Error(message);
    }

    const result = {
      order_id: data.order_id,
      order_status: data.order_status,
      payment_session_id: data.payment_session_id || null,
      payments_url: data.payments?.url || null,
      ...data,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as any).message)
        : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: `Failed to fetch order status: ${message}`,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }
});
