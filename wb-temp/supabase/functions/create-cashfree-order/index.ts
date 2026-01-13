
// supabase/functions/create-order/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      subtotal,
      shippingCost,
      totalCost, 
      advanceAmount, 
      customerName, 
      customerPhone, 
      customerAddress,
      pincode,
      items,
      couponCode,
      couponDiscount,
      customerEmail: bodyEmail, // future email field
    } = body;

    // Basic validation
    if (!customerName || !customerPhone || !customerAddress || !items?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, phone, address, and items are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Clean and format phone number
    let cleanedPhone = String(customerPhone).replace(/[^0-9]/g, "");
    
    // Handle 12 digit numbers starting with 91 (e.g. from WhatsAppCheckoutModal)
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) {
      cleanedPhone = cleanedPhone.substring(2);
    }

    if (cleanedPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format. Must be 10 digits.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const customerPhoneWithCountryCode = `91${cleanedPhone}`;

    const subtotalNum = Number(subtotal || 0);
    const shippingCostNum = Number(shippingCost || 0);
    const totalCostNum = Number(totalCost || 0);
    const advanceAmountNum = Math.max(1, Number(advanceAmount || 1));
    const couponDiscountNum = Number(couponDiscount || 0);
    const orderItems = Array.isArray(items) ? items : [];

    // Initialize Supabase
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const orderId = `WB-${Date.now()}`;
    console.log('Creating order:', orderId);

    // Insert into orders table
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        customer_name: customerName,
        customer_phone: customerPhoneWithCountryCode,
        customer_address: pincode ? `${customerAddress}, ${pincode}` : customerAddress,
        // customer_pincode: pincode, // Removed as column does not exist
        status: "PENDING",
        payment_status: "PENDING",
      });

    if (orderError) throw new Error(`Database error (orders): ${orderError.message}`);

    // Insert into order_details table
    const { error: detailsError } = await supabaseAdmin
      .from('order_details')
      .insert({
        order_id: orderId,
        order_items: orderItems,
        subtotal: subtotalNum,
        shipping_cost: shippingCostNum,
        total_amount: totalCostNum,
        advance_amount: advanceAmountNum,
        remaining_amount: totalCostNum - advanceAmountNum,
        coupon_code: couponCode || null,
        discount_amount: couponDiscountNum,
      });

    if (detailsError) throw new Error(`Database error (order_details): ${detailsError.message}`);

    console.log('Order saved to database');

    // Cashfree setup
    const CASHFREE_APP_ID = Deno.env.get("CASHFREE_APP_ID") ?? "";
    const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY") ?? "";
    const CASHFREE_ENV = (Deno.env.get("CASHFREE_ENV") ?? "SANDBOX").toUpperCase();

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      throw new Error("Cashfree credentials not configured");
    }

    const CASHFREE_API_URL = CASHFREE_ENV === 'PRODUCTION'
      ? "https://api.cashfree.com/pg/orders"
      : "https://sandbox.cashfree.com/pg/orders";

    const returnUrlBase = CASHFREE_ENV === 'PRODUCTION' 
      ? "https://business.woody.co.in" 
      : "http://localhost:3000";
    const finalReturnUrl = `${returnUrlBase}/order-confirmation`;

    console.log('Creating Cashfree payment session');

    const customerId = `WB_${cleanedPhone}_${Date.now()}`.slice(0, 50);
    const customerEmail = bodyEmail?.trim() || `${cleanedPhone}@woody.co.in`;

    const cashfreeBody = {
      order_id: orderId,
      order_amount: advanceAmountNum,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId,
        customer_phone: customerPhoneWithCountryCode,
        customer_name: customerName,
        customer_email: customerEmail,
      },
      order_meta: {
        return_url: `${finalReturnUrl}?order_id={order_id}`,
      },
    };

    const cashfreeResponse = await fetch(CASHFREE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(cashfreeBody),
    });

    if (!cashfreeResponse.ok) {
      const errorBody = await cashfreeResponse.json().catch(() => ({ message: 'Failed to parse Cashfree error' }));
      console.error('Cashfree error:', errorBody);
      throw new Error(`Payment gateway error: ${errorBody.message || 'Unknown error'}`);
    }

    const orderData = await cashfreeResponse.json();
    console.log('Cashfree response:', orderData);

    if (!orderData.payment_session_id) throw new Error('Cashfree session creation failed');

    const { error: txUpdateError } = await supabaseAdmin
      .from('order_details')
      .update({ transaction_id: orderData.payment_session_id })
      .eq('order_id', orderId);

    if (txUpdateError) console.warn('Transaction ID update failed:', txUpdateError.message);

    return new Response(
      JSON.stringify({ 
        success: true,
        payment_session_id: orderData.payment_session_id,
        order_id: orderId,
        payment_link: orderData.payment_link || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: err.message || 'Internal server error' 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
