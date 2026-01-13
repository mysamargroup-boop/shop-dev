const fs = require('fs');
const https = require('https');

const HOSTNAME = 'atauvytuspdpwkzhilkb.supabase.co';
const SUPABASE_URL = `https://${HOSTNAME}`;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YXV2eXR1c3BkcHdremhpbGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTQzNDksImV4cCI6MjA4MzczMDM0OX0.QfQzv6Kx8rX2WHz6uFnVB4bvpBpHeh2cPb-4C13UHLc";

const TEST_NAME = 'samar';
const TEST_PHONE_10 = '8518024107';
const TEST_PHONE_CC = `91${TEST_PHONE_10}`;
const COUPON_CODE = 'SUMMER99';

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
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getDiscountPercentage(quantity, minQty) {
  if (quantity <= minQty) return 0;
  const additionalQty = quantity - minQty;
  const steps = Math.floor(additionalQty / 50);
  if (steps < 1) return 0;
  const baseDiscount = 2;
  const stepDiscount = 1;
  const maxDiscount = 7;
  const calculatedDiscount = baseDiscount + (steps - 1) * stepDiscount;
  return Math.min(calculatedDiscount, maxDiscount);
}

function makeTinyBase64Png() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABhQb8WQAAAABJRU5ErkJggg==';
}

async function main() {
  console.log('--- Simulating checkout like ProductDetailClient ---');
  const products = JSON.parse(fs.readFileSync('src/lib/products.json', 'utf-8'));
  const product = products.find(p => p.allowImageUpload) || products[0];
  if (!product) {
    console.error('No product found');
    process.exit(1);
  }

  const isKeychain = String(product.category || '').toLowerCase().includes('keychain');
  const minQuantity = isKeychain ? 100 : 25;
  const quantity = minQuantity + 50;
  const discountPercentage = getDiscountPercentage(quantity, minQuantity);
  const pricePerPiece = product.price * (1 - discountPercentage / 100);
  const discountedSubtotal = pricePerPiece * quantity;
  const freeShippingThreshold = 2999;
  const shippingCost = discountedSubtotal > freeShippingThreshold ? 0 : 99;
  const couponPercent = 99;
  const couponDiscount = Math.min(discountedSubtotal, discountedSubtotal * (couponPercent / 100));
  const finalTotal = Math.max(0, discountedSubtotal - couponDiscount) + shippingCost;
  const advanceAmount = Math.max(1, Number((finalTotal * 0.05).toFixed(2)));

  const items = [{
    id: product.id,
    name: product.name,
    quantity,
    price: pricePerPiece,
    imageUrl: product.imageUrl,
  }];

  const payload = {
    subtotal: discountedSubtotal,
    shippingCost,
    totalCost: finalTotal,
    advanceAmount,
    customerName: TEST_NAME,
    customerPhone: TEST_PHONE_CC,
    customerAddress: 'Test Colony, City',
    pincode: '452001',
    customerEmail: '',
    items,
    customImageUrls: [],
    couponCode: COUPON_CODE,
    couponDiscount,
    returnUrl: 'https://business.woody.co.in/order-confirmation',
  };

  console.log('Creating order with product:', product.name);
  const createRes = await post('/functions/v1/create-cashfree-order', payload);
  console.log('Create status:', createRes.status);
  console.log('Create data:', createRes.data);
  if (createRes.status !== 200 || !createRes.data?.order_id) {
    console.error('❌ Failed to create order');
    process.exit(1);
  }
  const orderId = createRes.data.order_id;

  console.log('Uploading custom images to order:', orderId);
  const base64Files = [makeTinyBase64Png(), makeTinyBase64Png()];
  const uploadRes = await post('/functions/v1/upload-images', { orderId, base64Files });
  console.log('Upload status:', uploadRes.status);
  console.log('Upload data:', uploadRes.data);
  if (uploadRes.status !== 200) {
    console.error('❌ Image upload failed');
  }

  console.log('Simulating payment webhook for WhatsApp confirmation...');
  const webhookPayload = {
    data: {
      order: {
        order_id: orderId,
        order_status: 'PAID',
        customer_details: { customer_name: TEST_NAME, customer_phone: TEST_PHONE_CC },
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

  console.log('\n✅ Checkout simulation complete.');
  console.log('Order ID:', orderId);
  console.log('WhatsApp should be sent to:', TEST_PHONE_CC);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

