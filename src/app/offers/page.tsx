
import { getProducts } from '@/lib/data-async';
import ProductCard from '@/components/products/ProductCard';
import { Sparkles } from 'lucide-react';

export default async function OffersPage() {
  const allProducts = await getProducts();
  const discountedProducts = allProducts.filter(p => p.regularPrice && p.regularPrice > p.price);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold md:text-5xl inline-flex items-center gap-3">
          <Sparkles className="h-10 w-10 text-accent" />
          Special Offers
          <Sparkles className="h-10 w-10 text-accent" />
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Don't miss out on our limited-time deals on your favorite organic products.
        </p>
      </div>

      {discountedProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {discountedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg">
          <h2 className="text-2xl font-semibold">No Offers Available Right Now</h2>
          <p className="mt-2 text-muted-foreground">Please check back later for exciting deals.</p>
        </div>
      )}
    </div>
  );
}
