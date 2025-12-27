require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceKey) {
    console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: products, error } = await supabase
    .from('products')
    .select('id,name,regular_price,sale_price');
  if (error) {
    console.error('Fetch error:', error.message);
    process.exit(1);
  }
  const updates = products.map((p) => {
    const base = Math.floor(499 + Math.random() * 4501);
    const discountPct = Math.random() < 0.6 ? Math.floor(10 + Math.random() * 30) : 0;
    const sale = discountPct > 0 ? Math.max(99, Math.round(base * (1 - discountPct / 100))) : null;
    return { id: p.id, regular_price: base, sale_price: sale };
  });
  for (let i = 0; i < updates.length; i++) {
    const u = updates[i];
    const { error: upErr } = await supabase
      .from('products')
      .update({ regular_price: u.regular_price, sale_price: u.sale_price })
      .eq('id', u.id);
    if (upErr) {
      console.error('Update error:', upErr.message);
      process.exit(1);
    }
    if ((i + 1) % 50 === 0 || i === updates.length - 1) {
      console.log(`Updated ${i + 1} / ${updates.length}`);
    }
  }
  console.log('Done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
