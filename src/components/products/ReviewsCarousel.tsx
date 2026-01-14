
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
import { useEffect, useState } from 'react';
import { getRecentReviews } from '@/lib/data-supabase';
import type { Review } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const recentReviews = await getRecentReviews(8);
        setReviews(recentReviews);
      } catch (error) {
        console.error("Failed to fetch recent reviews:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);


  if (loading) {
    return (
      <section className="mt-16 pt-12 border-t">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-headline font-bold">What Our Customers Say</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="ml-4 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }
  
  if (reviews.length === 0) {
    return null; // Don't show the section if there are no reviews
  }

  return (
    <section className="mt-16 pt-12 border-t">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-headline font-bold">What Our Customers Say</h2>
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
            <CarouselContent className="-ml-4">
                {reviews.map((review, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full">
                        <Card className="flex flex-col h-full">
                            <CardContent className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center mb-4">
                                    <NameAvatar name={review.author_name} />
                                    <div className='ml-4'>
                                        <h4 className="font-semibold">{review.author_name}</h4>
                                        <Rating rating={review.rating} />
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-sm flex-1">"{review.comment}"</p>
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
