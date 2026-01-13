
"use client";

import * as React from 'react';
import { Truck, ShieldCheck, Award, HeartHandshake } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const infoBadges = [
  {
    icon: <Truck className="h-8 w-8 text-primary" />,
    label: "Fast Delivery (T&C Apply)",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    label: "Secure Payments",
  },
  {
    icon: <Award className="h-8 w-8 text-primary" />,
    label: "Premium Quality",
  },
  {
    icon: <HeartHandshake className="h-8 w-8 text-primary" />,
    label: "100% Satisfaction",
  },
]

const ProductInfoBadges = () => {
  return (
    <div className="my-6 py-4 w-full border-y">
        <div className="flex justify-around items-start text-center">
        {infoBadges.map((item, index) => (
            <React.Fragment key={item.label}>
                <div className="flex flex-col items-center gap-2 p-2 flex-1">
                    {item.icon}
                    <span className="text-xs font-semibold text-foreground">{item.label}</span>
                </div>
                {index < infoBadges.length - 1 && (
                    <Separator orientation="vertical" className="h-16 bg-border" />
                )}
            </React.Fragment>
        ))}
        </div>
    </div>
  )
}

export default ProductInfoBadges;
