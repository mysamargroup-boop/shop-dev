"use client";

import Link from 'next/link';
import useWishlist from '@/hooks/use-wishlist';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, isLoaded } = useWishlist();

  if (!isLoaded) {
    // You can add a loading skeleton here if you want
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading wishlist...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold md:text-5xl">Your Wishlist</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your collection of favorite wooden treasures.
        </p>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-semibold">Your wishlist is empty</h2>
          <p className="mt-2 text-muted-foreground">
            Looks like you haven't added any favorite items yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/shop">Start Exploring</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
