
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (require('fs').existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedReviews() {
  console.log('Starting reviews seed...');

  // 1. Fetch some products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name')
    .limit(5);

  if (prodError || !products || products.length === 0) {
    console.error('Error fetching products or no products found:', prodError);
    return;
  }
  console.log(`Found ${products.length} products.`);

  // 2. Fetch some customers (if any exist, otherwise we might need to create dummy ones or use null)
  // Note: Reviews usually require a valid customer_id if the constraint is strict. 
  // Based on schema, customer_id references customers(id) on delete set null.
  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('id, name')
    .limit(5);

  if (custError) {
    console.error('Error fetching customers:', custError);
    return;
  }
  
  const customerList = customers && customers.length > 0 ? customers : [];
  console.log(`Found ${customerList.length} customers.`);

  // 3. Create dummy reviews
  const reviews = [];
  const comments = [
    "Amazing product! Highly recommended.",
    "Good quality but delivery was slow.",
    "Not what I expected, but okay.",
    "Excellent craftsmanship.",
    "Value for money."
  ];

  for (const product of products) {
    // Create 1-2 reviews per product
    const numReviews = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numReviews; i++) {
      const randomCustomer = customerList.length > 0 
        ? customerList[Math.floor(Math.random() * customerList.length)] 
        : null;
        
      const review = {
        product_id: product.id,
        customer_id: randomCustomer ? randomCustomer.id : null, // Can be null if no customers
        customer_name: randomCustomer ? randomCustomer.name : 'Anonymous User',
        rating: Math.floor(Math.random() * 5) + 1, // 1 to 5
        comment: comments[Math.floor(Math.random() * comments.length)],
        is_approved: true // Auto approve for testing
      };
      reviews.push(review);
    }
  }

  console.log(`Preparing to insert ${reviews.length} reviews...`);

  // 4. Insert reviews
  const { data: inserted, error: insertError } = await supabase
    .from('reviews')
    .insert(reviews)
    .select();

  if (insertError) {
    console.error('Error inserting reviews:', insertError);
  } else {
    console.log('Successfully inserted reviews:', inserted.length);
    console.log(inserted);
  }
}

seedReviews();
