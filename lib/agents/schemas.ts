/**
 * agents/schemas.ts — Zod contracts for the two agent routes.
 *
 * `GradeSchema` is passed to Anthropic as a STRUCTURED OUTPUT
 * (`output_config.format` + `zodOutputFormat`), so the model is constrained to
 * emit exactly this shape. No hand-rolled JSON.parse, no repair retries, no
 * wasted tokens on a malformed answer.
 *
 * ⚠️ Structured-output schema limits (Anthropic): numeric bounds
 * (`min`/`max`/`multipleOf`) and string-length bounds are NOT part of the
 * enforced wire schema — the SDK strips them and validates client-side, which
 * would turn an out-of-range score into a *parse failure* instead of a usable
 * grade. So bounds live in prose (`.describe`) + a defensive clamp in the
 * route, never in the schema.
 */

import { z } from 'zod';
import type { ErrorCategory } from '@/lib/mistakes';

/**
 * Error taxonomy — deliberately the SAME union as `ErrorCategory` in
 * lib/mistakes.ts, so a graded solution can be written straight into the
 * student's מחברת טעויות without a translation layer.
 */
export const ERROR_TYPES = [
  'טעות סימן',
  'תחום הגדרה',
  'גזירה פנימית',
  'הנחת יסוד גיאומטרית',
  'טעות אלגברית',
  'טעות חשבונית',
  'שכחת תנאי',
  'אחר',
] as const;

// Compile-time guard: if lib/mistakes.ts ever gains a category, this errors.
const _errorTypesMatchMistakes: readonly ErrorCategory[] = ERROR_TYPES;
void _errorTypesMatchMistakes;

export type ErrorType = (typeof ERROR_TYPES)[number];

/** Coerce whatever the model produced onto the closed set. */
export function toErrorType(raw: unknown): ErrorType {
  const s = typeof raw === 'string' ? raw.trim() : '';
  return (ERROR_TYPES as readonly string[]).includes(s) ? (s as ErrorType) : 'אחר';
}

export const GradeErrorSchema = z.object({
  step: z
    .string()
    .describe('הצעד בפתרון שבו הופיעה הטעות — ציטוט קצר או מספר שורה/סעיף.'),
  // ⚠️ Deliberately `string`, not `z.enum`. A live run proved the model can
  // return a category outside the list even under structured outputs — and
  // because the SDK validates the Zod schema client-side, a strict enum turns
  // that into a THROWN parse error, i.e. a 500 and a wasted paid call. The
  // allowed values are steered by the description below and by the system
  // prompt; anything off-list is coerced to 'אחר' by `toErrorType`.
  errorType: z
    .string()
    .describe(
      `סיווג הטעות. בחר בדיוק אחד מהערכים האלה, מילה במילה: ${ERROR_TYPES.join(' | ')}`
    ),
  description: z
    .string()
    .describe(
      'מה בדיוק שגוי ומה היה צריך להיות, בעברית. מתמטיקה ב-LaTeX בלבד, בלי עברית בתוך $...$.'
    ),
});

export const GradeSchema = z.object({
  score: z
    .number()
    .describe('ציון שלם בין 0 ל-100 לפי אמות המידה של משרד החינוך.'),
  isCorrect: z
    .boolean()
    .describe('האם הפתרון נכון ומלא (ללא טעויות מהותיות).'),
  summary: z
    .string()
    .describe('משפט אחד או שניים: מה התלמיד עשה, ומה הכריע את הציון.'),
  errors: z
    .array(GradeErrorSchema)
    .describe('כל הטעויות שנמצאו, לפי סדר הופעתן. מערך ריק אם הפתרון תקין.'),
  feedback: z
    .string()
    .describe(
      'משוב בונה לתלמיד: הצעד הבא לתיקון + מה לתרגל. בלי לפתור עבורו מחדש. מתמטיקה ב-LaTeX.'
    ),
});

/**
 * Public types are STRICTER than the wire schema: the route narrows
 * `errorType` through `toErrorType` before anything downstream sees it, so
 * consumers (and the מחברת טעויות) can rely on the closed set.
 */
export type GradeError = Omit<z.infer<typeof GradeErrorSchema>, 'errorType'> & {
  errorType: ErrorType;
};
export type Grade = Omit<z.infer<typeof GradeSchema>, 'errors'> & {
  errors: GradeError[];
};

/** What /api/chat/grade returns to the browser (grade + telemetry). */
export type GradeResponse = Grade & {
  unitLevel: 3 | 4 | 5;
  formNumber: string;
  remaining: number;
};

/** One turn in the tutor transcript, as the client sends it back. */
export const TutorTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export type TutorTurn = z.infer<typeof TutorTurnSchema>;

// ============================================================
// Request bodies
// ============================================================
//
// Deliberately split: the fields that MUST be right are typed strictly (a bad
// `message` is a 400), while the scaling knobs are `unknown` and pass through
// `normalizeUnitLevel` / `normalizeFormNumber`. That way a client sending
// `unitLevel: "5"` or a legacy `formNumber: "582"` still works instead of
// being rejected — the API stays forgiving at the edges and strict at the core.

export const TutorRequestSchema = z.object({
  message: z.string(),
  unitLevel: z.unknown().optional(),
  formNumber: z.unknown().optional(),
  topic: z.unknown().optional(),
  /** Snapshot of what the student is working on (see lib/tutor-context.ts). */
  context: z.unknown().optional(),
  /** Client-owned transcript; the route replays only the last few turns. */
  history: z.array(TutorTurnSchema).optional(),
});

export const GradeRequestSchema = z.object({
  solution: z.string(),
  question: z.unknown().optional(),
  unitLevel: z.unknown().optional(),
  formNumber: z.unknown().optional(),
  topic: z.unknown().optional(),
});
