const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwjlatudbxmrdfiiagjk.supabase.co';
// Using Service Role Key for admin-level access testing
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3amxhdHVkYnhtcmRmaWlhZ2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY4MDMwMiwiZXhwIjoyMDgyMjU2MzAyfQ.uwm_PaXG4z7kYQXZ4Cd5lUhCv1DRruLhcDo5vHIdLXg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testDB() {
  console.log('Testing Supabase Connection...');
  
  // Test 1: Fetch Orders
  console.log('\n--- Fetching Recent Orders ---');
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (orderError) {
    console.error('Error fetching orders:', orderError);
  } else {
    console.log(`Successfully fetched ${orders.length} orders.`);
    if (orders.length > 0) {
        console.log('Sample Order:', {
            id: orders[0].id,
            customer: orders[0].customer_name,
            amount: orders[0].amount,
            status: orders[0].status
        });
    } else {
        console.log("No orders found in database.");
    }
  }

  // Test 2: Fetch Products (to verify prefix logic context)
  console.log('\n--- Fetching Recent Products ---');
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(3);

    if (productError) {
        console.error('Error fetching products:', productError);
    } else {
        console.log(`Successfully fetched ${products.length} products.`);
        products.forEach(p => console.log(`- ${p.id}: ${p.name}`));
    }
}

testDB();
