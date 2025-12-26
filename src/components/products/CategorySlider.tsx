"use client";

import Image from 'next/image';
import type { Category } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";

interface CategorySliderProps {
  categories: Category[];
}

const CategorySlider = ({ categories }: CategorySliderProps) => {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 3000,
        }),
      ]}
      className="w-full"
    >
      <CarouselContent>
        {categories.map((category) => (
          <CarouselItem key={category.id} className="md:basis-1/2 lg:basis-1/4">
            <div className="p-1">
              <Card className="overflow-hidden">
                <CardContent className="relative flex aspect-video items-center justify-center p-0">
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    data-ai-hint={category.imageHint}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h3 className="text-2xl font-headline font-semibold text-white">
                      {category.name}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default CategorySlider;
