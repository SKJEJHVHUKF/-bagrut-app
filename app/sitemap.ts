import type { MetadataRoute } from 'next';
import { allLessonKeys } from '@/content/lessons';
import { getTrack, TRACK_PAPERS } from '@/content/tracks';
import { SITE_URL } from '@/lib/site';

/**
 * sitemap.ts — what Google is allowed to find.
 *
 * Only PUBLIC routes belong here. `/learn`, `/quiz`, `/chat` and `/history` sit
 * behind `PROTECTED_PREFIXES` in lib/supabase/middleware.ts, and listing a page
 * that answers a crawler with a redirect to /login is worse than not listing it.
 *
 * The topic pages under /practice are the only genuinely rankable asset the
 * product has: hand-authored, mathematically verified Hebrew explanations of
 * every 5-unit subject. They are also the pages a student actually searches for
 * ("מספרים מרוכבים בגרות 5 יחידות"). Generated from the content itself, so a
 * new topic is listed the moment it is authored — nothing to remember.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/roadmap`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/formulas`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/accessibility`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const topicPages: MetadataRoute.Sitemap = allLessonKeys().map(({ subject, topic }) => ({
    url: `${SITE_URL}/practice/${subject}/${encodeURIComponent(topic)}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // The study tracks (/roadmap → 571/572 → topic tiles) are public and their
  // titles/tiles are static content; only progress is client-side.
  const trackPages: MetadataRoute.Sitemap = TRACK_PAPERS.flatMap((paper) => [
    { url: `${SITE_URL}/roadmap/track/${paper}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    ...getTrack(paper).topics.map((t) => ({
      url: `${SITE_URL}/roadmap/track/${paper}/${encodeURIComponent(t.id)}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]);

  return [...staticPages, ...trackPages, ...topicPages];
}
