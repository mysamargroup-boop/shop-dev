
"use client";

import { useState } from 'react';
import { Heart } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

const ShopByOccasion = ({ products, tags }: { products: Product[], tags: string[] }) => {
  const [selectedTag, setSelectedTag] = useState(tags[0] || '');

  const filteredProducts = products.filter(p => p.tags?.includes(selectedTag));

  if (tags.length === 0) {
    return null;
  }

  return (
    <section className="mb-12 relative py-8 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-24">
            <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                <path d="M0 50 Q 250 100, 500 50 T 1000 50" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="1" />
                <path d="M0 55 Q 250 105, 500 55 T 1000 55" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="1" />
            </svg>
        </div>
      <div className="relative text-center mb-8">
        <h2 className="mb-2 text-3xl font-headline font-bold md:text-4xl inline-flex items-center gap-2">
          Shop By <span className="text-accent"><Heart className="inline-block h-8 w-8" /></span> Occasion
        </h2>
      </div>

      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {tags.map((tag) => (
          <Button
            key={tag}
            variant={selectedTag === tag ? 'default' : 'outline'}
            onClick={() => setSelectedTag(tag)}
            className={cn(
                selectedTag === tag 
                ? 'bg-accent hover:bg-accent/80 text-accent-foreground' 
                : 'bg-orange-100 border-orange-200 text-foreground hover:bg-orange-200 hover:text-foreground'
            )}
          >
            {tag}
          </Button>
        ))}
      </div>

      {filteredProducts.length > 0 ? (
        <Carousel
          opts={{
            align: 'start',
            loop: filteredProducts.length > 5,
          }}
          className="w-full"
        >
          <CarouselContent>
            {filteredProducts.map((product) => (
              <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <div className="p-1 h-full">
                  <ProductCard product={product} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      ) : (
        <div className="text-center py-12">
            <p className="text-muted-foreground">No products found for this occasion.</p>
        </div>
      )}
    </section>
  );
};

export default ShopByOccasion;
