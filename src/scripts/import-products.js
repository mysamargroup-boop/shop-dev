// Node script to import categories and products from JSON files into Supabase
// Usage: node scripts/import-products.js
const fs = require('fs');
const path = require('path');
const rootEnv = path.join(process.cwd(), '..', '.env.local');
const localEnv = path.join(process.cwd(), '.env.local');
require('dotenv').config({ path: fs.existsSync(rootEnv) ? rootEnv : localEnv });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const categoriesPath = path.join(process.cwd(), 'lib', 'categories.json');
  const productsPath = path.join(process.cwd(), 'lib', 'products.json');

  const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));

  const categoriesJson = readJson(categoriesPath);
  const categories = Array.isArray(categoriesJson?.categories) ? categoriesJson.categories : [];

  if (categories.length) {
    const upsertCategories = categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      image_url: c.imageUrl ?? null,
      image_hint: c.imageHint ?? null,
      link_url: c.linkUrl ?? null,
    }));
    const { error: catErr } = await supabase.from('categories').upsert(upsertCategories, { onConflict: 'id' });
    if (catErr) throw catErr;
    console.log(`Upserted categories: ${upsertCategories.length}`);
  } else {
    console.log('No categories found in JSON.');
  }

  const normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .trim()
      .replace(/[,/&]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s/g, '-')
      .replace(/-+/g, '-');

  const categoryIndex = new Map();
  categories.forEach((c) => {
    categoryIndex.set(normalize(c.id), c.id);
    categoryIndex.set(normalize(c.name), c.id);
    // handle singular/plural
    if (c.name.endsWith('s')) {
      categoryIndex.set(normalize(c.name.slice(0, -1)), c.id);
    }
  });

  const productsJson = readJson(productsPath);
  const products = Array.isArray(productsJson) ? productsJson : Array.isArray(productsJson?.products) ? productsJson.products : [];

  if (!products.length) {
    console.log('No products found to import.');
    return;
  }

  const missingCategories = new Map();

  const toDb = (p) => ({
    id: p.id,
    name: p.name,
    short_description: p.shortDescription ?? null,
    description: p.description ?? null,
    price: typeof p.price === 'number' ? p.price : Number(p.price ?? 0),
    category_id: (() => {
      const parts = String(p.category || '').split(',').map((x) => x.trim());
      for (const part of parts) {
        const n = normalize(part);
        const found = categoryIndex.get(n);
        if (found) return found;
      }
      const fallback = normalize(parts[0] || p.category || 'misc');
      if (!categoryIndex.has(fallback)) {
        const nameGuess = (parts[0] || p.category || 'Misc').trim();
        missingCategories.set(fallback, nameGuess);
      }
      return fallback;
    })(),
    image_url: p.imageUrl ?? null,
    image_alt: p.imageAlt ?? null,
    image_hint: p.imageHint ?? null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    inventory: typeof p.inventory === 'number' ? p.inventory : 0,
    rating: typeof p.rating === 'number' ? p.rating : null,
    review_count: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
    gallery_images: Array.isArray(p.galleryImages) ? p.galleryImages : [],
    allow_image_upload: !!p.allowImageUpload,
    video_url: p.videoUrl ?? null,
    image_attribution: p.imageAttribution ?? null,
    license: p.license ?? null,
    sub_category: p.subCategory ?? null,
    material: p.material ?? null,
    color: p.color ?? null,
    badge: p.badge ?? null,
    specific_description: p.specificDescription ?? null,
    features: Array.isArray(p.features) ? p.features : [],
    weight_grams: typeof p.weightGrams === 'number' ? p.weightGrams : null,
    dimensions_length: typeof p.dimensionsCm?.length === 'number' ? p.dimensionsCm.length : null,
    dimensions_width: typeof p.dimensionsCm?.width === 'number' ? p.dimensionsCm.width : null,
    dimensions_height: typeof p.dimensionsCm?.height === 'number' ? p.dimensionsCm.height : null,
    weight: p.weight ?? null,
    dimensions: p.dimensions ?? null,
  });

  const batch = products.map(toDb);

  // Upsert any missing categories inferred from products
  if (missingCategories.size > 0) {
    console.log('Inferred missing category IDs:', Array.from(missingCategories.keys()));
    const inferred = Array.from(missingCategories.entries()).map(([id, name]) => ({
      id,
      name,
      description: null,
      image_url: null,
      image_hint: null,
      link_url: null,
    }));
    const { error: infErr } = await supabase.from('categories').upsert(inferred, { onConflict: 'id' });
    if (infErr) throw infErr;
    console.log(`Created inferred categories: ${inferred.length}`);
  }
  const { error: prodErr } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
  if (prodErr) throw prodErr;
  console.log(`Upserted products: ${batch.length}`);
}

main().catch((e) => {
  console.error('Import failed:', e);
  process.exit(1);
});
