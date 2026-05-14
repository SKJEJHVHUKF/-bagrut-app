import { ImageResponse } from 'next/og';

// Three variants generated at /icon/{id}:
//   192       — Android home-screen icon (192x192 PNG)
//   512       — Android splash + install prompt (512x512 PNG)
//   maskable  — Adaptive icon with safe-zone bleed for Android (512x512 PNG)
//
// Each one renders the brand gradient + a white 4-point star.
// The maskable variant uses a square background (no rounded corners) so
// Android can crop it into circles, squircles, etc. without clipping content.

export function generateImageMetadata() {
  return [
    {
      contentType: 'image/png',
      size: { width: 192, height: 192 },
      id: '192',
    },
    {
      contentType: 'image/png',
      size: { width: 512, height: 512 },
      id: '512',
    },
    {
      contentType: 'image/png',
      size: { width: 512, height: 512 },
      id: 'maskable',
    },
  ];
}

export default function Icon({ id }: { id: string }) {
  const isMaskable = id === 'maskable';
  const dimension = id === '192' ? 192 : 512;
  const radius = isMaskable ? 0 : Math.round(dimension * 0.22);
  // Maskable icons need a "safe zone" — the visible logo should occupy
  // only the inner ~80% so Android masks don't crop it.
  const starScale = isMaskable ? 0.5 : 0.7;
  const starSize = Math.round(dimension * starScale);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 55%, #fbbf24 100%)',
          borderRadius: radius,
        }}
      >
        <svg
          width={starSize}
          height={starSize}
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main 4-point star */}
          <path
            d="M16 5L18.5 13.5L27 16L18.5 18.5L16 27L13.5 18.5L5 16L13.5 13.5L16 5Z"
            fill="white"
          />
          {/* Inner highlight for depth */}
          <path
            d="M16 11L17 14.5L20.5 16L17 17.5L16 21L15 17.5L11.5 16L15 14.5L16 11Z"
            fill="rgba(168,85,247,0.5)"
          />
        </svg>
      </div>
    ),
    {
      width: dimension,
      height: dimension,
    }
  );
}
