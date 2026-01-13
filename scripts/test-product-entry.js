
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use service key if available for deletion

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Key is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductEntry() {
  console.log('Testing Product Entry with Dual Prices and Tags...');

  const productId = `TEST-PROD-${Date.now()}`;
  const productData = {
    id: productId,
    name: 'Test Product with Dual Price',
    description: 'This is a test product.',
    regular_price: 199.99,
    sale_price: 149.99,
    price: 149.99, // Effective price
    category_id: 'home-decor', // Assuming this category exists, otherwise might fail constraint
    tags: ['test', 'dual-price', 'new-arrival'],
    inventory: 10,
    image_url: 'https://placehold.co/600x400',
    features: ['Feature 1', 'Feature 2']
  };

  // 1. Create Product
  console.log(`Creating product: ${productId}`);
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    // If category constraint fails, try to fetch a valid category first
    if (error.code === '23503') { // Foreign key violation
        console.log('Fetching a valid category...');
        const { data: cat } = await supabase.from('categories').select('id').limit(1).single();
        if (cat) {
            console.log(`Retrying with category: ${cat.id}`);
            productData.category_id = cat.id;
            const { data: retryData, error: retryError } = await supabase
                .from('products')
                .insert(productData)
                .select()
                .single();
            if (retryError) {
                console.error('Retry failed:', retryError);
                return;
            }
            console.log('Product created successfully (retry):', retryData.id);
            verifyProduct(retryData);
            await cleanup(retryData.id);
            return;
        }
    }
    return;
  }

  console.log('Product created successfully:', data.id);
  verifyProduct(data);
  await cleanup(data.id);
}

function verifyProduct(product) {
  console.log('--- Verification ---');
  console.log(`ID: ${product.id}`);
  console.log(`Regular Price: ${product.regular_price} (Expected: 199.99)`);
  console.log(`Sale Price: ${product.sale_price} (Expected: 149.99)`);
  console.log(`Tags: ${JSON.stringify(product.tags)} (Expected: ["test","dual-price","new-arrival"])`);
  
  if (product.regular_price === 199.99 && product.sale_price === 149.99 && Array.isArray(product.tags) && product.tags.length === 3) {
      console.log('✅ TEST PASSED: Dual prices and tags saved correctly.');
  } else {
      console.log('❌ TEST FAILED: Data mismatch.');
  }
}

async function cleanup(id) {
    console.log(`Cleaning up (deleting ${id})...`);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) console.error('Error deleting product:', error);
    else console.log('Cleanup successful.');
}

testProductEntry();
