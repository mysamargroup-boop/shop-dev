
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/constants';

interface ProductLightboxProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  images: { url: string; alt: string }[];
  startIndex?: number;
}

const ProductLightbox = ({ isOpen, onOpenChange, images, startIndex = 0 }: ProductLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
    }
  }, [isOpen, startIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, images.length]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-0 w-full max-w-5xl h-full max-h-[90vh] flex flex-col items-center justify-center">
        {/* Accessibility Fix: Add a visually hidden title and description */}
        <DialogTitle className="sr-only">Product Image Lightbox</DialogTitle>
        <DialogDescription className="sr-only">
          Viewing image {currentIndex + 1} of {images.length}: {currentImage.alt}
        </DialogDescription>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-50 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </Button>

        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={currentImage.url}
            alt={currentImage.alt}
            fill
            className="object-contain"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
        </div>

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-8 w-8" />
              <span className="sr-only">Previous Image</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
              <span className="sr-only">Next Image</span>
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full ${currentIndex === index ? 'bg-white scale-125' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductLightbox;
