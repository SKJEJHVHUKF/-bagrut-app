/**
 * teach/schemas.ts — Zod contracts for /api/teach.
 *
 * `TeachReplySchema` is handed to Anthropic as a STRUCTURED OUTPUT
 * (`output_config.format` + `zodOutputFormat`), so one call produces both the
 * classmate's reply AND the rubric-coverage judgement. The end-of-session
 * report is then computed on the client from the accumulated ids at zero
 * additional cost — there is no second "grade it" call.
 *
 * ⚠️ Same hard-won rule as lib/agents/schemas.ts: describe value constraints in
 * prose, never as `z.enum` / numeric bounds. The SDK validates the parsed JSON
 * against the Zod schema CLIENT-side and THROWS on a mismatch, so a strict enum
 * turns an off-list value into a 500 on a call that was already paid for.
 * Everything is narrowed in the route instead (see `coerceCoveredIds`).
 */

import { z } from 'zod';

/** One turn of the teaching transcript, as the client replays it. */
export const TeachTurnSchema = z.object({
  // Safe as an enum: this is OUR client's request body, not model output.
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export type TeachTurn = z.infer<typeof TeachTurnSchema>;

export const TeachRequestSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  subTopicId: z.string(),
  /** The student's explanation. Empty on the opening turn, where the classmate
   *  speaks first with its initial confusion. */
  message: z.string(),
  /** Client-owned transcript; the route replays only the last few turns. */
  history: z.array(TeachTurnSchema).optional(),
  /** Rubric points covered so far, accumulated by the client. Steers the
   *  classmate to probe something NEW instead of re-asking what's settled. */
  covered: z.array(z.string()).optional(),
  unitLevel: z.unknown().optional(),
  formNumber: z.unknown().optional(),
});

export const TeachReplySchema = z.object({
  reply: z
    .string()
    .describe(
      'מה שנועה אומרת עכשיו, בגוף ראשון, בעברית. 1-3 משפטים. שאלה אחת בלבד בסוף.'
    ),
  coveredPointIds: z
    .array(z.string())
    .describe(
      'מזהי נקודות הרובריקה שההסבר האחרון של התלמיד כיסה, מתוך הרשימה שניתנה לך בלבד. מערך ריק אם לא כוסתה אף נקודה. אל תמציא מזהים.'
    ),
  probeTargetId: z
    .string()
    .describe(
      'מזהה הנקודה שהשאלה שלך מכוונת אליה. מחרוזת ריקה אם השאלה לא מכוונת לנקודה מסוימת.'
    ),
  understood: z
    .boolean()
    .describe('האם נועה הבינה את הרעיון — true רק כשההסבר באמת כיסה את מה ששאלת עליו.'),
});

/** What /api/teach returns to the browser. `covered` is already narrowed onto
 *  the closed set of real rubric ids, so the client can trust it. */
export type TeachResponse = {
  reply: string;
  /** Newly covered this turn (narrowed). The client unions it with its own set. */
  covered: string[];
  probeTargetId: string | null;
  understood: boolean;
  /** Calls left today after this one. */
  remaining: number;
};
