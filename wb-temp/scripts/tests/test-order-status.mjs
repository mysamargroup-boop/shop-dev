import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
const orderId = process.argv[2] || process.env.TEST_ORDER_ID;

async function main() {
  if (!baseUrl) {
    console.error('Set NEXT_PUBLIC_BASE_URL in .env.local to your whitelisted domain');
    process.exit(1);
  }
  if (!orderId) {
    console.error('Pass orderId as argv or set TEST_ORDER_ID in env');
    process.exit(1);
  }
  const apiUrl = `${baseUrl}/api/order-status?order_id=${encodeURIComponent(orderId)}`;
  const res = await fetch(apiUrl, { method: 'GET' });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error('❌ Order status failed:', data);
    process.exit(1);
  }
  console.log('✅ Order status fetched successfully:');
  console.log(JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

