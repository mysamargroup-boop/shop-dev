
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { BLUR_DATA_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { Badge } from '../ui/badge';

interface ProductLightboxProps {
  images: { imageUrl: string; imageHint: string; }[];
  product: Product;
}

const ProductLightbox = ({ images, product }: ProductLightboxProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [lightboxApi, setLightboxApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);

  useEffect(() => {
    if (!api) {
      return
    }
 
    setCurrent(api.selectedScrollSnap())
 
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    if (lightboxApi) {
        lightboxApi.scrollTo(lightboxStartIndex, true);
        lightboxApi.on("select", () => {})
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      lightboxApi?.off("select", () => {});
    };
  }, [isLightboxOpen, lightboxApi, lightboxStartIndex]);

  const openLightbox = (index: number) => {
    setLightboxStartIndex(index);
    setIsLightboxOpen(true);
  };

  const allImages = [product.imageUrl, ...(product.galleryImages || [])];

  return (
    <div className="flex flex-col gap-2">
        <Carousel setApi={setApi} className="rounded-lg overflow-hidden cursor-pointer">
            <CarouselContent>
                {allImages.map((image, index) => (
                    <CarouselItem key={index} onClick={() => openLightbox(index)}>
                         <div className="relative aspect-square">
                            <Image
                                src={image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                data-ai-hint={product.imageHint}
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                            />
                            {product.tags?.includes('Best Seller') && (
                               <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">BESTSELLER</Badge>
                            )}
                         </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
             {allImages.length > 1 && (
                <>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10" />
                </>
             )}
        </Carousel>

        {allImages.length > 1 && (
          <div className="grid grid-cols-6 gap-2">
            {allImages.map((image, index) => (
              <div 
                key={index}
                className={cn(
                  "relative aspect-square rounded-md overflow-hidden cursor-pointer border-2",
                  current === index ? "border-primary" : "border-transparent"
                )}
                onClick={() => api?.scrollTo(index)}
              >
                <Image
                  src={image}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="15vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
            ))}
          </div>
        )}

        {isLightboxOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
                <div className="relative w-full h-full max-w-4xl max-h-screen p-4 md:p-8">
                    <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
                    onClick={() => setIsLightboxOpen(false)}
                    aria-label="Close lightbox"
                    >
                    <X className="h-6 w-6" />
                    </Button>
                    
                    <Carousel setApi={setLightboxApi} opts={{ startIndex: lightboxStartIndex }} className="w-full h-full flex flex-col justify-center">
                    <CarouselContent>
                        {allImages.map((image, index) => (
                        <CarouselItem key={index}>
                            <div className="relative w-full h-full aspect-square max-h-[85vh]">
                            <Image
                                src={image}
                                alt={`Product image ${index + 1}`}
                                fill
                                className="object-contain"
                                sizes="100vw"
                                data-ai-hint={product.imageHint}
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                            />
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    {allImages.length > 1 && (
                        <>
                        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10" />
                        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10" />
                        </>
                    )}
                    </Carousel>

                    {allImages.length > 1 && (
                        <div className="text-center text-white text-sm py-2">
                            {lightboxApi?.selectedScrollSnap() ? lightboxApi.selectedScrollSnap() + 1 : lightboxStartIndex + 1} / {allImages.length}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default ProductLightbox;
