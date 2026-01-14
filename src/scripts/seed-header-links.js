
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Supabase environment variables missing');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const defaultLinks = [
  { href: '/collections', label: 'Categories', is_mega_menu: true, special: false },
  { href: '/collections/keychains', label: 'Keychains', is_mega_menu: false, special: false },
  { href: '/collections/wall-hangings', label: 'Wall Hanging', is_mega_menu: false, special: false },
  { href: '/collections/mobile-stands', label: 'Mobile Stand', is_mega_menu: false, special: false },
  { href: '/shop', label: 'Shop', is_mega_menu: false, special: true },
  { href: '/our-story', label: 'Our Story', is_mega_menu: false, special: true },
  { href: '/connect', label: 'Contact Us', is_mega_menu: false, special: false },
];

async function run() {
  const { data: existing, error } = await supabase
    .from('navigation_links')
    .select('href,label')
    .eq('area', 'header');
  if (error) {
    console.error(error);
    process.exit(1);
  }
  const set = new Set((existing || []).map(l => `${l.href}|${l.label}`));
  let inserted = 0;
  for (let i = 0; i < defaultLinks.length; i++) {
    const link = defaultLinks[i];
    const keyStr = `${link.href}|${link.label}`;
    if (!set.has(keyStr)) {
      const { error: insErr } = await supabase
        .from('navigation_links')
        .insert({
          area: 'header',
          href: link.href,
          label: link.label,
          sort_order: i,
          is_mega_menu: !!link.is_mega_menu,
          special: !!link.special
        });
      if (insErr) {
        console.error('Insert failed', insErr);
        process.exit(1);
      }
      inserted++;
    }
  }

  // Explicitly update 'All Gifts' to 'Shop' if it exists
  const { data: oldLink } = await supabase
    .from('navigation_links')
    .select('id')
    .eq('label', 'All Gifts')
    .eq('area', 'header')
    .single();

  if (oldLink) {
    await supabase
      .from('navigation_links')
      .update({ label: 'Shop', href: '/shop', special: true })
      .eq('id', oldLink.id);
    console.log('Updated "All Gifts" to "Shop".');
  }

  console.log(JSON.stringify({ inserted }));
}

run();
