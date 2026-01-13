import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper to get Cashfree configuration from environment variables
const getCashfreeConfig = () => {
  const env = Deno.env.get('CASHFREE_ENV')?.trim().toUpperCase() || 'SANDBOX';
  return {
    env,
    baseUrl: env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg',
    appId: Deno.env.get('CASHFREE_APP_ID')?.trim(),
    secretKey: Deno.env.get('CASHFREE_SECRET_KEY')?.trim(),
  };
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { orderId, amount, customerName, customerPhone, customerEmail, returnUrl, items } = await req.json();

    const { appId, secretKey, baseUrl, env } = getCashfreeConfig();

    if (!appId || !secretKey) {
      throw new Error('Cashfree credentials missing in environment variables.');
    }
    if (!orderId || !amount || !customerPhone) {
      throw new Error('Missing required fields: orderId, amount, and customerPhone are required.');
    }
    
    // Create Supabase admin client to interact with the database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Save Order to Supabase in 'PENDING' state
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        external_order_id: String(orderId),
        customer_name: customerName || 'Customer',
        customer_phone: String(customerPhone),
        status: 'PENDING',
        payment_status: 'PENDING',
        total_amount: Number(amount),
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create order items if they exist
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        sku: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        image_url: item.imageUrl,
        image_hint: item.imageHint,
      }));
      const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;
    }

    // 3. Create Cashfree Order
    const requestBody = {
      order_id: String(orderId),
      order_amount: Number(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: String(customerPhone).replace(/[^a-zA-Z0-9_-]/g, ''),
        customer_phone: String(customerPhone),
        customer_name: customerName || 'Customer',
        customer_email: customerEmail || `customer-${Date.now()}@example.com`,
      },
      order_meta: {
        return_url: `${returnUrl}?order_id={order_id}`,
      },
    };

    const cashfreeResponse = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
      body: JSON.stringify(requestBody),
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      throw new Error(cashfreeData.message || 'Cashfree order creation failed');
    }

    // 4. Return successful response
    return new Response(JSON.stringify({
      order_id: cashfreeData.order_id,
      payment_session_id: cashfreeData.payment_session_id,
      env,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: 500,
    });
  }
});