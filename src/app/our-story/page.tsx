
import Image from 'next/image';
import imageData from '@/lib/placeholder-images.json';
import { BLUR_DATA_URL } from '@/lib/constants';

const { placeholderImages } = imageData;
const workshopImage = placeholderImages.find(img => img.id === 'our-story-workshop') || { imageUrl: 'https://picsum.photos/seed/workshop/2070/1164', imageHint: 'woodworking craftsman' };


const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
    {children}
  </span>
);

const FounderHighlight = ({ children }: { children: React.ReactNode }) => (
    <span className="font-bold bg-gradient-to-r from-purple-700 via-pink-500 to-purple-700 bg-clip-text text-transparent">
      {children}
    </span>
);

export default function OurStoryPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Our Story</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">The Heart and Soul Behind Every Creation</p>
        </header>

        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-12 shadow-lg">
          <Image
            src={workshopImage.imageUrl}
            alt="Woody Business Workshop"
            fill
            className="object-cover"
            data-ai-hint={workshopImage.imageHint}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>

        <article className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed space-y-6">
          <p>
            The story of <Highlight>Woody Business</Highlight> is a tale of brotherhood, passion, and the timeless beauty of wood. It begins with two brothers, <FounderHighlight>Anuj Nema</FounderHighlight> and <Highlight>Akash Nema</Highlight>, who shared a small workshop and a big dream. Growing up, they were fascinated by how a simple block of wood could be transformed into something of immense beauty and utility.
          </p>
          <p>
            Anuj, the visionary, always saw more than just grain and texture; he saw stories waiting to be told. Akash, the craftsman, had the skilled hands to bring those stories to life. Together, they embarked on a journey to create not just products, but personal heirlooms—gifts that would carry memories and emotions for a lifetime.
          </p>

          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
            "Every piece we create holds a piece of our story and our passion. We wanted to build a business where every gift feels personal, soulful, and crafted with genuine love."
            <cite className="block not-italic mt-2 font-semibold">— Anuj & Akash Nema</cite>
          </blockquote>

          <p>
            Starting with a shared love for artistry, they explored different materials, finding a special appreciation for the versatility and smooth finish of high-quality MDF. They refined their techniques, blending traditional craftsmanship with modern design to create the signature <Highlight>Woody Business</Highlight> style. Their commitment was simple: <Highlight>quality, personalization, and heartfelt design</Highlight>.
          </p>

           <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 my-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold font-headline text-primary mb-2 text-center">For Our Retail Customers</h3>
              <p className="text-center text-muted-foreground">
                Explore our full collection of handcrafted gifts on our retail website, <Highlight>Woody</Highlight>. Each piece is designed with care to help you celebrate life's special moments. Visit <a href="https://woody.co.in" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">woody.co.in</a> to shop now.
              </p>
            </div>
            <div className="border-t border-primary/20 my-4"></div>
            <div>
              <h3 className="text-lg font-bold font-headline text-primary mb-2 text-center">For Businesses & Bulk Orders</h3>
              <p className="text-center text-muted-foreground">
                We also offer specialized services for corporate gifting and bulk orders through our dedicated B2B portal. Whether you're looking for unique client gifts or custom items for an event, we bring the same level of craftsmanship and personalization to every project. Visit <a href="https://business.woody.co.in" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">business.woody.co.in</a> to learn more.
              </p>
            </div>
          </div>
          
          <p>
            Today, Woody Business is a testament to their shared vision. It's a community of creators, artisans, and people who believe in the power of a thoughtful gift. From our family's workshop to your home, we bring you creations made with integrity and a deep-seated belief in <Highlight>the art of giving</Highlight>.
          </p>

          <p>
            Thank you for being part of our journey. Together, we are creating lasting memories, one wooden gift at a time.
          </p>
        </article>
      </div>
    </div>
  );
}
