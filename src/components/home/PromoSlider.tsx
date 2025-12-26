
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Button } from '../ui/button';
import imageData from '@/lib/placeholder-images.json';
import { BLUR_DATA_URL } from '@/lib/constants';

const { placeholderImages } = imageData;

const getImage = (id: string) => {
  const image = placeholderImages.find(img => img.id === id);
  return image || { imageUrl: 'https://picsum.photos/seed/error/2070/1164', imageHint: 'placeholder' };
};


const sliderItems = [
    {
        title: "Send Xmas Gifts Worldwide",
        date: "25TH DECEMBER",
        image: getImage('slider-xmas'),
        href: "/collections/christmas"
    },
    {
        title: "Anniversary Specials",
        date: "Celebrate Your Love",
        image: getImage('slider-anniversary'),
        href: "/collections/anniversary"
    },
    {
        title: "Birthday Surprises",
        date: "Make Their Day Special",
        image: getImage('slider-birthday'),
        href: "/collections/birthday"
    }
]

export default function PromoSlider() {
  return (
    <section className="mb-12">
        <Carousel
        opts={{
            align: 'start',
            loop: true,
        }}
        plugins={[
            Autoplay({
                delay: 5000,
            }),
        ]}
        className="w-full"
        >
        <CarouselContent>
            {sliderItems.map((item, index) => (
            <CarouselItem key={index}>
                <div className="p-1">
                    <Card className="overflow-hidden">
                        <CardContent className="p-0 relative aspect-[16/9] md:aspect-[21/9]">
                            <Image 
                                src={item.image.imageUrl}
                                alt={item.title}
                                fill
                                className="object-cover"
                                data-ai-hint={item.image.imageHint}
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-black/30"/>
                            <div className="absolute inset-0 flex flex-col justify-center items-start text-white p-8 md:p-16">
                                <p className="text-sm font-semibold tracking-wider">{item.date}</p>
                                <h3 className="text-2xl md:text-4xl font-bold leading-tight max-w-sm" dangerouslySetInnerHTML={{ __html: item.title.replace('Xmas', '<span class="text-red-500">Xmas</span>') }}/>
                                <Button asChild className="mt-4 bg-red-600 hover:bg-red-700">
                                    <Link href={item.href}>ORDER NOW</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex" />
        </Carousel>
    </section>
  );
}
