

import { getCoupons } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Sparkles, Scissors } from 'lucide-react';
import CopyButton from '@/components/ui/copy-button';

export default async function OffersPage() {
  const allCoupons = await getCoupons();
  const activeCoupons = allCoupons.filter(coupon => coupon.active && coupon.show_on_offers_page);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold md:text-5xl inline-flex items-center gap-3">
          <Sparkles className="h-10 w-10 text-accent" />
          Special Offers & Coupons
          <Sparkles className="h-10 w-10 text-accent" />
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Use these codes at checkout to get exciting discounts on your favorite products.
        </p>
      </div>

      {activeCoupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {activeCoupons.map((coupon) => (
            <div key={coupon.code} className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl shadow-lg flex items-center p-1">
                <div className="absolute top-1/2 -translate-y-1/2 -left-5 h-10 w-10 bg-background rounded-full"></div>
                <div className="absolute top-1/2 -translate-y-1/2 -right-5 h-10 w-10 bg-background rounded-full"></div>
                
                <div className="flex-1 flex flex-col items-center justify-center p-6 border-r-2 border-dashed border-primary-foreground/30">
                    <div className="p-3 bg-primary-foreground/20 rounded-full mb-3">
                        <Ticket className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-lg font-semibold">
                        {coupon.type === 'percent'
                        ? `${coupon.value}% OFF`
                        : `₹${coupon.value} OFF`}
                    </p>
                    <p className="text-xs text-white/80">On your next order</p>
                </div>

                <div className="w-40 flex flex-col items-center justify-center p-4">
                    <p className="text-sm font-semibold mb-3">Use Code:</p>
                    <CopyButton textToCopy={coupon.code} />
                </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold">No Offers Available Right Now</h2>
          <p className="mt-2 text-muted-foreground">Please check back later for exciting deals.</p>
        </div>
      )}
    </div>
  );
}
