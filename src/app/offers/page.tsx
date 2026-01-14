
import { getCoupons } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, ClipboardCopy, Sparkles } from 'lucide-react';
import CopyButton from '@/components/ui/copy-button';

export default async function OffersPage() {
  const allCoupons = await getCoupons();
  const activeCoupons = allCoupons.filter(coupon => coupon.active);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {activeCoupons.map((coupon) => (
            <Card key={coupon.code} className="bg-card flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Ticket className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">{coupon.code}</CardTitle>
                        <CardDescription>
                            {coupon.type === 'percent'
                            ? `${coupon.value}% OFF on your order`
                            : `₹${coupon.value} Flat Discount`}
                        </CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex items-end justify-center">
                <CopyButton textToCopy={coupon.code} />
              </CardContent>
            </Card>
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
