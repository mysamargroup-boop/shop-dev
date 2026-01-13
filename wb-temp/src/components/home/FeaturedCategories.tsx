
'use client';
import Link from 'next/link';
import Image from 'next/image';
import imageData from '@/lib/placeholder-images.json';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/constants';

const { placeholderImages } = imageData;

const getImage = (id: string) => {
  const image = placeholderImages.find(img => img.id === id);
  return image || { imageUrl: 'https://picsum.photos/seed/error/500/500', imageHint: 'placeholder' };
};

const featuredCategories = [
    {
        name: 'Keychains',
        href: '/collections/keychains',
        image: getImage('keychain'),
    },
    {
        name: 'Mobile Stands',
        href: '/collections/mobile-stands',
        image: getImage('mobile-stand'),
    },
    {
        name: 'Wall Hangings',
        href: '/collections/wall-hangings',
        image: getImage('mandala-art'),
    },
    {
        name: 'Pen Holders',
        href: '/collections/pen-stands',
        image: getImage('pen-holder'),
    },
    {
        name: 'Calendars',
        href: '/collections/desk-accessories?subcategory=Calendar',
        image: { imageUrl: 'https://picsum.photos/seed/calendar/500/500', imageHint: 'desk calendar' },
    },
    {
        name: 'Photo Frames',
        href: '/collections/photo-frame',
        image: { imageUrl: 'https://picsum.photos/seed/photoframe/500/500', imageHint: 'photo frame' },
    },
    {
        name: 'Spiritual Art',
        href: '/collections/spiritual-art',
        image: { imageUrl: 'https://picsum.photos/seed/spiritual/500/500', imageHint: 'spiritual art' },
    },
    {
        name: 'Money Box',
        href: '/collections/gifts',
        image: { imageUrl: 'https://picsum.photos/seed/moneybox/500/500', imageHint: 'money box' },
    },
];

export default function FeaturedCategories() {
    return (
        <section className="container mx-auto px-4 pt-8 pb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {featuredCategories.map((category) => (
                    <Link key={category.name} href={category.href} className="group block">
                        <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <CardContent className="p-0 relative">
                                <div className="aspect-square relative">
                                    <Image
                                        src={category.image.imageUrl}
                                        alt={category.name}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint={category.image.imageHint}
                                        placeholder="blur"
                                        blurDataURL={BLUR_DATA_URL}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                                <div className="absolute bottom-0 left-0 p-2 md:p-4 w-full text-center">
                                    <h3 className="text-base md:text-lg font-bold font-headline text-white">{category.name}</h3>
                                     <div className="flex items-center justify-center text-sm font-semibold text-white/90 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span>Shop Now</span>
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
