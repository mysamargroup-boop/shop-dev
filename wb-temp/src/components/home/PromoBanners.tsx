
"use client";

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import imageData from '@/lib/placeholder-images.json';
import { BLUR_DATA_URL } from '@/lib/constants';
import { getSiteSettings } from '@/lib/data-async';
import { useEffect, useState } from 'react';
import type { SiteSettings } from '@/lib/types';
import { Truck } from 'lucide-react';

const { placeholderImages } = imageData;
const deliveryBannerImage = placeholderImages.find(img => img.id === 'promo-banner-delivery') || { imageUrl: 'https://picsum.photos/seed/delivery/300/200', imageHint: 'delivery scooter' };

export default function PromoBanners() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  if (!settings?.promo_banner_enabled) {
    return null;
  }
  
  const freeShippingThreshold = settings?.free_shipping_threshold ?? 2999;
  const title = settings?.promo_banner_title || 'Free Delivery Unlocked!';
  const subtitle = settings?.promo_banner_subtitle || `On all orders above ₹${freeShippingThreshold}`;


  return (
    <section className="container mx-auto px-4 mt-4 mb-0">
      <Card className="overflow-hidden text-white shine-effect" style={{
          backgroundColor: '#cd1c18',
          backgroundImage: 'linear-gradient(326deg, #cd1c18 0%, #66023c 74%)'
      }}>
        <CardContent className="p-0 flex items-center justify-between">
          <div className="pl-6 py-4">
            <h3 className="text-lg md:text-2xl font-bold">{title}</h3>
            <p className="text-white/80 text-sm">{subtitle}</p>
          </div>
          <div className="pr-6">
            <Truck className="h-12 w-12 text-white/80" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
