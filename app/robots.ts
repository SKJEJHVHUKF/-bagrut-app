import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * robots.ts — crawl the teaching content, skip everything that needs a session.
 *
 * The disallow list is not about secrecy (middleware already enforces auth); it
 * is about not spending a crawler's budget on pages that can only answer with a
 * redirect to /login, which reads as a broken site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/quiz', '/chat', '/history', '/learn', '/auth/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
