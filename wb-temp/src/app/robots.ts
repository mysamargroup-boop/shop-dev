
import { MetadataRoute } from 'next';
 
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://business.woody.co.in';
  return {
    rules: [
        {
            userAgent: '*',
            allow: '/',
            disallow: '/wb-admin/',
        }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
