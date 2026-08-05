import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MathUp — מתרגלים חכם, מצליחים יותר',
    // Label under the home-screen icon; Android truncates ~12 chars.
    short_name: 'MathUp',
    description: 'תרגול חכם של שאלות בגרות אמיתיות, נוצרות בזמן אמת ע״י בינה מלאכותית. הסבר מיידי לכל תשובה.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FCF8FF',
    theme_color: '#7C3AED',
    lang: 'he',
    dir: 'rtl',
    categories: ['education', 'productivity'],
    // Long-press app icon → jump straight into the three core actions.
    shortcuts: [
      { name: 'מבחן מהיר', url: '/quiz' },
      { name: 'המורה הפרטי', url: '/chat' },
      { name: 'צילום שאלה', url: '/scan' },
    ],
    // Static files built from the logo artwork by `npm run build:brand`.
    // These replaced a runtime app/icon.tsx that drew a gradient star — the
    // MathUp emblem is raster art, so there is nothing for Satori to draw.
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // Maskable — emblem shrunk into the inner ~54% so Android's circle and
        // squircle masks crop white, never the book's corners.
        src: '/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
