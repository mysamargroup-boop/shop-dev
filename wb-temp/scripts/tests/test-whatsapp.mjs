import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
const to = process.env.TEST_WHATSAPP_TO || '919999999999';
const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';

async function main() {
  if (!baseUrl) {
    console.error('Set NEXT_PUBLIC_BASE_URL in .env.local to your whitelisted domain');
    process.exit(1);
  }
  const apiUrl = `${baseUrl}/api/whatsapp/send-template`;
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      templateName,
      languageCode,
      bodyParameters: ['Test User', 'WB-TEST-ORDER', 'Sample Product', '25x', 'Address', '₹2999.00'],
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error('❌ WhatsApp send failed:', data);
    process.exit(1);
  }
  console.log('✅ WhatsApp template sent successfully:');
  console.log(JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

