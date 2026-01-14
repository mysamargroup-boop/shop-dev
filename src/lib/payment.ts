
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
    totalCost: number;
    customerName: string;
    customerPhoneNumber: string;
    customerAddress: string;
    advanceAmount: number;
    items: OrderItem[];
};


async function createServerPaymentLink(payload: any) {
  const response = await fetch('/api/create-payment-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create payment link');
  }
  
  return data;
}


export async function createPaymentLink(input: PaymentInput & { productUrls: string[] }) {
    const orderId = `WB-${Date.now()}`;
    const amount = Math.max(1, parseFloat(input.advanceAmount.toFixed(2))); // Ensure minimum of 1
    
    const returnUrl = `${window.location.origin}/order-confirmation`;
    
    const paymentData: any = await createServerPaymentLink({
        orderId,
        amount,
        customerName: input.customerName,
        customerPhone: input.customerPhoneNumber,
        returnUrl: returnUrl,
        items: input.items,
    });

    return {
        orderId: orderId,
        payment_url: paymentData.payments?.url || paymentData.payment_link || null,
        payment_session_id: paymentData.payment_session_id || null,
        env: paymentData.env || 'SANDBOX',
    };
}
