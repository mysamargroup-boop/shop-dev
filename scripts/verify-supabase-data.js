require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    throw new Error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function countRows(supabase, table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

async function sampleRows(supabase, table, fields, limit = 3) {
  const { data, error } = await supabase.from(table).select(fields).limit(limit);
  if (error) throw error;
  return data || [];
}

async function main() {
  const supabase = await createAdmin();
  const report = {};

  async function addTableReport(name, fields) {
    try {
      const count = await countRows(supabase, name);
      const sample = await sampleRows(supabase, name, fields);
      report[name] = { count, sample };
      console.log(`[OK] ${name}: ${count} rows`);
    } catch (e) {
      report[name] = { error: e.message };
      console.error(`[ERR] ${name}: ${e.message}`);
    }
  }

  await addTableReport('categories', 'id,name,created_at');
  await addTableReport('products', 'id,name,category_id,regular_price,sale_price,created_at');
  await addTableReport('orders', 'id,status,total_amount,created_at');
  await addTableReport('order_items', 'id,order_id,product_id,quantity,unit_price');
  await addTableReport('coupons', 'code,type,value,active,updated_at');
  await addTableReport('tags', 'id,name,updated_at');
  await addTableReport('blog_posts', 'slug,title,author,published_at');
  await addTableReport('lead_analytics', 'session_id,event_type,page_url,timestamp');
  await addTableReport('banners', 'id,type,title,is_active,display_order');
  await addTableReport('payments', 'id,order_id,status,amount,created_at');
  await addTableReport('videos', 'id,type,url,thumbnail_url');
  await addTableReport('subscriptions', 'id,name,phone,created_at');

  // Site settings single-row check
  try {
    const { data, error } = await supabase.from('site_settings').select('*').single();
    if (error && error.code !== 'PGRST116') throw error;
    const exists = !!data;
    report['site_settings'] = { exists, sample: data || {} };
    console.log(`[OK] site_settings: ${exists ? 'present' : 'missing'}`);
  } catch (e) {
    report['site_settings'] = { error: e.message };
    console.error(`[ERR] site_settings: ${e.message}`);
  }

  // Additional integrity checks for products pricing
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id,regular_price,sale_price');
    if (error) throw error;
    let missingBoth = 0;
    data.forEach(p => {
      const rp = typeof p.regular_price === 'number' ? p.regular_price : null;
      const sp = typeof p.sale_price === 'number' ? p.sale_price : null;
      if (!rp && !sp) missingBoth++;
    });
    report['products_pricing_integrity'] = { missingBoth, total: data.length };
    console.log(`[OK] pricing check: ${missingBoth} products missing both prices (of ${data.length})`);
  } catch (e) {
    report['products_pricing_integrity'] = { error: e.message };
    console.error(`[ERR] pricing check: ${e.message}`);
  }

  console.log('\n=== Summary (JSON) ===');
  console.log(JSON.stringify(report, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
