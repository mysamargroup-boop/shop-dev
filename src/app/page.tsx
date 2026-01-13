

import ProductCard from '@/components/products/ProductCard';
import { getProducts, getCategories, getSiteSettings, getSiteImages, getTags } from '@/lib/data-async';
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
import FeaturedCategories from '@/components/home/FeaturedCategories';
import PopularProducts from '@/components/home/PopularProducts';
import ImageGrid from '@/components/home/ImageGrid';
import TimerBanner from '@/components/home/TimerBanner';
import { SiteSettings } from '@/lib/types';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/constants';

export default async function Home() {
  const products = await getProducts();
  const allCategories = await getCategories();
  const settings: SiteSettings = await getSiteSettings();
  const siteImages = await getSiteImages();
  const tags = await getTags();

  const homeBanner1 = siteImages.find(img => img.id === 'home-banner-1') || { imageUrl: 'https://picsum.photos/seed/hb1/1200/600', imageHint: 'office products' };
  const homeBanner2 = siteImages.find(img => img.id === 'home-banner-2') || { imageUrl: 'https://picsum.photos/seed/hb2/1200/600', imageHint: 'custom gifts' };


  const displayCategoryNames = ["Wall Decor", "Keychains", "Desk Accessories", "Personal Accessories", "Wall Hangings"];
  const categories = allCategories.filter(c => displayCategoryNames.includes(c.name));


  return (
    <>
      <div className="container mx-auto px-4 pt-4 md:hidden">
        <form action="/shop" method="get" className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            name="search"
            placeholder="Sending good luck plants or more" 
            className="pl-12 pr-12 h-12 rounded-full bg-background border-2"
          />
          <Button type="submit" variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground">
             <Mic className="h-5 w-5" />
          </Button>
        </form>
      </div>
      <PromoBanners siteImages={siteImages} />
      <ImageGrid siteImages={siteImages} />
      <div className="container mx-auto px-4 py-8">

        <TimerBanner settings={settings} />
        <IconCategoryGrid />
        <PopularProducts products={products} />
        
        <div className="my-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/collections/corporate-gifts" className="group block">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg">
                  <Image src={homeBanner1.imageUrl} alt="Corporate Gifting Solutions" fill className="object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint={homeBanner1.imageHint} placeholder="blur" blurDataURL={BLUR_DATA_URL} sizes="(max-width: 768px) 100vw, 50vw"/>
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white p-4 text-center">
                      <h3 className="text-2xl font-bold font-headline">Corporate Gifting</h3>
                      <p className="text-sm mt-1">Elevate your brand with custom engraved gifts.</p>
                  </div>
              </div>
          </Link>
          <Link href="/collections/personalized" className="group block">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg">
                  <Image src={homeBanner2.imageUrl} alt="Personalized Gifts" fill className="object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint={homeBanner2.imageHint} placeholder="blur" blurDataURL={BLUR_DATA_URL} sizes="(max-width: 768px) 100vw, 50vw"/>
                   <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white p-4 text-center">
                      <h3 className="text-2xl font-bold font-headline">Fully Personalized Gifts</h3>
                      <p className="text-sm mt-1">Create something truly unique for your loved ones.</p>
                  </div>
              </div>
          </Link>
        </div>

        <FeaturedCategories siteImages={siteImages} />

        {categories.map(category => {
          const categoryProducts = products.filter(p => p.category && p.category.split(',').map(c => c.trim()).includes(category.name)).slice(0, 4);
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
        
        

        <PromoSlider siteImages={siteImages} />
        <ShopByOccasion products={products} tags={tags}/>

        <ReviewsCarousel />

        <VideoGallery />

      </div>
      <SubscriptionPopup />
    </>
  );
}
