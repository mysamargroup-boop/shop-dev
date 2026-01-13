
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';
import sampleData from '@/lib/samples.json';
import { BLUR_DATA_URL } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface Sample {
  id: string;
  imageUrl: string;
  productName: string;
  customerName: string;
  category: string;
}

export default function SamplesPage() {
  const { samples } = sampleData;
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ imageUrl: string; alt: string; } | null>(null);

  const categorizedSamples = useMemo(() => {
    return samples.reduce((acc, sample) => {
      const category = sample.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(sample);
      return acc;
    }, {} as Record<string, Sample[]>);
  }, [samples]);

  const openLightbox = (imageUrl: string, alt: string) => {
    setSelectedImage({ imageUrl, alt });
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedImage(null);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Customer Gallery
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            See our products in their new homes! Real photos from happy customers.
          </p>
        </header>

        {samples.length > 0 ? (
          <div className="space-y-12">
            {Object.entries(categorizedSamples).map(([category, items]) => (
              <section key={category}>
                <h2 className="text-2xl font-bold font-headline mb-6 border-b pb-2">{category}</h2>
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {items.map((sample) => {
                      const altText = `Sample photo of ${sample.productName} from customer ${sample.customerName}`;
                      return (
                      <div key={sample.id} className="break-inside-avoid group relative overflow-hidden rounded-lg shadow-lg cursor-pointer" onClick={() => openLightbox(sample.imageUrl, altText)}>
                        <Image
                          src={sample.imageUrl}
                          alt={altText}
                          width={500}
                          height={500}
                          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-4 text-white">
                          <p className="font-bold text-sm">{sample.productName}</p>
                          <p className="text-xs">from {sample.customerName}</p>
                        </div>
                      </div>
                    )}
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-dashed border-2 rounded-lg">
            <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">No Samples Yet</h2>
            <p className="mt-2 text-muted-foreground">Check back soon to see photos from our customers!</p>
          </div>
        )}
      </div>
      
      {isLightboxOpen && selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" 
          role="dialog" 
          aria-modal="true"
          onClick={closeLightbox}
        >
          <div className="relative w-full h-full max-w-4xl max-h-screen p-4 md:p-8" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
                onClick={closeLightbox}
                aria-label="Close lightbox"
              >
                <X className="h-6 w-6" />
              </Button>
              <div className="relative w-full h-full">
                <Image
                    src={selectedImage.imageUrl}
                    alt={selectedImage.alt}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                />
              </div>
          </div>
        </div>
      )}
    </>
  );
}
