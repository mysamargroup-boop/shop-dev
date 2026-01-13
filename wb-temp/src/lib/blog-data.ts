
import type { BlogPost } from './types';
import blogData from './blogs.json';
import imageData from './placeholder-images.json';

const { placeholderImages } = imageData;

const getImage = (id: string) => {
  const image = placeholderImages.find(img => img.id === id);
  return image || { imageUrl: 'https://picsum.photos/seed/error/600/400', imageHint: 'placeholder' };
};

const blogPosts: BlogPost[] = (blogData as { posts: BlogPost[] }).posts.map(post => {
  const img = getImage(post.imageKey);
  const finalUrl = post.imageUrl || img.imageUrl;
  const finalHint = post.imageHint || img.imageHint;
  return {
    ...post,
    imageUrl: finalUrl,
    imageHint: finalHint,
  };
});


export function getBlogPosts() {
  return blogPosts;
}

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find(post => post.slug === slug);
}
