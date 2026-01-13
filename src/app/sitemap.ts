
import { MetadataRoute } from 'next';
import { getProducts, getCategories, getBlogPosts, getTags } from '@/lib/data-async';
import { slugify } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://business.woody.co.in';

  const staticRoutes = [
    '',
    '/shop',
    '/collections',
    '/our-story',
    '/blog',
    '/connect',
    '/offers',
    '/career',
    '/pricing',
    '/privacy',
    '/shipping',
    '/terms'
  ].map(route => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));

  const products = await getProducts();
  const productRoutes = products.map(product => {
    const categorySlug = product.category.split(',')[0].trim().toLowerCase().replace(/ /g, '-');
    return {
      url: `${siteUrl}/collections/${categorySlug}/${slugify(product.name)}`,
      lastModified: new Date(),
    }
  });

  const categories = await getCategories();
  const categoryRoutes = categories.map(category => ({
    url: `${siteUrl}/collections/${category.id}`,
    lastModified: new Date(),
  }));

  const blogPosts = await getBlogPosts();
  const blogPostRoutes = blogPosts.map(post => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(),
  }));
  
  const tags = await getTags();
  const tagRoutes = tags.map(tag => ({
    url: `${siteUrl}/tags/${tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...productRoutes,
    ...categoryRoutes,
    ...blogPostRoutes,
    ...tagRoutes,
  ];
}
