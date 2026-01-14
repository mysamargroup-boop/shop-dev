
import Image from 'next/image';
import { getSiteImages } from '@/lib/data-async';
import { BLUR_DATA_URL } from '@/lib/constants';
import { Heart, Gift, Users } from 'lucide-react';

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
    {children}
  </span>
);

const FounderHighlight = ({ children }: { children: React.ReactNode }) => (
    <span className="font-bold bg-gradient-to-r from-purple-700 via-pink-500 to-purple-700 bg-clip-text text-transparent">
      {children}
    </span>
);

export default async function OurStoryPage() {
    const siteImages = await getSiteImages();
    const shashankImage = siteImages.find(img => img.id === 'founder-shashank-nema') || { imageUrl: 'https://picsum.photos/seed/shashank/800/800', imageHint: 'founder portrait' };
    const workshopImage = siteImages.find(img => img.id === 'our-story-workshop') || { imageUrl: 'https://picsum.photos/seed/workshop/2070/1164', imageHint: 'woodworking craftsman' };
    
    return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Our Story</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">The Heart and Soul Behind Every Creation</p>
        </header>

        <article className="prose dark:prose-invert max-w-none text-base md:text-lg leading-relaxed space-y-6 [&_p]:mb-4">
          <p>
            The story of <Highlight>Nema One</Highlight> isn’t a corporate legend written in a boardroom; it’s a quiet, heartfelt narrative that began in a small town with a young man named <FounderHighlight>Shashank Nema</FounderHighlight>. From an early age, Shashank possessed a unique lens through which he saw the world. While others saw objects, he saw memories waiting to happen. A simple wooden block wasn’t just timber; it was a potential keychain that would travel with someone on their life’s journey, a photo frame that would cradle a cherished moment, or a desk accessory that would witness the birth of great ideas.
          </p>
          
          <div className="flex flex-col md:flex-row gap-8 items-center not-prose my-12">
              <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden flex-shrink-0 shadow-lg border-4 border-primary/10">
                  <Image
                    src={shashankImage.imageUrl}
                    alt="Shashank Nema, Founder of Nema One"
                    fill
                    className="object-cover"
                    data-ai-hint={shashankImage.imageHint}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
              </div>
              <blockquote className="border-l-4 border-primary pl-6 italic text-muted-foreground text-xl md:text-2xl leading-relaxed">
                "I believe a gift is more than just an item. It's a vessel for emotion, a tangible piece of a memory. My dream was to create a place where anyone could find or create that perfect vessel, no matter the occasion."
                <cite className="block not-italic mt-4 font-semibold text-base">— Shashank Nema, Founder</cite>
              </blockquote>
          </div>

          <p>
            This simple but profound idea became Shashank’s guiding star. He wasn’t just passionate about crafts; he was passionate about people and the connections that bind them. He observed how finding the right gift was often a stressful, fragmented experience. You might visit one store for a birthday, another for a corporate event, and spend hours online searching for something truly personal. The process was disconnected, and the magic of gifting was often lost in the hassle.
          </p>
          
          <p>
            That’s where the vision for <Highlight>Nema One</Highlight> crystallized. Why couldn’t there be one place—a single, trusted destination—that understood the universal language of gifting? A place that, much like an Amazon for heartfelt gestures, offered a vast, curated collection of gifts and accessories for every possible need. From a simple, elegant keychain for a friend to a sophisticated set of desk accessories for a business partner; from a romantic anniversary present to a bulk order for a corporate giveaway.
          </p>

          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden my-12 shadow-lg not-prose">
            <Image
              src={workshopImage.imageUrl}
              alt="The Nema One Workshop"
              fill
              className="object-cover"
              data-ai-hint={workshopImage.imageHint}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>

          <p>
            Shashank began his journey with a deep respect for craftsmanship and an obsession with quality. He assembled a small team of artisans who shared his vision, individuals who understood that the soul of a gift lies in the care with which it’s made. They didn’t just manufacture products; they poured their hearts into every piece, ensuring that each item was not only beautiful but also durable and meaningful. The choice of wood as a primary medium was deliberate—it’s natural, warm, and carries a unique story in its grain, making every item a one-of-a-kind creation.
          </p>

          <p>
            Today, <Highlight>Nema One</Highlight> stands as a testament to that dream. It is more than an e-commerce store; it's a comprehensive gifting solution, an all-in-one platform built on the pillars of <FounderHighlight>variety, quality, and personalization</FounderHighlight>. Our catalog is a diverse ecosystem of accessories, decor, and keepsakes, designed to serve every relationship and celebrate every milestone. We are the place you turn to when you want to express gratitude, celebrate love, foster business relationships, or simply bring a smile to someone’s face.
          </p>

          <p>
            Our journey is one of continuous evolution, driven by your stories and your needs. From our humble beginnings to our vision of becoming the definitive destination for gifting, one thing remains constant: our commitment to making every gift special. Thank you for being a part of our story. Together, we are turning ordinary moments into extraordinary memories.
          </p>
        </article>
      </div>
    </div>
  );
}
