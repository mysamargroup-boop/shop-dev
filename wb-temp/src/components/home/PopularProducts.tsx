
'use client';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import type { Product } from '@/lib/types';


const popularProductIds = ["WB-1710", "WB-2331", "WB-1680"];

export default function PopularProducts({ products }: { products: Product[]}) {
    const popularProducts = popularProductIds.map(id => products.find(p => p.id === id)).filter(Boolean);

    if (popularProducts.length === 0) {
        return null;
    }

    return (
        <section className="container mx-auto px-4 py-12 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl">
            <div className="text-center mb-10">
                <h2 className="mb-4 text-3xl font-headline font-bold md:text-4xl stylish-underline">Popular Products</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">Handpicked favorites that our customers love. Discover the best of Woody Business.</p>
            </div>
             <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 4000,
                    }),
                ]}
                className="w-full"
                >
                <CarouselContent>
                    {popularProducts.map((product) => (
                        product && <CarouselItem key={product.id} className="basis-full sm:basis-1/2 md:basis-1/3">
                            <div className="p-1 h-full">
                                <ProductCard product={product} />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
            <div className="text-center mt-10">
                <Button asChild variant="outline">
                    <Link href="/shop">Explore All Products</Link>
                </Button>
            </div>
        </section>
    );
}
