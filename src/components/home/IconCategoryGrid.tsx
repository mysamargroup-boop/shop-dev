

'use client';
import Link from 'next/link';
import { Box, Brush, Gift, Package2, Heart } from 'lucide-react';

const iconCategories = [
  {
    name: "Wall Art",
    icon: <Brush className="h-8 w-8 text-primary-foreground group-hover:text-white" />,
    href: "/collections/wall-decor",
    color: 'bg-primary'
  },
  {
    name: "Desk Items",
    icon: <Gift className="h-8 w-8 text-primary-foreground group-hover:text-white" />,
    href: "/collections/desk-accessories",
    color: 'bg-foreground'
  },
  {
    name: "Personal Gifts",
    icon: <Heart className="h-8 w-8 text-primary-foreground group-hover:text-white" />,
    href: "/collections/personal-accessories",
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

export default function IconCategoryGrid() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 md:gap-8 justify-items-center">
            {iconCategories.map((item, index) => (
                <Link key={index} href={item.href} className="group flex flex-col items-center text-center gap-3">
                  <div className={`flex items-center justify-center h-20 w-20 rounded-full ${item.color} group-hover:bg-accent transition-colors`}>
                    {item.icon}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                    {item.name}
                  </p>
                </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
