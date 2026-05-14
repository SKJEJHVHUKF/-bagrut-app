import { ImageResponse } from 'next/og';

// Apple Touch Icon (iOS home screen)
// Apple's spec: 180x180 PNG.
// iOS applies its own rounded-corner mask, so we render with NO rounding
// and let the OS clip — that prevents the double-corner look.

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
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
        }}
      >
        <svg
          width={126}
          height={126}
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 5L18.5 13.5L27 16L18.5 18.5L16 27L13.5 18.5L5 16L13.5 13.5L16 5Z"
            fill="white"
          />
          <path
            d="M16 11L17 14.5L20.5 16L17 17.5L16 21L15 17.5L11.5 16L15 14.5L16 11Z"
            fill="rgba(168,85,247,0.5)"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
