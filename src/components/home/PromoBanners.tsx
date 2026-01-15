
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import type { SiteSettings, SiteImage } from '@/lib/types';
import { Truck } from 'lucide-react';

interface PromoBannersProps {
  siteImages: SiteImage[];
}

export default function PromoBanners({ siteImages }: PromoBannersProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);


  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/site-settings');
        if (!res.ok) return;
        const data = await res.json();
        setSettings((data || {}) as SiteSettings);
      } catch {
      }
    })();
  }, []);

  const bannerEnabled = settings?.promo_banner_enabled ?? true;
  if (!bannerEnabled) {
    return null;
  }
  
  const freeShippingThreshold = settings?.free_shipping_threshold ?? 2999;
  const title = settings?.promo_banner_title || 'Free Delivery Unlocked!';
  const subtitle = settings?.promo_banner_subtitle || `On all orders above ₹${freeShippingThreshold}`;


  return (
    <section className="container mx-auto px-4 my-4">
      <Card className="overflow-hidden text-white shine-effect" style={{
          backgroundColor: '#cd1c18',
          backgroundImage: 'linear-gradient(326deg, #cd1c18 0%, #66023c 74%)'
      }}>
        <CardContent className="p-0 flex items-center justify-between">
          <div className="pl-6 py-4">
            <h3 className="text-xl md:text-2xl font-bold">{title}</h3>
            <p className="text-white/80 text-sm">{subtitle}</p>
          </div>
          <div className="w-28 aspect-square flex-shrink-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Truck className="h-12 w-12 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
