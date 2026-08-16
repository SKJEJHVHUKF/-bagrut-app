/**
 * site.ts — the canonical public address, in one place.
 *
 * Used by the sitemap, robots.txt, `metadataBase` (which turns every relative
 * OpenGraph image into the absolute URL that WhatsApp and Google require), and
 * the share card. Four places that must never disagree: a share card pointing at
 * one host while the sitemap declares another is how a domain move quietly
 * de-indexes a site.
 *
 * `VERCEL_PROJECT_PRODUCTION_URL` is set automatically by Vercel and follows a
 * custom domain when one is attached, so this keeps working the day the app
 * moves off the vercel.app address.
 */
const FALLBACK = 'https://bagrut-app.vercel.app';

const fromEnv =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

export const SITE_URL = (fromEnv ?? FALLBACK).replace(/\/$/, '');

/** Bare host, for places that show the address to a human (the share card). */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
