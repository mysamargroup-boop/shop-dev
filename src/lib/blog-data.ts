import type { BlogPost } from './types';

// Placeholder function for now as we are migrating to Supabase completely
// The actual data fetching happens in the components or via actions that use Supabase
const getImage = (id: string) => {
  return { imageUrl: 'https://picsum.photos/seed/error/600/400', imageHint: 'placeholder' };
};

export function getBlogPosts() {
  return [];
}

export function getBlogPostBySlug(slug: string) {
  return undefined;
}
