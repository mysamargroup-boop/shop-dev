
'use client';

import { Building, Info, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const AnnouncementBanner = () => {
  return (
    <div className="bg-primary/5 border-b border-primary/10 py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <p className="text-xs sm:text-sm font-semibold text-foreground">
              Welcome to our <span className="font-bold">Bulk & Wholesale</span> portal.
            </p>
          </div>
          <div className="hidden sm:block h-5 w-px bg-border" />
          <Link href="https://woody.co.in" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-accent hover:underline">
            For single items, please visit our retail store <ShoppingBag className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
