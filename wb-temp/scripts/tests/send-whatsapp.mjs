export { };
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
const apiVersion = process.env.WHATSAPP_CLOUD_API_VERSION || 'v20.0';

if (!accessToken) {
  console.error('Missing env: WHATSAPP_CLOUD_ACCESS_TOKEN (or WHATSAPP_ACCESS_TOKEN)');
  process.exit(1);
}

if (!phoneNumberId) {
  console.error('Missing env: WHATSAPP_CLOUD_PHONE_NUMBER_ID (or WHATSAPP_PHONE_NUMBER_ID)');
  process.exit(1);
}

const to = process.argv[2];
const body = process.argv.slice(3).join(' ');

if (!to || !body) {
  console.error('Usage: node scripts/tests/send-whatsapp.mjs <toE164WithoutPlus> <message>');
  console.error('Example: node scripts/tests/send-whatsapp.mjs 9198XXXXXXXX "Hello from Node"');
  process.exit(1);
}

const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      body,
      preview_url: false,
    },
  }),
});

const data = await response.json().catch(() => null);

if (!response.ok) {
  console.error('WhatsApp API call failed');
  console.error('HTTP:', response.status, response.statusText);
  console.error('Body:', JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log('WhatsApp API call success');
console.log(JSON.stringify(data, null, 2));
