const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = process.env.CASHFREE_SECRET_KEY;
const webhookUrl = `${supabaseUrl}/functions/v1/payment-webhook`;

if (!supabaseUrl || !supabaseKey || !secretKey) {
  console.error('Error: Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhook() {
  console.log('Testing Payment Webhook...');

  // 1. Create a Test Order
  const orderId = `TEST-ORDER-${Date.now()}`;
  const amount = 100.00;
  
  console.log(`Creating test order: ${orderId}`);
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      external_order_id: orderId,
      customer_name: 'Test Webhook User',
      customer_phone: '9999999999',
      status: 'PENDING',
      payment_status: 'PENDING',
      total_amount: amount
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating test order:', error);
    return;
  }
  console.log('Test order created (PENDING).');

  // 2. Prepare Webhook Payload
  const payload = {
    data: {
      order: {
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        order_status: 'PAID'
      },
      payment: {
        cf_payment_id: `PAY-${Date.now()}`,
        payment_status: 'SUCCESS',
        payment_amount: amount,
        payment_currency: 'INR',
        payment_message: 'Transaction Successful',
        payment_time: new Date().toISOString()
      },
      customer_details: {
        customer_name: 'Test Webhook User',
        customer_id: 'test-user',
        customer_email: 'test@example.com',
        customer_phone: '9999999999'
      }
    },
    event_time: new Date().toISOString(),
    type: 'PAYMENT_SUCCESS_WEBHOOK'
  };

  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // 3. Generate Signature
  // Signature = Base64(HMAC-SHA256(timestamp + rawBody, secretKey))
  const data = timestamp + rawBody;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('base64');

  console.log('Sending webhook request...');
  console.log(`URL: ${webhookUrl}`);
  
  // 4. Send Request
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
        'x-webhook-timestamp': timestamp
      },
      body: rawBody
    });

    const responseText = await response.text();
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Body: ${responseText}`);

    if (response.ok) {
        console.log('Webhook call successful.');
        
        // 5. Verify Order Update
        console.log('Verifying order status in database...');
        // Wait a bit for async processing
        await new Promise(r => setTimeout(r, 2000));
        
        const { data: updatedOrder, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('external_order_id', orderId)
            .single();
            
        if (fetchError) {
            console.error('Error fetching updated order:', fetchError);
        } else {
            console.log(`Order Status: ${updatedOrder.status}`);
            console.log(`Payment Status: ${updatedOrder.payment_status}`);
            console.log(`Transaction ID: ${updatedOrder.transaction_id}`);
            
            if (updatedOrder.status === 'PAID') {
                console.log('✅ TEST PASSED: Order updated to PAID.');
            } else {
                console.log('❌ TEST FAILED: Order status not updated.');
            }
        }
        
        // Check payments table
        const { data: paymentRecord } = await supabase
            .from('payments')
            .select('*')
            .eq('transaction_id', payload.data.payment.cf_payment_id)
            .single();
            
        if (paymentRecord) {
            console.log('✅ TEST PASSED: Payment record created.');
        } else {
            console.log('❌ TEST FAILED: Payment record not found.');
        }

    } else {
        console.error('❌ Webhook call failed.');
    }

  } catch (e) {
      console.error('Error sending request:', e);
  }
  
  // Cleanup
  console.log('Cleaning up...');
  await supabase.from('orders').delete().eq('external_order_id', orderId);
  // Payments cascade delete usually, or manual cleanup
}

testWebhook();
