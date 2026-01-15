
import Link from 'next/link';
import Image from 'next/image';
import { getCategories } from '@/lib/data-async';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/constants';
export const revalidate = 600;

export default async function CollectionsPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold md:text-5xl">Our Collections</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore our range of handcrafted wooden gifts, sorted by category.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {categories.map((category) => {
          return (
            <Link key={category.id} href={category.linkUrl || `/collections/${category.id}`} className="group block">
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-0 relative">
                  <div className="aspect-square relative">
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={category.imageHint}
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 p-2 md:p-4">
                    <h3 className="text-base md:text-xl font-bold font-headline text-white">{category.name}</h3>
                     <div className="hidden md:flex items-center text-sm font-semibold text-white/90 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>View Products</span>
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
