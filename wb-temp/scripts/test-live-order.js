const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://atauvytuspdpwkzhilkb.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YXV2eXR1c3BkcHdremhpbGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTQzNDksImV4cCI6MjA4MzczMDM0OX0.QfQzv6Kx8rX2WHz6uFnVB4bvpBpHeh2cPb-4C13UHLc";

const FUNCTION_PATH = '/functions/v1/create-cashfree-order';
const HOSTNAME = 'atauvytuspdpwkzhilkb.supabase.co';

const payload = {
    orderId: `test_order_${Date.now()}`,
    subtotal: 100,
    shippingCost: 0,
    totalCost: 100,
    advanceAmount: 5,
    customerName: 'Node Live Tester',
    customerPhone: '919876543210',
    customerAddress: '123 Test Lane',
    pincode: '123456',
    items: [
        { id: 'test_item_1', name: 'Test Product', quantity: 1, price: 100, imageUrl: 'https://via.placeholder.com/150' }
    ],
    customImageUrls: [],
    couponCode: '',
    couponDiscount: 0,
    returnUrl: 'https://business.woody.co.in/order-confirmation'
};

console.log("--- Starting Live Order Test (Using HTTPS) ---");
console.log("Target:", `https://${HOSTNAME}${FUNCTION_PATH}`);

const options = {
  hostname: HOSTNAME,
  port: 443,
  path: FUNCTION_PATH,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
};

const req = https.request(options, (res) => {
  console.log('Response Status:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
        console.log('Response Body:', data);
        const parsedData = JSON.parse(data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log("\n✅ Test PASSED: Order created successfully.");
            console.log("Check your Supabase 'orders' table for customerName: 'Node Live Tester'");
        } else {
            console.log("\n❌ Test FAILED: Non-2xx response.");
        }
    } catch (e) {
        console.log("Response (Raw):", data);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Request Error: ${e.message}`);
});

req.write(JSON.stringify(payload));
req.end();