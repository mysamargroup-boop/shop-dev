import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');

const orderId = `WB-${Date.now()}`;
const amount = 50; // minimal test advance amount
const customerName = 'Test User';
const customerPhone = '8518024107';
// Short return URL; server will append ?order_id={order_id}
const returnUrl = `${baseUrl}/order-confirmation`;

async function main() {
  if (!baseUrl) {
    console.error('Set NEXT_PUBLIC_BASE_URL in .env.local to your whitelisted domain');
    process.exit(1);
  }
  const apiUrl = `${baseUrl}/api/create-payment-link`;
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      amount,
      customerName,
      customerPhone,
      returnUrl,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error('Payment link creation failed:', data);
    process.exit(1);
  }

  console.log('Payment link created successfully:');
  console.log(JSON.stringify(data, null, 2));
  console.log(`OrderId: ${orderId}`);
  console.log(`Return URL: ${returnUrl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
