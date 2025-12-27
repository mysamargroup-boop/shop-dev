
import type { BlogPost } from './types';
import blogData from './json-seeds/blogs.json';
import imageData from './json-seeds/placeholder-images.json';

const { placeholderImages } = imageData;

const getImage = (id: string) => {
  const image = (placeholderImages as Array<{ id: string; imageUrl: string; imageHint?: string }>).find((img) => img.id === id);
  return image || { imageUrl: 'https://picsum.photos/seed/error/600/400', imageHint: 'placeholder' };
};

const blogPosts: BlogPost[] = (blogData as { posts: BlogPost[] }).posts.map(post => {
  const img = getImage(post.imageKey);
  const finalUrl = post.imageUrl || img.imageUrl;
  const finalHint = post.imageHint || img.imageHint || 'blog image';
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
