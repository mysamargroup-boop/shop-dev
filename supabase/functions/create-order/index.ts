import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper to get allowed origin from environment
const getAllowedOrigin = () => {
  const publicUrl = Deno.env.get('PUBLIC_URL');
  const allowedUrl = Deno.env.get('ALLOWED_ORIGIN');
  return publicUrl || allowedUrl || 'http://localhost:3000';
};

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
    const origin = req.headers.get('origin');
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
    const { orderId, amount, customerName, customerPhone, customerEmail, returnUrl, items, couponCode, extraNote } = await req.json();

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

    // IDEMPOTENCY CHECK: Check if order already exists
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_status, total_amount')
      .eq('external_order_id', String(orderId))
      .single();

    if (existingOrder) {
      // Return existing order data instead of creating duplicate
      const allowedOrigin = getAllowedOrigin();
      
      return new Response(JSON.stringify({
        order_id: existingOrder.external_order_id,
        payment_session_id: null, // Don't expose payment session for existing orders
        env,
        existing: true,
        status: existingOrder.status,
        payment_status: existingOrder.payment_status,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        status: 200,
      });
    }

    // SECURITY: Calculate total amount from database instead of trusting client
    let calculatedTotalAmount = 0;
    let validatedItems = [];
    
    if (items && items.length > 0) {
      // Fetch product prices from database
      const productIds = items.map((item: any) => item.id).filter(Boolean);
      
      if (productIds.length > 0) {
        const { data: products, error: productError } = await supabaseAdmin
          .from('products')
          .select('id, price, name')
          .in('id', productIds);
          
        if (productError) {
          throw new Error('Failed to fetch product prices');
        }
        
        // Create product lookup map
        const productMap = new Map(
          products?.map((product: any) => [product.id, product]) || []
        );
        
        // Validate items and calculate total
        validatedItems = items.map((item: any) => {
          const product = productMap.get(item.id);
          if (!product) {
            throw new Error(`Product with ID ${item.id} not found`);
          }
          
          const quantity = Number(item.quantity) || 1;
          const unitPrice = Number(product.price);
          const totalPrice = unitPrice * quantity;
          
          calculatedTotalAmount += totalPrice;
          
          return {
            product_id: item.id,
            product_name: product.name,
            sku: item.id,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            image_url: item.imageUrl,
            image_hint: item.imageHint,
          };
        });
      }
    }
    
    // Use calculated amount or fallback to client amount (minimum validation)
    const finalAmount = calculatedTotalAmount > 0 ? calculatedTotalAmount : Number(amount);
    if (finalAmount <= 0) {
      throw new Error('Invalid order amount');
    }
    // 1. Save Order to Supabase in 'PENDING' state
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        external_order_id: String(orderId),
        customer_name: customerName || 'Customer',
        customer_phone: String(customerPhone),
        status: 'PENDING',
        payment_status: 'PENDING',
        total_amount: finalAmount, // Use validated amount
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create order items using validated data
    if (validatedItems.length > 0) {
      const orderItems = validatedItems.map((item) => ({
        order_id: orderData.id,
        ...item,
      }));
      const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;
    }

    // 3. Create Cashfree order
    const requestBody = {
      order_id: orderId,
      order_amount: finalAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: String(customerPhone).replace(/[^a-zA-Z0-9_-]/g, ''),
        customer_name: customerName,
        customer_email: customerEmail || `customer-${Date.now()}@example.com`,
        customer_phone: String(customerPhone),
      },
      order_meta: {
        return_url: `${returnUrl}?order_id=${orderId}`,
        notify_url: `${getAllowedOrigin()}/api/webhooks/cashfree`,
      },
      order_note: extraNote || '',
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

    // 4. Track coupon usage if coupon was applied
    if (couponCode) {
      try {
        await supabaseAdmin
          .from('coupon_redemptions')
          .insert({
            order_id: orderData.id,
            coupon_code: couponCode.toUpperCase(),
            discount_amount: 0, // No discount amount provided in the request
          });
      } catch (couponError) {
        console.error('Failed to track coupon redemption:', couponError);
        // Don't fail the order if coupon tracking fails
      }
    }

    // 4. Return successful response
    const allowedOrigin = getAllowedOrigin();
    
    return new Response(JSON.stringify({
      order_id: cashfreeData.order_id,
      payment_session_id: cashfreeData.payment_session_id,
      env,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: 200,
    });

  } catch (error) {
    const allowedOrigin = getAllowedOrigin();
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: 500,
    });
  }
});
