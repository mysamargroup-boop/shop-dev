
import { Suspense } from 'react';
import { getProducts } from '@/lib/data-async';
import ShopClientPage from './ShopClientPage';

export default async function ShopPage() {
  const allProducts = await getProducts();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopClientPage allProducts={allProducts} />
    </Suspense>
  )
}
