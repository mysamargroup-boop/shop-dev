
// This file defines an API endpoint for checking the status of an order from Cashfree.

import { NextRequest, NextResponse } from 'next/server';

/**
 * Retrieves Cashfree API configuration based on the environment.
 * @returns {object} Cashfree configuration object.
 */
const getCashfreeConfig = () => {
  const env = (process.env.CASHFREE_ENV || 'SANDBOX').trim().toUpperCase();
  const baseUrl = env === 'PRODUCTION' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg';
  
  return {
    appId: (process.env.CASHFREE_APP_ID || '').trim(),
    secretKey: (process.env.CASHFREE_SECRET_KEY || '').trim(),
    baseUrl
  };
};

/**
 * Handles GET requests to fetch the status of an order from Cashfree.
 * @param {NextRequest} req The incoming request object.
 * @returns {NextResponse} A JSON response with the order status or an error message.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'Missing query param: order_id' }, { status: 400 });
    }

    const { appId, secretKey, baseUrl } = getCashfreeConfig();

    if (!appId || !secretKey) {
        throw new Error("Cashfree credentials missing");
    }

    const response = await fetch(`${baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: {
            'x-api-version': '2023-08-01',
            'x-client-id': appId,
            'x-client-secret': secretKey
        }
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('Cashfree API Error:', data);
        throw new Error(data.message || 'Failed to fetch order status');
    }

    return NextResponse.json({
      order_id: data.order_id,
      order_status: data.order_status,
      payment_session_id: data.payment_session_id || null,
      payments_url: data.payments?.url || null,
      ...data,
    });
  } catch (err: any) {
    const message = err.message || 'Unknown error';
    console.error('Order status check failed:', message);
    return NextResponse.json({ error: `Failed to fetch order status: ${message}` }, { status: 500 });
  }
}
