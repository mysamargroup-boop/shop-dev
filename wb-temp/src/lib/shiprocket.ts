
'use server';

import { getSiteSettings } from "./actions";

const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in/v1/external';

async function getShiprocketToken() {
    const settings = await getSiteSettings();
    const email = settings.shiprocket_api_email || process.env.SHIPROCKET_API_EMAIL;
    const password = settings.shiprocket_api_password || process.env.SHIPROCKET_API_PASSWORD;

    if (!email || !password) {
        throw new Error('Shiprocket API credentials are not configured.');
    }

    const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok || !data.token) {
        throw new Error('Shiprocket authentication failed.');
    }
    return data.token;
}

interface ShiprocketOrderItem {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    hsn?: number;
}

interface CreateOrderParams {
    order_id: string;
    order_date: string;
    billing_customer_name: string;
    billing_last_name: string;
    billing_address: string;
    billing_city: string;
    billing_pincode: string;
    billing_state: string;
    billing_country: string;
    billing_email: string;
    billing_phone: string;
    shipping_is_billing: boolean;
    order_items: ShiprocketOrderItem[];
    payment_method: 'Prepaid' | 'COD';
    sub_total: number;
    length: number;
    breadth: number;
    height: number;
    weight: number;
}


export async function createShiprocketOrder(params: CreateOrderParams) {
    const token = await getShiprocketToken();

    const response = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('Shiprocket API Error:', data);
        throw new Error(data.message || 'Failed to create Shiprocket order.');
    }

    return data;
}
