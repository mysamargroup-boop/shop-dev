

'use client';
import Link from 'next/link';
import { Heart } from 'lucide-react';

const iconCategories = [
  {
    name: "Under ₹9",
    icon: <div className="text-sm font-bold text-center text-primary-foreground group-hover:text-white">Under<br/>₹9</div>,
    href: "/shop?price=9",
    color: 'bg-primary'
  },
  {
    name: "Under ₹19",
    icon: <div className="text-sm font-bold text-center text-primary-foreground group-hover:text-white">Under<br/>₹19</div>,
    href: "/shop?price=19",
    color: 'bg-foreground'
  },
  {
    name: "Personal Gifts",
    icon: <Heart className="h-8 w-8 text-primary-foreground group-hover:text-white" />,
    href: "/collections/personal-accessories",
    color: 'bg-primary'
  },
  {
    name: "Under ₹49",
    icon: <div className="text-sm font-bold text-center text-primary-foreground group-hover:text-white">Under<br/>₹49</div>,
    href: "/shop?price=49",
    color: 'bg-foreground'
  },
  {
    name: "Under ₹199",
    icon: <div className="text-sm font-bold text-center text-primary-foreground group-hover:text-white">Under<br/>₹199</div>,
    href: "/shop?price=199",
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
                  <p className="text-xs lg:text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                    {item.name}
                  </p>
                </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
