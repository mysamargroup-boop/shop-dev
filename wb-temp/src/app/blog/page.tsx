
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPosts } from '@/lib/blog-data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/constants';

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold md:text-5xl">From the Craftsman's Desk</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Inspiration, stories, and ideas behind our handcrafted wooden gifts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Card key={post.slug} className="overflow-hidden group flex flex-col">
            <Link href={`/blog/${post.slug}`}>
              <CardHeader className="p-0">
                <div className="relative aspect-video">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    data-ai-hint={post.imageHint}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </div>
              </CardHeader>
            </Link>
            <CardContent className="p-6 flex flex-col flex-1">
              <p className="text-sm text-muted-foreground mb-2">{post.date} &bull; <span className="font-semibold bg-gradient-to-r from-accent to-destructive bg-clip-text text-transparent">{post.author}</span></p>
              <h2 className="text-xl font-headline font-bold mb-3 flex-1">
                <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-muted-foreground mb-4">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="font-semibold text-primary inline-flex items-center group-hover:text-accent">
                Read More <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
