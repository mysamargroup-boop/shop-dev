
import { Suspense } from 'react';
import { getProducts, getTags } from '@/lib/data-async';
import ShopClientPage from './ShopClientPage';

export default async function ShopPage() {
  const allProducts = await getProducts();
  const tags = await getTags();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopClientPage allProducts={allProducts} allTags={tags} />
    </Suspense>
  )
}
