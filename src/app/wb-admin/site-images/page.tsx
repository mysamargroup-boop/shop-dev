
import Image from "next/image";
import { getSiteImages } from "@/lib/data-async";
import { updateSiteImage } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { unstable_noStore as noStore } from "next/cache";
import { BLUR_DATA_URL } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const usageMap: { [key: string]: string } = {
    'promo-banner-delivery': 'Homepage small banner (e.g., Free Delivery).',
    'slider-xmas': 'Homepage slider: Christmas.',
    'slider-anniversary': 'Homepage slider: Anniversary.',
    'slider-birthday': 'Homepage slider: Birthday.',
    'grid-anniversary': 'Homepage grid: Anniversary.',
    'grid-birthday': 'Homepage grid: Birthday.',
    'grid-personalized': 'Homepage grid: Personalized.',
    'grid-corporate': 'Homepage grid: Corporate.',
    'grid-walldecor': 'Homepage grid: Wall Decor.',
    'grid-deskitem': 'Homepage grid: Desk Items.',
    'grid-bestseller': 'Homepage grid: Best Sellers.',
    'grid-allgifts': 'Homepage grid: All Gifts.',
    'our-story-workshop': 'Main image on the "Our Story" page.',
};

function ImageCard({ image }: { image: { id: string; imageUrl: string; description: string; imageHint?: string; name?: string; } }) {
  return (
    <Card key={image.id}>
      <form action={updateSiteImage}>
        <input type="hidden" name="id" value={image.id} />
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{image.id}</CardTitle>
          <CardDescription>{usageMap[image.id] || image.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video w-full rounded-md overflow-hidden border">
            <Image
              src={image.imageUrl}
              alt={image.description}
              fill
              className="object-cover"
              data-ai-hint={image.imageHint}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          {image.id.startsWith('grid-') && (
            <div className="space-y-2">
                <Label htmlFor={`name-${image.id}`}>Title</Label>
                <Input id={`name-${image.id}`} name="name" defaultValue={image.name} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor={`imageUrl-${image.id}`}>Image URL</Label>
            <Input id={`imageUrl-${image.id}`} name="imageUrl" defaultValue={image.imageUrl} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`imageHint-${image.id}`}>ALT Text / Hint</Label>
            <Input id={`imageHint-${image.id}`} name="imageHint" defaultValue={image.imageHint} />
          </div>
          <Button type="submit" className="w-full">Save Changes</Button>
        </CardContent>
      </form>
    </Card>
  );
}

export default async function SiteImagesPage() {
  noStore();
  const images = await getSiteImages();
  const allImages = images.filter(img => usageMap[img.id]);
  
  const sliderImages = allImages.filter((img: any) => img.id.startsWith('slider-'));
  const bannerImages = allImages.filter((img: any) => img.id.startsWith('promo-banner-'));
  const homepageGrid = allImages.filter((img: any) => img.id.startsWith('grid-'));
  const otherImages = allImages.filter((img: any) => !img.id.startsWith('slider-') && !img.id.startsWith('promo-banner-') && !img.id.startsWith('grid-'));


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-headline font-bold">Site Images</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Update your site's key visual assets here.</p>
      </div>

       <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>What is "ALT Text / Hint"?</AlertTitle>
          <AlertDescription>
            This field provides descriptive Alternative Text for images, which is crucial for SEO and accessibility. It also serves as a hint for our AI to understand the image's content.
          </AlertDescription>
        </Alert>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Homepage Slider</h2>
        <p className="text-sm text-muted-foreground">These images appear in the main carousel on your homepage. Edit them below.</p>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {sliderImages.map((image: any) => (
              <CarouselItem key={image.id} className="md:basis-1/2 lg:basis-1/3">
                 <ImageCard image={image} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="ml-12" />
          <CarouselNext className="mr-12"/>
        </Carousel>
      </div>
      
       <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Promo Banners</h2>
         <p className="text-sm text-muted-foreground">Small promotional banners on the homepage.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bannerImages.map((image: any) => <ImageCard key={image.id} image={image} />)}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Homepage Grid Images</h2>
        <p className="text-sm text-muted-foreground">These images appear in the circular or square feature grids on the homepage.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {homepageGrid.map((image: any) => <ImageCard key={image.id} image={image} />)}
        </div>
      </div>
      
       <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Other Site Images</h2>
        <p className="text-sm text-muted-foreground">These are miscellaneous images used across the site, like for the "Our Story" page.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherImages.map((image: any) => <ImageCard key={image.id} image={image} />)}
        </div>
      </div>
    </div>
  );
}
