/**
 * rungs.ts — the names of the ladder's steps, and nothing else.
 *
 * ⚠️ THIS FILE EXISTS TO STAY IMPORT-FREE, and that is its whole job.
 *
 * These three constants are needed by BOTH sides: the server validates a
 * teacher's selection against the content corpus (lib/focus-target), and the
 * browser renders "ביסוס" in a dropdown. Keeping them in focus-target meant the
 * client component's `import { RUNG_LABEL }` dragged that module in — and with
 * it `@/content/lessons`, which is the entire authored corpus: every lesson,
 * every question bank, every solution, into the first load of a page that
 * wanted six Hebrew words.
 *
 * A `type` import would have been free (types are erased). A VALUE import is
 * not. The same trap is documented in components/AppChrome.tsx about
 * MATH5_CURRICULUM, which is how it was spotted here.
 *
 * So: no imports in this file, ever. If something here needs one, it belongs in
 * lib/focus-target instead.
 */

/** The rungs of a sub-topic's ladder, in climbing order. Mirrors
 *  RoadmapLevelKind in lib/roadmap-levels — kept as a literal here rather than
 *  imported, for the reason above. */
export const RUNGS = ['learn', 'easy', 'mid', 'hard', 'ghost', 'bagrut'] as const;
export type Rung = (typeof RUNGS)[number];

/** The words the roadmap already shows a student. The teacher's picker and the
 *  student's card read from this one map, so the two can never disagree about
 *  what "ביסוס" means. */
export const RUNG_LABEL: Record<Rung, string> = {
  learn: 'לומדים',
  easy: 'חימום',
  mid: 'ביסוס',
  hard: 'אתגר',
  ghost: 'חשיבה',
  bagrut: 'בגרות',
};
