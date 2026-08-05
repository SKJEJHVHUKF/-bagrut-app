'use client';

import { useState } from 'react';

// The MathUp brand mark: an open book built from circuit traces with a
// circuit-brain in the spine. The artwork itself lives at /logo.png.
//
// Five pages used to each declare their own private `BagrutLogo` — five
// copies of the same star that all had to be edited together. This is the
// single one. Import it; do not re-declare it.
//
// If /logo.png is missing the <img> would render as a broken-image glyph in
// the navbar of a live app, so `onError` swaps in the inline mark below.
// It is a stand-in, not the logo — same palette, none of the detail.

const SIZES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
} as const;

export type LogoSize = keyof typeof SIZES;

export default function MathUpLogo({
  size = 'md',
  className = '',
}: {
  size?: LogoSize;
  className?: string;
}) {
  const [artworkFailed, setArtworkFailed] = useState(false);
  const box = `${SIZES[size]} ${className}`;

  if (artworkFailed) return <FallbackMark className={box} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- needs onError; next/image swallows it
    <img
      // The browser starts fetching during HTML parse, so on a missing file
      // the error fires BEFORE React hydrates and onError is never called —
      // the navbar keeps a broken-image glyph. The ref re-reads the state the
      // element already settled into; onError covers a later failure.
      ref={(el) => {
        if (el?.complete && el.naturalWidth === 0) setArtworkFailed(true);
      }}
      src="/logo.png"
      alt="MathUp"
      className={`${box} object-contain select-none`}
      draggable={false}
      onError={() => setArtworkFailed(true)}
    />
  );
}

/** Brand-coloured stand-in shown only when /logo.png cannot be loaded. */
function FallbackMark({ className }: { className: string }) {
  return (
    <div
      className={`${className} rounded-2xl bg-[#1E1B4B] flex items-center justify-center ring-1 ring-slate-900/10 shadow-lg shadow-violet-900/30`}
      aria-label="MathUp"
      role="img"
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-3/5 h-3/5">
        <defs>
          <linearGradient id="mathup-fallback" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        {/* Open book — two pages meeting at the spine */}
        <path
          d="M12 7.2 C9.6 5.4 6.9 4.8 4 4.8 V17.4 C6.9 17.4 9.6 18 12 19.8 C14.4 18 17.1 17.4 20 17.4 V4.8 C17.1 4.8 14.4 5.4 12 7.2 Z"
          stroke="url(#mathup-fallback)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M12 7.2 V19.8" stroke="url(#mathup-fallback)" strokeWidth="1.6" />
        {/* Circuit nodes */}
        <circle cx="7.4" cy="9.2" r="1" fill="#22D3EE" />
        <circle cx="16.6" cy="9.2" r="1" fill="#8B5CF6" />
      </svg>
    </div>
  );
}
