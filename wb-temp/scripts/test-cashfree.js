
const https = require('https');

const config = {
    appId: (process.env.CASHFREE_APP_ID || '').trim(),
    secretKey: (process.env.CASHFREE_SECRET_KEY || '').trim(),
    env: (process.env.CASHFREE_ENV || 'SANDBOX').trim().toUpperCase()
};

if (!config.appId || !config.secretKey) {
    console.error('❌ Error: CASHFREE_APP_ID and CASHFREE_SECRET_KEY must be set in your environment variables.');
    process.exit(1);
}

const baseUrl = config.env === 'PRODUCTION' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg';

const orderId = `WB-TEST-${Date.now()}`;
const customerPhone = '9999999999';
const sanitizedCustomerId = String(customerPhone).replace(/[^a-zA-Z0-9_-]/g, '');

const requestData = JSON.stringify({
    order_amount: 1,
    order_currency: 'INR',
    order_id: orderId,
    customer_details: {
        customer_id: sanitizedCustomerId,
        customer_phone: customerPhone,
        customer_name: "Test Customer",
        customer_email: 'test@example.com'
    },
    order_meta: {
        return_url: `http://localhost:3000/order-confirmation?order_id={order_id}`
    }
});

const options = {
    hostname: new URL(baseUrl).hostname,
    path: new URL(baseUrl).pathname + '/orders',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': config.appId,
        'x-client-secret': config.secretKey
    }
};

console.log(`Testing Cashfree API (${config.env})...`);
console.log('URL:', `${baseUrl}/orders`);
console.log('Request Data:', requestData);

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\nResponse Status:', res.statusCode);
        try {
            const parsedData = JSON.parse(data);
            console.log('Response Data:', JSON.stringify(parsedData, null, 2));
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('\n✅ Payment Link Created Successfully!');
                if (parsedData.payment_link) {
                    console.log(`\n🔗 Payment URL: ${parsedData.payment_link}`);
                }
            } else {
                console.log('\n❌ Failed to create payment link.');
            }
        } catch (e) {
            console.log('Raw Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.write(requestData);
req.end();
