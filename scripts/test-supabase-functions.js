
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwjlatudbxmrdfiiagjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3amxhdHVkYnhtcmRmaWlhZ2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY4MDMwMiwiZXhwIjoyMDgyMjU2MzAyfQ.uwm_PaXG4z7kYQXZ4Cd5lUhCv1DRruLhcDo5vHIdLXg';

async function testSupabaseFunctions() {
  console.log('Testing Supabase Edge Functions...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Fetch a real product to use
  const { data: products } = await supabase.from('products').select('id, name, price').limit(1);
  const product = products && products.length > 0 ? products[0] : null;

  if (!product) {
      console.error("No products found in database to test with.");
      return;
  }
  
  console.log(`Using product: ${product.name} (${product.id})`);

  const orderId = `TEST-${Date.now()}`;
  const payload = {
    orderId: orderId,
    amount: 1.00,
    customerName: "Test User",
    customerPhone: "9999999999",
    customerEmail: "test@example.com",
    returnUrl: "https://example.com/return",
    items: [
      {
        id: product.id,
        name: product.name,
        quantity: 1,
        price: 1.00,
        imageUrl: "https://example.com/image.jpg",
        imageHint: "Test Hint"
      }
    ]
  };

  console.log(`\n--- Invoking 'create-order' function for Order ID: ${orderId} ---`);
  
  // Direct fetch to the function URL
  const functionUrl = `${SUPABASE_URL}/functions/v1/create-order`;
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Function Error:', data);
    } else {
      console.log('Function Success:', data);
      console.log('Payment Link:', data.payment_link || data.payments?.url);
    }

  } catch (error) {
    console.error('Network/Script Error:', error);
  }
}

testSupabaseFunctions();
