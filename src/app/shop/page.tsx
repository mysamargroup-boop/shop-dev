
import { Suspense } from 'react';
import { getProducts, getTags } from '@/lib/data-async';
import ShopClientPage from './ShopClientPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Results - Handcrafted Wooden Gifts | Woody Business',
  description: 'Search through our collection of handcrafted wooden gifts. Find the perfect personalized gift for any occasion.',
  keywords: 'search, wooden gifts, handcrafted, personalized gifts, find gifts',
  openGraph: {
    title: 'Search Wooden Gifts',
    description: 'Search through our collection of handcrafted wooden gifts at Woody Business',
    type: 'website',
  },
};

export default async function ShopPage(props: { searchParams?: { search?: string } }) {
  const allProducts = await getProducts();
  const tags = await getTags();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopClientPage allProducts={allProducts} allTags={tags} searchQuery={props.searchParams?.search} />
    </Suspense>
  )
}
