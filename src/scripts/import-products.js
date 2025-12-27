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

  const categoriesPathNew = path.join(process.cwd(), 'lib', 'json-seeds', 'categories.json');
  const categoriesPathOld = path.join(process.cwd(), 'lib', 'categories.json');
  const productsPathNew = path.join(process.cwd(), 'lib', 'json-seeds', 'products.json');
  const productsPathOld = path.join(process.cwd(), 'lib', 'products.json');
  const blogsPath = path.join(process.cwd(), 'lib', 'json-seeds', 'blogs.json');
  const tagsPath = path.join(process.cwd(), 'lib', 'json-seeds', 'tags.json');
  const couponsPath = path.join(process.cwd(), 'lib', 'json-seeds', 'coupons.json');
  const siteSettingsPath = path.join(process.cwd(), 'lib', 'json-seeds', 'site-settings.json');
  const analyticsPath = path.join(process.cwd(), 'lib', 'json-seeds', 'analytics.json');

  const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));

  const categoriesJson = readJson(fs.existsSync(categoriesPathNew) ? categoriesPathNew : categoriesPathOld);
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

  const productsJson = readJson(fs.existsSync(productsPathNew) ? productsPathNew : productsPathOld);
  const products = Array.isArray(productsJson) ? productsJson : Array.isArray(productsJson?.products) ? productsJson.products : [];

  if (!products.length) {
    console.log('No products found to import.');
  } else {
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

  // Seed blog posts
  if (fs.existsSync(blogsPath)) {
    const blogsJson = readJson(blogsPath);
    const posts = Array.isArray(blogsJson?.posts) ? blogsJson.posts : [];
    if (posts.length) {
      const blogRows = posts.map((b) => ({
        slug: b.slug,
        title: b.title,
        author: b.author ?? null,
        excerpt: b.excerpt ?? null,
        content: b.content ?? '',
        image_key: b.imageKey ?? null,
        image_url: b.imageUrl ?? null,
        published_at: b.date ? new Date(b.date).toISOString() : new Date().toISOString(),
      }));
      const { error } = await supabase.from('blog_posts').upsert(blogRows, { onConflict: 'slug' });
      if (error) throw error;
      console.log(`Upserted blog posts: ${blogRows.length}`);
    } else {
      console.log('No blog posts found to import.');
    }
  }

  // Seed tags
  if (fs.existsSync(tagsPath)) {
    const tagsJson = readJson(tagsPath);
    const tags = Array.isArray(tagsJson?.tags) ? tagsJson.tags : [];
    if (tags.length) {
      const rows = tags.map((name) => ({ name }));
      const { error } = await supabase.from('tags').upsert(rows, { onConflict: 'name' });
      if (error) throw error;
      console.log(`Upserted tags: ${rows.length}`);
    } else {
      console.log('No tags found to import.');
    }
  }

  // Seed coupons
  if (fs.existsSync(couponsPath)) {
    const couponsJson = readJson(couponsPath);
    const coupons = Array.isArray(couponsJson?.coupons) ? couponsJson.coupons : [];
    if (coupons.length) {
      const { error } = await supabase.from('coupons').upsert(coupons, { onConflict: 'code' });
      if (error) throw error;
      console.log(`Upserted coupons: ${coupons.length}`);
    } else {
      console.log('No coupons found to import.');
    }
  }

  // Seed site settings (single row)
  if (fs.existsSync(siteSettingsPath)) {
    const settings = readJson(siteSettingsPath);
    if (settings && typeof settings === 'object') {
      const { error } = await supabase.from('site_settings').upsert(settings, { onConflict: 'id' });
      if (error) throw error;
      console.log('Upserted site settings');
    } else {
      console.log('No site settings found to import.');
    }
  }

  // Seed analytics sample data
  if (fs.existsSync(analyticsPath)) {
    const analyticsJson = readJson(analyticsPath);
    const events = Array.isArray(analyticsJson?.analytics) ? analyticsJson.analytics : [];
    if (events.length) {
      const rows = events.map((e) => ({
        session_id: e.session_id,
        ip_address: e.ip_address ?? null,
        user_agent: e.user_agent ?? '',
        city: e.city ?? null,
        country: e.country ?? null,
        referrer: e.referrer ?? null,
        utm_source: e.utm_source ?? null,
        utm_medium: e.utm_medium ?? null,
        utm_campaign: e.utm_campaign ?? null,
        page_url: e.page_url ?? null,
        event_type: e.event_type ?? null,
        element_selector: e.element_selector ?? null,
        timestamp: e.timestamp ?? new Date().toISOString(),
      }));
      const { error } = await supabase.from('lead_analytics').upsert(rows, { onConflict: 'id' }).catch(() => ({ error: null }));
      if (error) {
        console.warn('Failed to upsert analytics (table may not have id PK). Inserting instead...');
        const { error: insertErr } = await supabase.from('lead_analytics').insert(rows);
        if (insertErr) throw insertErr;
      }
      console.log(`Inserted analytics events: ${rows.length}`);
    } else {
      console.log('No analytics events found to import.');
    }
  }

  // Health-check: coupon_redemptions & whatsapp_messages tables (optional)
  try {
    const hc1 = await supabase.from('coupon_redemptions').insert({
      coupon_code: 'WOODY10',
      order_id: 'TEST_ORDER_1',
      redeemed_at: new Date().toISOString(),
    });
    if (hc1.error) {
      console.warn('coupon_redemptions insert failed (table may not exist):', hc1.error.message);
    } else {
      console.log('coupon_redemptions connectivity OK');
    }
  } catch (e) {
    console.warn('coupon_redemptions health-check error:', e.message || String(e));
  }
  try {
    const hc2 = await supabase.from('whatsapp_messages').insert({
      to: '919999999999',
      message_type: 'template',
      template_name: 'order_confirmation',
      status: 'SENT',
      created_at: new Date().toISOString(),
    });
    if (hc2.error) {
      console.warn('whatsapp_messages insert failed (table may not exist):', hc2.error.message);
    } else {
      console.log('whatsapp_messages connectivity OK');
    }
  } catch (e) {
    console.warn('whatsapp_messages health-check error:', e.message || String(e));
  }
}

main().catch((e) => {
  console.error('Import failed:', e);
  process.exit(1);
});
