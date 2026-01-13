
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

import { supabase } from './supabase';

async function getCashfreePaymentLink(orderId: string, amount: number, customerName: string, customerPhone: string, returnUrl: string, items: OrderItem[]) {
    const { data, error } = await supabase().functions.invoke('create-order', {
        body: { orderId, amount, customerName, customerPhone, returnUrl, items }
    });

    if (error) {
        console.error("Supabase Function Error:", error);
        throw new Error(error.message || 'Failed to create payment link');
    }

    return data;
}


export async function createPaymentLink(input: PaymentInput & { productUrls: string[] }) {
    const orderId = `WB-${Date.now()}`;
    const amount = Math.max(1, parseFloat(input.advanceAmount.toFixed(2))); // Ensure minimum of 1
    
    // Keep return_url short to satisfy Cashfree's max URL length constraints
    const returnUrl = `${window.location.origin}/order-confirmation`;
    
    const paymentData: any = await getCashfreePaymentLink(
        orderId,
        amount,
        input.customerName,
        input.customerPhoneNumber,
        returnUrl,
        input.items,
    );

    return {
        orderId: orderId,
        payment_url: paymentData.payments?.url || paymentData.payment_link || null,
        payment_session_id: paymentData.payment_session_id || null,
    };
}
