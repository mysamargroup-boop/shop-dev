
'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { getSiteSettings } from '@/lib/data-async';
import type { SiteSettings } from '@/lib/types';

const Logo = ({ className }: { className?: string }) => {
  const [logoUrl, setLogoUrl] = useState("https://woody.co.in/wp-content/uploads/2024/08/woody-logo.png");

  useEffect(() => {
    async function fetchLogo() {
        try {
            const settings: SiteSettings = await getSiteSettings();
            if (settings.logo_url) {
                setLogoUrl(settings.logo_url);
            }
        } catch (error) {
            console.error("Failed to fetch logo URL", error);
        }
    }
    fetchLogo();
  }, []);
  

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src={logoUrl}
        alt="Woody Business Logo"
        width={120}
        height={40}
        className="h-10 w-auto"
        style={{ width: 'auto', height: '40px' }}
        unoptimized
        priority
      />
    </div>
  );
};

export default Logo;
