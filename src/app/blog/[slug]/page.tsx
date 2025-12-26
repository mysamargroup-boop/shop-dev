
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getBlogPostBySlug } from '@/lib/blog-data';
import { Calendar, User } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/constants';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-12 max-w-4xl">
      <header className="mb-8">
        <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden mb-8">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
            data-ai-hint={post.imageHint}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>
        <h1 className="text-3xl md:text-5xl font-headline font-bold text-center mb-4">{post.title}</h1>
        <div className="flex justify-center items-center gap-6 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{post.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>By <span className="font-semibold bg-gradient-to-r from-accent to-destructive bg-clip-text text-transparent">{post.author}</span></span>
          </div>
        </div>
      </header>
      
      <div 
        className="prose dark:prose-invert max-w-none text-base md:text-lg"
        dangerouslySetInnerHTML={{ __html: post.content }} 
      />

    </article>
  );
}
