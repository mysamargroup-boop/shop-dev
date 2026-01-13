
'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getSiteSettings } from '@/lib/data-async';
import type { SiteSettings } from '@/lib/types';

const Logo = ({ className }: { className?: string }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchLogo() {
        try {
            const settings: SiteSettings = await getSiteSettings();
            if (isMounted && settings.logo_url) {
                setLogoUrl(settings.logo_url);
            }
        } catch (error) {
            console.error("Failed to fetch logo URL", error);
        }
    }
    fetchLogo();
    return () => { isMounted = false; };
  }, []);
  
  if (logoUrl) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <img
          src={logoUrl}
          alt="Nema One Logo"
          className="h-10 w-auto"
          style={{ height: '40px' }}
        />
      </div>
    );
  }

  return (
    <div className={cn("text-2xl md:text-3xl font-bold tracking-tight whitespace-nowrap", className)}>
      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Samar Store
      </span>
    </div>
  );
};

export default Logo;
