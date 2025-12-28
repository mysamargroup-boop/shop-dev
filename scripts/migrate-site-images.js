
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // Fallback to default .env
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const jsonPath = path.resolve(__dirname, '../src/lib/placeholder-images.json');
const rawData = fs.readFileSync(jsonPath, 'utf8');
const { placeholderImages } = JSON.parse(rawData);

async function migrateImages() {
  console.log(`Found ${placeholderImages.length} images to migrate...`);

  for (const image of placeholderImages) {
    const { id, name, imageUrl, imageHint } = image;
    
    // Map JSON fields to Supabase columns (snake_case)
    const record = {
      id,
      name: name || null,
      description: imageHint || '', // Default description to imageHint
      image_url: imageUrl,
      image_hint: imageHint
    };

    const { error } = await supabase
      .from('site_images')
      .upsert(record, { onConflict: 'id' });

    if (error) {
      console.error(`Error migrating image ${id}:`, error.message);
    } else {
      console.log(`Successfully migrated image: ${id}`);
    }
  }

  console.log('Migration complete!');
}

migrateImages();
