
"use client";

import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Star } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '../ui/avatar';

const reviews = [
  {
    name: 'Akash Choubey',
    review: 'The personalized keychain was beyond my expectations. The wood quality is superb and the engraving is so precise. It made for a perfect birthday gift!',
    rating: 5,
  },
  {
    name: 'Ravi Tiwari',
    review: 'I ordered a custom mobile stand for my office desk. It\'s not only functional but also a beautiful piece of decor. The finish is smooth and it looks very premium.',
    rating: 5,
  },
  {
    name: 'Mayank Jain',
    review: 'The mandala wall art is absolutely stunning! It has become the centerpiece of my living room. The craftsmanship is incredible. Highly recommended.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    review: 'Excellent service and fantastic products. I bought a pen holder as a corporate gift and my client loved it. The personalization option is a great touch.',
    rating: 4,
  },
  {
    name: 'Sumit Agarwal',
    review: 'The wooden nameplate I ordered is beautiful. It gives such a warm and welcoming feel to our home entrance. The quality is top-notch.',
    rating: 5,
  },
  {
    name: 'Neha Gupta',
    review: 'I love my engraved cutting board! It\'s almost too beautiful to use. The bamboo is thick and sturdy. It was delivered on time and packaged securely.',
    rating: 5,
  },
  {
    name: 'Vikram Singh',
    review: 'Woody Business has a fantastic collection. I was looking for a unique anniversary gift and found the perfect sound wave art. My wife was thrilled!',
    rating: 5,
  },
  {
    name: 'Anjali Verma',
    review: 'The customer support was very helpful in getting my custom photo print just right. The final product is amazing and captures the memory perfectly.',
    rating: 5,
  }
];

const Rating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5 text-yellow-500">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-current' : 'text-gray-300'}`} />
    ))}
  </div>
);

const NameAvatar = ({ name }: { name: string }) => {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    const firstNameInitial = names[0]?.[0] || '';
    const lastNameInitial = names.length > 1 ? names[names.length - 1]?.[0] || '' : '';
    return `${firstNameInitial}${lastNameInitial}`.toUpperCase();
  };

  return (
    <Avatar>
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
};


const ReviewsCarousel = () => {
  return (
    <section className="mt-16 pt-12 border-t">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-headline font-bold">What Our Customers Say</h2>
            <Button asChild variant="outline" className='mt-4'>
                <Link href="#" target="_blank" rel="noopener noreferrer">
                    Review us
                </Link>
            </Button>
        </div>
        <Carousel
        opts={{
            align: 'start',
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
                {reviews.map((review, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full">
                        <Card className="flex flex-col h-full">
                            <CardContent className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center mb-4">
                                    <NameAvatar name={review.name} />
                                    <div className='ml-4'>
                                        <h4 className="font-semibold">{review.name}</h4>
                                        <Rating rating={review.rating} />
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-sm flex-1">"{review.review}"</p>
                            </CardContent>
                        </Card>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    </section>
  );
};

export default ReviewsCarousel;

    