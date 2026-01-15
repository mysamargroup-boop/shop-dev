const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase env NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function testFunction(name, options) {
  try {
    const { data, error } = await client.functions.invoke(name, options || {});
    if (error) {
      console.error(`[${name}] ERROR:`, error.message || error);
    } else {
      const preview =
        typeof data === 'object' ? JSON.stringify(data).slice(0, 200) : String(data);
      console.log(`[${name}] OK:`, preview);
    }
  } catch (e) {
    console.error(`[${name}] EXCEPTION:`, e.message || e);
  }
}

(async () => {
  const orderId = `TEST-${Date.now()}`;

  await testFunction('create-order', {
    body: {
      orderId,
      amount: 1,
      customerName: 'Test User',
      customerPhone: '9999999999',
      customerEmail: 'test@example.com',
      returnUrl: 'https://example.com/order-confirmation',
      items: [],
    },
  });

  await testFunction('order-status', {
    body: { orderId },
  });

  await testFunction('orders-admin', {
    body: { action: 'list' },
  });

  await testFunction('categories', { body: { action: 'list' } });
  await testFunction('products-admin', { body: { action: 'list' } });
  await testFunction('site-settings', { body: { action: 'get' } });
  await testFunction('subscriptions', { body: { action: 'list' } });
  await testFunction('lead-analytics', { body: {} });

  process.exit(0);
})();
