
"use client";

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
import { Youtube, Instagram } from 'lucide-react';
import imageData from '@/lib/placeholder-images.json';
import { BLUR_DATA_URL } from '@/lib/constants';

const { videos } = imageData;

const VideoGallery = () => {
    if (!videos || videos.length === 0) {
        return null;
    }

    return (
        <section className="mt-16 pt-12 border-t">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-headline font-bold">Video Gallery</h2>
                <p className="text-muted-foreground mt-2">See our products in action.</p>
            </div>
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
                    {videos.map((video) => {
                        let videoContent;

                        if (video.type === 'youtube') {
                            const videoId = new URL(video.url).searchParams.get('v');
                            videoContent = (
                                <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                ></iframe>
                            );
                        } else {
                            videoContent = (
                                <Link href={video.url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                                    <Image
                                        src={video.thumbnailUrl}
                                        alt={`Instagram video ${video.id}`}
                                        fill
                                        className="object-cover"
                                        placeholder="blur"
                                        blurDataURL={BLUR_DATA_URL}
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                                    />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                        <Instagram className="h-12 w-12 text-white" />
                                    </div>
                                </Link>
                            );
                        }

                        return (
                            <CarouselItem key={video.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                                <div className="p-1">
                                    <Card className="overflow-hidden">
                                        <CardContent className="p-0 relative aspect-[9/16]">
                                            {videoContent}
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
        </section>
    );
};

export default VideoGallery;
