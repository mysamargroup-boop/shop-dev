
import { notFound } from 'next/navigation';
import { getProducts, getCategories } from '@/lib/data-async';
import CategoryClientPage from './CategoryClientPage';
import { Metadata } from 'next';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { categoryName: string } }): Promise<Metadata> {
  const categoryName = params.categoryName;
  const allCategories = await getCategories();
  
  const category = allCategories.find(c => c.id.toLowerCase() === categoryName.toLowerCase());
  
  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    };
  }

  return {
    title: `${category.name} - Handcrafted Wooden Gifts | Woody Business`,
    description: `Explore our collection of ${category.name} handcrafted wooden gifts. Perfect for corporate gifting, birthdays, and special occasions.`,
    keywords: `${category.name}, wooden gifts, handcrafted, personalized gifts, ${category.name.toLowerCase()}`,
    openGraph: {
      title: `${category.name} - Wooden Gifts`,
      description: `Shop ${category.name} handcrafted wooden gifts at Woody Business`,
      type: 'website',
    },
  };
}

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
