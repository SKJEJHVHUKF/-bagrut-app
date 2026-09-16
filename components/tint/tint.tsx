// The soft-tint card language (design round 10, direction ב — Itay's pick,
// 2026-09-15): a diagonal wash from one pastel into white, a same-hue
// translucent border, a shadow tinted with the solid colour plus an inner
// highlight, and a soft pill badge. One colour drives every value, so a screen
// only picks a Tint.

import type { CSSProperties, ReactNode } from 'react';

export type Tint = { bg: string; line: string; solid: string; ink: string };

export const TINTS = {
  green: { bg: '#E7F6EC', line: '#3DA85A', solid: '#2F8F4A', ink: '#1E6B35' },
  blue: { bg: '#E6F0FB', line: '#3B82C4', solid: '#2A6FB5', ink: '#1E4E80' },
  gold: { bg: '#FDF5DE', line: '#C4940F', solid: '#B8860B', ink: '#7A5B08' },
  rose: { bg: '#FDEDF1', line: '#E0567A', solid: '#D23F66', ink: '#9B1C43' },
  violet: { bg: '#F2ECFF', line: '#8B5CF6', solid: '#7C3AED', ink: '#5B21B6' },
  slate: { bg: '#F1F2F5', line: '#8A93A6', solid: '#5B6478', ink: '#353B48' },
} satisfies Record<string, Tint>;

/** `#RRGGBB` at an alpha. */
export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Background, border and shadow of a tint card. Pair with `rounded-[20px] border`. */
export function tintCard(t: Tint, washEnd = 78): CSSProperties {
  return {
    background: `linear-gradient(155deg, ${t.bg} 0%, #FFFFFF ${washEnd}%)`,
    borderColor: hexA(t.line, 0.45),
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 14px 30px -18px ${hexA(t.solid, 0.45)}`,
  };
}

/** tintCard plus the colours as CSS variables, for components whose shape
 *  lives in a stylesheet (`var(--tint-line)` for a selected outline, …). */
export function tintVars(t: Tint): CSSProperties {
  return {
    ...tintCard(t),
    ['--tint-line' as string]: t.line,
    ['--tint-solid' as string]: t.solid,
    ['--tint-ink' as string]: t.ink,
  } as CSSProperties;
}

/** One colour per topic, in syllabus order (track tiles, quiz topics). */
export const TOPIC_TINTS: Tint[] = [TINTS.green, TINTS.blue, TINTS.gold, TINTS.rose, TINTS.violet, TINTS.slate];

export function TintBadge({ tint, children }: { tint: Tint; children: ReactNode }) {
  return (
    <span
      className="rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap border"
      style={{ background: hexA(tint.solid, 0.12), color: tint.ink, borderColor: hexA(tint.solid, 0.25) }}
    >
      {children}
    </span>
  );
}

/** The design's typeface (Rubik, registered in app/layout.tsx); set it on a redesigned screen's root. */
export const TINT_FONT: CSSProperties = { fontFamily: 'var(--font-rubik), var(--font-heebo), Arial, sans-serif' };
