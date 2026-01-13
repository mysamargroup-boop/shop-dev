
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if available, or just use placeholders/hardcoded for testing if safe
// For this script, we'll try to read from the project's env file or assume the user has set them.
// Actually, we can reuse the supabase client from 'src/lib/supabase.ts' if we were in TS, but this is JS.
// We'll read the .env.local file manually.

const envPath = path.resolve(__dirname, '../.env.local');
let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            SUPABASE_URL = line.split('=')[1].replace(/"/g, '').trim();
        }
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
            SUPABASE_SERVICE_ROLE_KEY = line.split('=')[1].replace(/"/g, '').trim();
        }
    }
} catch (e) {
    console.log("Could not read .env.local, trying process.env or failing gracefully.");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: Missing Supabase credentials. Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testOrderFlow() {
    console.log("Starting Full Order Flow Test...");

    const testOrderId = `TEST-${Date.now()}`;
    const testPhone = '919876543210';
    
    // 1. Create a Product with Tags (Testing Tags)
    console.log("\n1. Creating Test Product with Tags...");
    const productId = `PROD-${Date.now()}`;
    const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
            id: productId,
            name: 'Test Product Node',
            description: 'Created via Node script',
            regular_price: 999,
            price: 999, // Required column
            category_id: 'gifts', // Assuming 'gifts' exists, or we might fail constraint. 
            // We should check categories first.
            image_url: 'https://placehold.co/400',
            tags: ['TestTag', 'NodeJS'],
            inventory: 10
        })
        .select()
        .single();

    if (productError) {
        console.error("Product Creation Failed:", productError);
        // If category fails, try creating one
        if (productError.message.includes('foreign key constraint')) {
             console.log("Attempting to create 'gifts' category...");
             await supabase.from('categories').upsert({ id: 'gifts', name: 'Gifts', image_url: 'https://placehold.co/100' });
             // Retry product
             const { error: retryError } = await supabase.from('products').insert({
                id: productId,
                name: 'Test Product Node',
                description: 'Created via Node script',
                regular_price: 999,
                category_id: 'gifts',
                image_url: 'https://placehold.co/400',
                tags: ['TestTag', 'NodeJS'],
                inventory: 10
             });
             if (retryError) {
                 console.error("Retry failed:", retryError);
                 return;
             }
             console.log("Product created on retry.");
        } else {
            return;
        }
    } else {
        console.log("Product Created Successfully:", product.id);
        console.log("Tags:", product.tags);
    }

    // 2. Simulate Order Creation (Like create-payment edge function)
    console.log("\n2. Simulating Order Creation (DB Insert)...");
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            external_order_id: testOrderId,
            customer_name: 'Test User',
            customer_phone: testPhone,
            status: 'PENDING',
            payment_status: 'PENDING',
            total_amount: 1098 // 999 + 99 shipping
        })
        .select()
        .single();

    if (orderError) {
        console.error("Order Creation Failed:", orderError);
        return;
    }
    console.log("Order Created:", order.id, "| External ID:", order.external_order_id);

    // 3. Add Order Items
    console.log("\n3. Adding Order Items...");
    const { error: itemError } = await supabase
        .from('order_items')
        .insert({
            order_id: order.id,
            product_id: productId,
            product_name: 'Test Product Node',
            sku: productId,
            quantity: 1,
            unit_price: 999,
            total_price: 999
        });

    if (itemError) {
        console.error("Order Item Creation Failed:", itemError);
    } else {
        console.log("Order Item Added.");
    }

    // 4. Verify Data Fetching
    console.log("\n4. Verifying Data Fetch...");
    const { data: fetchedOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', order.id)
        .single();

    if (fetchError) {
        console.error("Fetch Failed:", fetchError);
    } else {
        console.log("Fetched Order:", fetchedOrder.id);
        console.log("Order Items Count:", fetchedOrder.order_items.length);
        console.log("Order Item Product:", fetchedOrder.order_items[0].product_name);
    }

    // Cleanup (Optional, maybe keep it to see in Admin?)
    // console.log("\nCleaning up test data...");
    // await supabase.from('order_items').delete().eq('order_id', order.id);
    // await supabase.from('orders').delete().eq('id', order.id);
    // await supabase.from('products').delete().eq('id', productId);
    
    console.log("\nTest Completed. Check Admin Panel for Order:", order.external_order_id);
}

testOrderFlow();
