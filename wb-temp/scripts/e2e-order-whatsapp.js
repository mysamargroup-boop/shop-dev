const https = require('https');

const HOSTNAME = 'atauvytuspdpwkzhilkb.supabase.co';
const SUPABASE_URL = `https://${HOSTNAME}`;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YXV2eXR1c3BkcHdremhpbGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTQzNDksImV4cCI6MjA4MzczMDM0OX0.QfQzv6Kx8rX2WHz6uFnVB4bvpBpHeh2cPb-4C13UHLc";

const TEST_NAME = 'samar';
const TEST_PHONE_10 = '8518024107';
const TEST_PHONE_CC = `91${TEST_PHONE_10}`;

function post(path, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: HOSTNAME,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('--- E2E: Create order, trigger webhook, send WhatsApp ---');
  // 1) Create order
  const createPayload = {
    subtotal: 999,
    shippingCost: 99,
    totalCost: 1098,
    advanceAmount: 55,
    customerName: TEST_NAME,
    customerPhone: TEST_PHONE_CC,
    customerAddress: 'Test Colony, City',
    pincode: '452001',
    // leave email empty to test default email behavior
    customerEmail: '',
    items: [
      { id: 'test_product_1', name: 'Random Product', quantity: 1, price: 999, imageUrl: 'https://picsum.photos/seed/product/200' },
    ],
    customImageUrls: [],
    couponCode: '',
    couponDiscount: 0,
    returnUrl: 'https://business.woody.co.in/order-confirmation',
  };
  const createRes = await post('/functions/v1/create-cashfree-order', createPayload);
  console.log('Create status:', createRes.status);
  console.log('Create data:', createRes.data);
  if (createRes.status !== 200 || !createRes.data?.order_id) {
    console.error('❌ Failed to create order');
    process.exit(1);
  }
  const orderId = createRes.data.order_id;

  // 2) Simulate payment webhook
  const webhookPayload = {
    data: {
      order: {
        order_id: orderId,
        order_status: 'PAID',
        customer_details: {
          customer_name: TEST_NAME,
          customer_phone: TEST_PHONE_CC,
        },
      },
    },
  };
  const webhookRes = await post('/functions/v1/cashfree-webhook-handler', webhookPayload);
  console.log('Webhook status:', webhookRes.status);
  console.log('Webhook data:', webhookRes.data);
  if (webhookRes.status !== 200) {
    console.error('❌ Webhook processing failed');
    process.exit(1);
  }

  console.log('\n✅ E2E flow executed. WhatsApp template should be sent to:', TEST_PHONE_CC);
  console.log('Order ID:', orderId);
  console.log('Note: Actual payment gateway modal requires browser; webhook simulates post-payment.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

