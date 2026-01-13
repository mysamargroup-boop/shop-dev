// Simple Node script to POST a sample Cashfree webhook payload to local Next server
// Usage: node scripts/test-webhook.js
const http = require('http');

const payload = {
  order_id: `WB-MOCK-${Date.now()}`,
  order_status: 'PAID',
  payment_status: 'SUCCESS',
  order_amount: 1,
  customer_details: {
    customer_name: 'Test Customer',
    customer_phone: process.env.TEST_WHATSAPP_TO || process.env.WHATSAPP_TEST_TO || '919999999999',
  },
};

const data = JSON.stringify(payload);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhooks/cashfree',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    // In sandbox manual test, no signature header is set; route handles missing signature gracefully
  },
};

console.log('Posting sample webhook to http://localhost:3000/api/webhooks/cashfree');
const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    try {
      console.log('Response body:', JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      console.log('Response body:', body);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
});

req.write(data);
req.end();

