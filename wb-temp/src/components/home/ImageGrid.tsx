
'use client';
import Link from 'next/link';
import Image from 'next/image';
import imageData from '@/lib/placeholder-images.json';
import { BLUR_DATA_URL } from '@/lib/constants';
import { useEffect, useState } from 'react';

const { placeholderImages } = imageData;

const defaultCategories = [
    {
        name: 'Anniversary',
        href: '/collections/all?concern=anniversary',
        image: { imageUrl: 'https://picsum.photos/seed/error/200/200', imageHint: 'placeholder' },
    },
    {
        name: 'Birthday Gifts',
        href: '/collections/all?concern=birthday',
        image: { imageUrl: 'https://picsum.photos/seed/error/200/200', imageHint: 'placeholder' },
    },
    {
        name: 'Personalized',
        href: '/collections/personal-accessories',
        image: { imageUrl: 'https://picsum.photos/seed/error/200/200', imageHint: 'placeholder' },
    },
    {
        name: 'Corporate Gifts',
        href: '/collections/all?tag=corporate',
        image: { imageUrl: 'https://picsum.photos/seed/error/200/200', imageHint: 'placeholder' },
    },
    {
        name: 'Wall Decor',
        href: '/collections/wall-decor',
        image: { imageUrl: 'https://picsum.photos/seed/error/200/200', imageHint: 'placeholder' },
    },
     {
        name: 'Desk Items',
        href: '/collections/desk-accessories',
        image: { imageUrl: 'https://picsum.photos/seed/error/200/200', imageHint: 'placeholder' },
    },
    {
        name: 'Best Sellers',
        href: '/collections/all?tag=best-seller',
        image: { imageUrl: 'https://picsum.photos/seed/error/200/200', imageHint: 'placeholder' },
    },
    {
        name: 'All Gifts',
        href: '/shop',
        image: { imageUrl: 'https://picsum.photos/seed/error/200/200', imageHint: 'placeholder' },
    },
];

export default function ImageGrid() {
    const [giftCategories, setGiftCategories] = useState(defaultCategories);

    useEffect(() => {
        const categoryIds = [
            'grid-anniversary', 'grid-birthday', 'grid-personalized', 'grid-corporate',
            'grid-walldecor', 'grid-deskitem', 'grid-bestseller', 'grid-allgifts'
        ];
        
        const hrefMap: { [key: string]: string } = {
            'grid-anniversary': '/collections/all?concern=anniversary',
            'grid-birthday': '/collections/all?concern=birthday',
            'grid-personalized': '/collections/personal-accessories',
            'grid-corporate': '/collections/all?tag=corporate',
            'grid-walldecor': '/collections/wall-decor',
            'grid-deskitem': '/collections/desk-accessories',
            'grid-bestseller': '/collections/all?tag=best-seller',
            'grid-allgifts': '/shop',
        };

        const updatedCategories = categoryIds
            .filter(id => id !== 'grid-allgifts') // Exclude 'All Gifts'
            .map(id => {
                const imgData = placeholderImages.find(img => img.id === id);
                return {
                    name: imgData?.name || id.replace('grid-', ''),
                    href: hrefMap[id],
                    image: imgData || { imageUrl: 'https://picsum.photos/seed/error/200/200', imageHint: 'placeholder' },
                };
        });
        
        setGiftCategories(updatedCategories);

    }, []);


    return (
        <section className="container mx-auto px-4 mt-8">
            <div className="grid grid-cols-4 gap-4 md:gap-6">
                {giftCategories.map(category => (
                    <Link key={category.name} href={category.href} className="text-center group flex flex-col items-center">
                        <div className="relative w-full aspect-square rounded-lg md:rounded-xl overflow-hidden mb-2 shadow-sm transition-shadow duration-300 group-hover:shadow-md">
                             <Image
                                src={category.image.imageUrl}
                                alt={category.name}
                                fill
                                sizes="(max-width: 768px) 25vw, 15vw"
                                className="object-cover"
                                data-ai-hint={category.image.imageHint}
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                            />
                        </div>
                        <p className="text-[11px] md:text-sm font-medium text-foreground group-hover:text-primary transition-colors">{category.name}</p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
