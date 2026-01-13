
// This script simulates the entire Cashfree order and payment flow.
import crypto from 'crypto';
import https from 'https';
import path from 'path';
import dotenv from 'dotenv';

// --- Configuration ---
// Explicitly load .env.local from the project root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { 
    CASHFREE_WEBHOOK_SECRET,
    NEXT_PUBLIC_SUPPORT_PHONE_NUMBER
} = process.env;

// The base URL of your running Next.js application
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// --- Helper Functions ---

// Function to make HTTPS requests
function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data }); // Resolve with raw data if not JSON
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

// --- Main Test Flow ---

async function runTest() {
    if (!CASHFREE_WEBHOOK_SECRET || !NEXT_PUBLIC_SUPPORT_PHONE_NUMBER) {
        console.error('❌ ERROR: Missing required environment variables.');
        console.error('Script could not find CASHFREE_WEBHOOK_SECRET or NEXT_PUBLIC_SUPPORT_PHONE_NUMBER in .env.local');
        return;
    }

    console.log('🚀 Starting Cashfree E2E Test...');

    // 1. Define a sample order
    const orderId = `TEST-${Date.now()}`;
    const advanceAmount = 50.00; // Minimum advance amount
    const customerPhone = NEXT_PUBLIC_SUPPORT_PHONE_NUMBER.replace(/^91/, ''); // Use your own number for testing

    const orderPayload = {
        items: [{
            id: 'WOOOB01',
            name: 'Wooden Money Savings Box',
            price: 249,
            quantity: 2,
            image_url: 'https://woody.co.in/wp-content/uploads/2025/05/Money-Bank-1.webp'
        }],
        customerName: 'Test User',
        customerPhoneNumber: `91${customerPhone}`,
        customerAddress: '123 Test Avenue, Sandbox City, 110011',
        subtotal: 498,
        shippingCost: 50,
        totalCost: 548,
        advanceAmount: advanceAmount,
        orderId: orderId,
        returnUrl: `${BASE_URL}/order-confirmation`
    };

    try {
        // 2. Call the create-payment-link API to create the order in DB
        console.log(`
-- Step 1: Creating order ${orderId} in database...`);
        const createOrderOptions = {
            hostname: new URL(BASE_URL).hostname,
            port: new URL(BASE_URL).port || (BASE_URL.startsWith('https') ? 443 : 80),
            path: '/api/create-payment-link',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        };
        const createResponse = await makeRequest(createOrderOptions, JSON.stringify(orderPayload));

        if (createResponse.statusCode >= 400) {
            throw new Error(`Order creation failed with status ${createResponse.statusCode}: ${JSON.stringify(createResponse.body)}`);
        }
        console.log('✅ Order created successfully in DB (status: PENDING).');
        console.log(`   Order ID: ${createResponse.body.order_id}`);

        // 3. Simulate a successful payment webhook from Cashfree
        console.log(`
-- Step 2: Simulating 'SUCCESS' webhook for order ${orderId}...`);

        const webhookPayload = {
            data: {
                order: {
                    order_id: orderId,
                    order_amount: advanceAmount,
                    order_currency: 'INR'
                },
                payment: {
                    cf_payment_id: 12345678,
                    payment_status: 'SUCCESS',
                    payment_amount: advanceAmount,
                    payment_currency: 'INR',
                    payment_message: 'Transaction Success'
                },
                customer_details: {
                    customer_name: 'Test User',
                    customer_id: '123',
                    customer_email: 'test@example.com',
                    customer_phone: customerPhone
                }
            },
            event_time: new Date().toISOString(),
            type: 'PAYMENT_SUCCESS_WEBHOOK'
        };

        const webhookBody = JSON.stringify(webhookPayload);
        const signature = crypto.createHmac('sha256', CASHFREE_WEBHOOK_SECRET).update(webhookBody).digest('hex');

        const webhookOptions = {
            hostname: new URL(BASE_URL).hostname,
            port: new URL(BASE_URL).port || (BASE_URL.startsWith('https') ? 443 : 80),
            path: '/api/webhooks/cashfree',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-signature': signature,
            },
        };

        const webhookResponse = await makeRequest(webhookOptions, webhookBody);

        if (webhookResponse.statusCode !== 200 || !webhookResponse.body.success) {
            throw new Error(`Webhook call failed with status ${webhookResponse.statusCode}: ${JSON.stringify(webhookResponse.body)}`);
        }

        console.log('✅ Webhook processed successfully!');
        console.log('   - Order status should now be updated to PAID in Supabase.');
        console.log('   - WhatsApp confirmation message should have been sent.');
        console.log('   - Shiprocket order should have been created (if enabled).');

        console.log(`
🎉 E2E Test Completed Successfully! 🎉`);

    } catch (error) {
        console.error('\n❌ TEST FAILED: An error occurred.');
        console.error(error.message);
    }
}

runTest();
