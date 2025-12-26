const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(process.cwd(), '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase env');
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const orderInsert = {
    external_order_id: 'WB-TEST-' + Date.now(),
    customer_name: 'Test User',
    customer_phone: '8518024107',
    customer_address: 'Test Address',
    status: 'PENDING',
    subtotal_amount: 100.0,
    shipping_cost: 20.0,
    total_amount: 120.0,
  };
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert(orderInsert)
    .select()
    .single();
  if (orderErr) throw orderErr;
  console.log('Order inserted:', order.id);

  const paymentInsert = {
    order_id: order.id,
    provider: 'cashfree',
    status: 'SUCCESS',
    amount: 120.0,
    currency: 'INR',
    session_id: 'sess_' + Date.now(),
    provider_order_id: order.external_order_id,
  };
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert(paymentInsert)
    .select()
    .single();
  if (payErr) throw payErr;
  console.log('Payment inserted:', payment.id);

  const { data: fetched, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order.id)
    .single();
  if (fetchErr) throw fetchErr;
  console.log('Fetched order status:', fetched.status);
}

main().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
