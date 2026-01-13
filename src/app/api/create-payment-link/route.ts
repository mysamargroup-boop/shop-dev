import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const getCashfreeConfig = () => {
  const env = (process.env.CASHFREE_ENV || "SANDBOX").trim().toUpperCase();

  return {
    env,
    baseUrl:
      env === "PRODUCTION"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg",
    appId: process.env.CASHFREE_APP_ID?.trim(),
    secretKey: process.env.CASHFREE_SECRET_KEY?.trim(),
  };
};

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, customerName, customerPhone, customerEmail, returnUrl, items } =
      await req.json();

    const { appId, secretKey, baseUrl, env } = getCashfreeConfig();

    if (!appId || !secretKey) {
      return NextResponse.json(
        { error: "Cashfree credentials missing" },
        { status: 500 }
      );
    }

    if (!orderId || !amount || !customerPhone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save Order to Supabase (Pending State)
    try {
      const supabase = supabaseAdmin();
      
      const newOrder = {
        external_order_id: String(orderId),
        customer_name: customerName || "Customer",
        customer_phone: String(customerPhone),
        status: "PENDING",
        payment_status: "PENDING",
        total_amount: Number(amount),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(newOrder)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
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
          image_hint: item.imageHint
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

    } catch (saveError) {
        console.error("Failed to save order to Supabase:", saveError);
        return NextResponse.json(
          { error: "Failed to save order" },
          { status: 500 }
        );
    }

    const requestBody = {
      order_id: String(orderId),
      order_amount: Number(amount),
      order_currency: "INR",

      customer_details: {
        customer_id: String(customerPhone).replace(/[^a-zA-Z0-9_-]/g, ""),
        customer_phone: String(customerPhone),
        customer_name: customerName || "Customer",
        customer_email: customerEmail || "customer@example.com",
      },

      order_meta: {
        return_url: `${returnUrl}?order_id={order_id}`,
      },
    };

    const response = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Cashfree order creation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      order_id: data.order_id,
      payment_session_id: data.payment_session_id,
      env,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}