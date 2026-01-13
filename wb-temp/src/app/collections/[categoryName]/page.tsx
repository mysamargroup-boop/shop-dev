
import { notFound } from 'next/navigation';
import { getProducts, getCategories } from '@/lib/data-async';
import CategoryClientPage from './CategoryClientPage';

export const revalidate = 600;

export default async function CategoryPage({ params }: { params: { categoryName: string }}) {
  const categoryName = params.categoryName;
  
  const allProducts = await getProducts();
  const allCategories = await getCategories();
  
  const category = allCategories.find(c => c.id.toLowerCase() === categoryName.toLowerCase());

  if (!category) {
    notFound();
  }

  return <CategoryClientPage allProducts={allProducts} category={category} />;
}
