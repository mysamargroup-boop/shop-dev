
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Coupon } from '@/lib/types';
import { Check, Gift, Sparkles, Tag } from 'lucide-react';
import { useState } from 'react';

const CouponCard = ({ coupon }: { coupon: Coupon }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: `Coupon code ${coupon.code} has been copied to your clipboard.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const discountText = coupon.type === 'percent'
    ? `${coupon.value}% OFF`
    : `₹${coupon.value} OFF`;

  return (
    <Card className="bg-gradient-to-br from-primary via-primary/90 to-accent/90 text-primary-foreground shadow-lg shine-effect-fast flex flex-col md:flex-row items-center p-4 gap-4">
      <div className="flex-shrink-0 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-white/50 rounded-lg bg-white/20">
        <p className="text-4xl font-bold tracking-widest">
            {coupon.code}
        </p>
        <p className="font-semibold text-lg">{discountText}</p>
      </div>
      <div className="flex-1 text-center md:text-left">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Gift className="h-5 w-5" />
          <span>Exclusive Offer</span>
        </h2>
        <p className="text-white/80 mt-1">Use code <span className="font-bold">{coupon.code}</span> to get {discountText} on your order!</p>
        <Button
          onClick={handleCopy}
          variant="secondary"
          className="w-full md:w-auto mt-4 text-primary hover:bg-white/90"
        >
          {copied ? <Check className="mr-2" /> : <Sparkles className="mr-2" />}
          {copied ? 'Copied!' : 'Copy Code'}
        </Button>
      </div>
    </Card>
  );
};

export default function OffersPage() {
  const woody10Coupon: Coupon = {
    code: 'WOODY10',
    type: 'percent',
    value: 10,
    active: true
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold md:text-5xl inline-flex items-center gap-3">
          <Tag className="h-10 w-10 text-accent" />
          Available Coupons
          <Tag className="h-10 w-10 text-accent" />
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Copy the code below to use at checkout and save on your next order.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
        <CouponCard coupon={woody10Coupon} />
      </div>
    </div>
  );
}
