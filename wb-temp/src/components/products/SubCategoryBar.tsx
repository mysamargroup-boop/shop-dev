
"use client";

import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Gift, Package, Heart, Tag, Package2, IndianRupee } from "lucide-react";

const subCategories = [
  {
    name: "New Launches",
    icon: <Package className="h-8 w-8 text-primary-foreground group-hover:text-white" />,
    href: "#",
    color: 'bg-primary'
  },
  {
    name: "Membership Deals",
    icon: <Gift className="h-8 w-8 text-primary-foreground group-hover:text-white" />,
    href: "#",
    color: 'bg-foreground'
  },
  {
    name: "Shop By Concern",
    icon: <Heart className="h-8 w-8 text-primary-foreground group-hover:text-white" />,
    href: "/concerns",
    color: 'bg-primary'
  },
  {
    name: "Under ₹499",
    icon: <div className="text-sm font-bold text-center text-primary-foreground">Under<br/>₹499</div>,
    href: "/shop?price=499",
    color: 'bg-foreground'
  },
  {
    name: "All Products",
    icon: <Package2 className="h-8 w-8 text-primary-foreground group-hover:text-white" />,
    href: "/shop",
    color: 'bg-primary'
  },
  {
    name: "Under ₹999",
    icon: <div className="text-sm font-bold text-center text-primary-foreground">Under<br/>₹999</div>,
    href: "/shop?price=999",
    color: 'bg-foreground'
  },
];

export default function SubCategoryBar() {
  return (
    <section className="py-8 bg-background hidden">
      <div className="container mx-auto px-4">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {subCategories.map((item, index) => (
              <CarouselItem
                key={index}
                className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
              >
                <Link href={item.href} className="group flex flex-col items-center text-center gap-3">
                  <div className={`flex items-center justify-center h-20 w-20 rounded-full ${item.color} group-hover:bg-accent transition-colors`}>
                    {item.icon}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                    {item.name}
                  </p>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
