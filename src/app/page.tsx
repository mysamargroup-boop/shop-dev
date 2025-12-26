

import ProductCard from '@/components/products/ProductCard';
import { getProducts, getCategories, getSiteSettings } from '@/lib/data-async';
import PromoBanners from '@/components/home/PromoBanners';
import ShopByOccasion from '@/components/home/ShopByOccasion';
import ReviewsCarousel from '@/components/products/ReviewsCarousel';
import { Input } from '@/components/ui/input';
import { Mic, Search } from 'lucide-react';
import PromoSlider from '@/components/home/PromoSlider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import IconCategoryGrid from '@/components/home/IconCategoryGrid';
import SubscriptionPopup from '@/components/home/SubscriptionPopup';
import VideoGallery from '@/components/home/VideoGallery';
import WholesaleNotice from '@/components/home/WholesaleNotice';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import PopularProducts from '@/components/home/PopularProducts';
import ImageGrid from '@/components/home/ImageGrid';
import TimerBanner from '@/components/home/TimerBanner';
import { SiteSettings } from '@/lib/types';

export default async function Home() {
  const products = await getProducts();
  const allCategories = await getCategories();
  const settings: SiteSettings = await getSiteSettings();

  const displayCategoryNames = ["Wall Decor", "Keychains", "Desk Accessories", "Personal Accessories", "Wall Hangings"];
  const categories = allCategories.filter(c => displayCategoryNames.includes(c.name));


  return (
    <>
      <WholesaleNotice />
      <div className="container mx-auto px-4 pt-4 md:hidden">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Sending good luck plants or more" 
            className="pl-12 pr-12 h-12 rounded-full bg-background border-2"
          />
          <Mic className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <PromoBanners />
      <ImageGrid />
      <div className="container mx-auto px-4 py-8">

        <TimerBanner settings={settings} />
        <IconCategoryGrid />
        <PopularProducts products={products} />
        <FeaturedCategories />

        {categories.map(category => {
          const categoryProducts = products
            .filter(p => p.category && p.category
              .split(',')
              .map(c => c.trim().toLowerCase().replace(/ /g, '-'))
              .includes(category.id.toLowerCase()))
            .slice(0, 4);
          if (categoryProducts.length === 0) return null;

          return (
            <section key={category.id} className="mb-12">
              <div className="text-center mb-8">
                <h2 className="mb-8 text-3xl font-headline text-center font-bold md:text-4xl stylish-underline">{category.name}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
               <div className="text-center mt-8">
                    <Button asChild variant="outline">
                        <Link href={`/collections/${category.id}`}>View All in {category.name}</Link>
                    </Button>
                </div>
            </section>
          )
        })}
        
        

        <PromoSlider />
        <ShopByOccasion products={products} />

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-8 my-16">
            <h3 className="text-2xl font-bold font-headline text-primary mb-3 text-center">Retail & Corporate Gifting</h3>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-6">
              Explore our full collection on our retail site, Woody, or inquire about special pricing and customization for bulk and corporate orders through our B2B portal.
            </p>
            <div className="text-center flex flex-wrap justify-center gap-4">
                 <Button asChild>
                    <a href="https://woody.co.in" target="_blank" rel="noopener noreferrer">Visit Woody (Retail)</a>
                </Button>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-primary">
                    <a href="https://business.woody.co.in" target="_blank" rel="noopener noreferrer">Visit B2B Portal</a>
                </Button>
            </div>
          </div>

        <ReviewsCarousel />

        <VideoGallery />

      </div>
      <SubscriptionPopup />
    </>
  );
}
