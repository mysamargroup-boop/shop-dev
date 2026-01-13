
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductByName, getProducts, getCategories, generateStaticParams } from '@/lib/data-async';
import ProductCard from '@/components/products/ProductCard';
import ReviewsCarousel from '@/components/products/ReviewsCarousel';
import ProductLightbox from '@/components/products/ProductLightbox';
import ProductDetailClient from './ProductDetailClient';
import { Home, ChevronRight } from 'lucide-react';
import { slugify } from '@/lib/utils';

export { generateStaticParams };

export const revalidate = 600;

const Breadcrumbs = async ({ product }: { product: any }) => {
  const categories = await getCategories();
  const category = categories.find(c => c.name === product.category.split(',')[0].trim());

  return (
    <div className="container mx-auto px-4 pt-4 overflow-hidden">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="flex items-center gap-1 hover:text-primary flex-shrink-0">
                <Home className="h-4 w-4" />
                Home
            </Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            {category && (
                <>
                    <Link href={`/collections/${category.id}`} className="hover:text-primary flex-shrink-0">
                        {category.name}
                    </Link>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                </>
            )}
            <span className="font-semibold text-foreground truncate block">{product.name}</span>
        </nav>
    </div>
  );
};


export default async function ProductDetailPage({ params }: { params: { productName: string, categoryName: string } }) {
  const product = await getProductByName(params.productName);
  
  if (!product) {
    notFound();
  }
  
  const recommendedProducts = (await getProducts()).filter(
    p => p.category === product.category && p.id !== product.id
  ).slice(0, 5);

  const allImages = [product.imageUrl, ...(product.galleryImages || [])];

  return (
    <>
      <Breadcrumbs product={product} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
          {/* Image Gallery */}
          <ProductLightbox images={allImages.map(img => ({ imageUrl: img, imageHint: product.imageHint || '' }))} product={product} />

          {/* Product Details */}
          <ProductDetailClient product={product} />
        </div>

        {recommendedProducts.length > 0 && (
            <section className="mt-16 pt-12 border-t">
                <h2 className="text-3xl font-headline font-bold text-center mb-8">You Might Also Like</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {recommendedProducts.map(p => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </section>
        )}

        <ReviewsCarousel />
      </div>
    </>
  );
}

