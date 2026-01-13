
'use client';
import type { OrderItem } from './types';


export type InvoiceData = {
  customerName: string;
  customerAddress: string;
  productName: string;
  quantity: number;
  totalCost: number;
  advanceAmount: number;
  orderId: string;
  orderDate: string;
};

type PaymentInput = {
    productName: string;
    subtotal: number;
    shippingCost: number;
    totalCost: number;
    customerName: string;
    customerPhoneNumber: string;
    customerAddress: string;
    advanceAmount: number;
    items: OrderItem[];
    orderId?: string;
    customImageUrls?: string[];
    couponCode?: string;
    couponDiscount?: number;
};

const SUPABASE_FUNCTION_URL = 'https://atauvytuspdpwkzhilkb.supabase.co/functions/v1/create-cashfree-order';

async function getCashfreePaymentLink(orderId: string, input: PaymentInput, returnUrlBase: string) {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: input.advanceAmount, // The Edge function expects 'amount'
            customer_details: { // The Edge function expects 'customer_details'
                customer_id: `user_${Date.now()}`,
                customer_phone: input.customerPhoneNumber,
                customer_name: input.customerName,
                customer_email: 'customer@example.com' // You might want to collect this in your form
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create payment session');
    }

    return response.json();
}


export async function createPaymentLink(input: PaymentInput & { productUrls: string[] }) {
    const orderId = input.orderId || `WB-${Date.now()}`;
    
    // Use the whitelisted domain for production/testing, otherwise use current origin
    const isProd = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
    const returnUrlBase = isProd ? 'https://business.woody.co.in' : window.location.origin;

    // This function now returns { payment_session_id, order_id }
    const cashfreeData = await getCashfreePaymentLink(orderId, input, returnUrlBase);

    // The Cashfree SDK will use the session ID to open the payment modal.
    // The direct payment URL is not constructed here anymore.
    return {
        orderId: cashfreeData.order_id, // The order_id from cashfree
        payment_session_id: cashfreeData.payment_session_id,
        env: 'PROD', // Or dynamically set this based on your environment
    };
}
