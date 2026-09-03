/**
 * mastery-scale.ts — the one place a mastery number becomes a colour.
 *
 * ⚠️ IMPORT-FREE, like lib/rungs, so any client component can use it without
 * dragging a module graph into the browser bundle.
 *
 * ---- WHY THIS RAMP ---------------------------------------------------------
 * Two rewrites, and both were about the same mistake in different clothes.
 *
 * The first ran green → amber → orange → red. That is a RAINBOW, and a rainbow
 * is wrong for a magnitude: the hue jumps carry no ordering, so the eye has to
 * consult a legend for every cell instead of reading a gradient.
 *
 * The second was a correct diverging ramp at full saturation — and it looked
 * cheap, because a grid of forty saturated blocks is forty things shouting at
 * once. Colour area is the variable nobody thinks about: the same hue that is
 * elegant on a 24px chip is garish across a table. The fix is not a different
 * hue, it is LESS INK. Only the two extremes carry a solid fill; everything
 * between them is a tint, and the neutral middle is barely there.
 *
 * The two hues are teal and orange rather than the conventional green and red.
 * Red/green is the one pair a red-green colourblind reader cannot separate, and
 * roughly one man in twelve is. Teal still reads as "good" and orange as
 * "warning" to everyone else, so the intuition survives and the problem does
 * not. And colour never carries this alone: every cell and bar shows its own
 * number, so the ramp accelerates the eye rather than being the encoding.
 */

export type MasteryBand = {
  /** Classes for a heatmap cell — background plus readable text. */
  cell: string;
  /** Background for a bar on the same scale. */
  bar: string;
  /** What the band means, in a teacher's words. Shown on hover. */
  label: string;
};

/** ≥ this share of correct answers puts a student in the band. Descending. */
const BANDS: { min: number; band: MasteryBand }[] = [
  {
    min: 0.85,
    band: {
      cell: 'bg-teal-500/30 text-teal-900',
      bar: 'bg-teal-600',
      label: 'שולט',
    },
  },
  {
    min: 0.7,
    band: {
      cell: 'bg-teal-500/12 text-teal-800',
      bar: 'bg-teal-400',
      label: 'כמעט שם',
    },
  },
  {
    // The NEUTRAL midpoint, and almost invisible on purpose. A hue here would
    // imply "a kind of good" or "a kind of bad"; the middle is neither, and a
    // teacher scanning for trouble should not have her eye caught by it.
    min: 0.55,
    band: {
      cell: 'bg-slate-100 text-slate-500',
      bar: 'bg-slate-300',
      label: 'על הגבול',
    },
  },
  {
    min: 0.4,
    band: {
      cell: 'bg-orange-500/12 text-orange-800',
      bar: 'bg-orange-300',
      label: 'מתקשה',
    },
  },
  {
    min: 0,
    band: {
      cell: 'bg-orange-500/30 text-orange-900',
      bar: 'bg-orange-600',
      label: 'תקוע',
    },
  },
];

/** The band for a mastery value. Callers handle `null` themselves — "no data"
 *  is not a band on this scale, it is the absence of one. */
export function masteryCell(mastery: number): MasteryBand {
  for (const b of BANDS) if (mastery >= b.min) return b.band;
  return BANDS[BANDS.length - 1].band;
}

/** The legend, worst to best — the direction a teacher scans for trouble.
 *  "No data" is deliberately not in it; the heatmap shows that separately, as
 *  what it is: outside the scale, not a sixth and worst colour. */
export const MASTERY_LEGEND: { label: string; cell: string }[] = [
  { label: 'מתחת ל-40%', cell: BANDS[4].band.cell },
  { label: '40–55%', cell: BANDS[3].band.cell },
  { label: '55–70%', cell: BANDS[2].band.cell },
  { label: '70–85%', cell: BANDS[1].band.cell },
  { label: '85%+', cell: BANDS[0].band.cell },
];
