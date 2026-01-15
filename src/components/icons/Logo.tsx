
'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getSiteSettings } from '@/lib/data-async';
import type { SiteSettings } from '@/lib/types';

const Logo = ({ className }: { className?: string }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchLogo() {
      try {
        setIsLoading(true);
        // Direct fetch instead of server action to avoid issues
        const response = await fetch('/api/site-settings');
        if (!response.ok) {
          throw new Error('Failed to fetch site settings');
        }
        const settings: SiteSettings = await response.json();
        if (isMounted && settings.logo_url) {
          setLogoUrl(settings.logo_url);
        }
      } catch (error) {
        console.error("Failed to fetch logo URL", error);
        // Fallback to default logo from site-settings.json
        if (isMounted) {
          setLogoUrl("https://bakersonwheel.in/wp-content/uploads/2020/08/Bakers-On-Wheel-Logo-7-1-e1599231431862.png");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    fetchLogo();
    return () => { isMounted = false; };
  }, []);
  
  if (isLoading) {
    return (
      <div className={cn("text-2xl md:text-3xl font-bold tracking-tight whitespace-nowrap", className)}>
        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Samar Store
        </span>
      </div>
    );
  }

  if (logoUrl) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <img
          src={logoUrl}
          alt="Nema One Logo"
          className="h-10 w-auto"
          style={{ height: '40px' }}
          onError={(e) => {
            // Fallback to text if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.nextSibling) {
              (target.nextSibling as HTMLElement).style.display = 'block';
            }
          }}
        />
        <div className={cn("text-2xl md:text-3xl font-bold tracking-tight whitespace-nowrap", className)} style={{ display: 'none' }}>
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Samar Store
          </span>
        </div>
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
