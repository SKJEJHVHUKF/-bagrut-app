/**
 * POST /api/analyze — what is this question, and can we answer it for free?
 *
 * ============================================================
 * THIS ROUTE CANNOT SPEND MONEY
 * ============================================================
 * There is no Anthropic client here, no import that leads to one, and
 * therefore no `logAgentUsage` call — there is nothing to log. It runs
 * `analyzeQuestion`, which is mathjs in-process plus at most one hop to the
 * in-repo SymPy function.
 *
 * That is why it passes `billable: false` to the guard. The route still gets
 * every abuse gate — same-origin, bot UA, IP burst limit, content type, and a
 * real Supabase session — and skips only the three AI quota gates.
 *
 * Skipping them is the POINT, not a shortcut. The global daily brake exists to
 * say "the smart features are paused until tomorrow, the rest of the app is
 * open". Deterministic maths IS the rest of the app. If /api/analyze went dark
 * when the AI budget ran out, the budget brake would be causing the outage it
 * was built to prevent, on the one code path that costs nothing.
 *
 * A student who has spent every paid call today can still scan a question,
 * have it classified, solved, verified and hinted at. That is the whole design.
 */

import { guardAgentRequest, BLACKLIST } from '@/lib/agents/guard';
import {
  analyzeQuestion,
  MAX_QUESTION_CHARS,
  MAX_ANSWER_CHARS,
  type AnalyzeMode,
  type StudentContext,
} from '@/lib/analyze-question';
import type { UnitLevel } from '@/lib/mathscan/types';

/** No model call, but the SymPy hop allows itself 12s. 30 leaves room for a
 *  cold Python start without letting a request hang for the Hobby ceiling. */
export const maxDuration = 30;

const MODES: AnalyzeMode[] = ['hint', 'solve', 'validate', 'explain', 'auto'];
const LEVELS: UnitLevel[] = [3, 4, 5];
/** A weak-topic or recent-mistake list is a hint to the analyser, not an
 *  essay. Capping the count and the length keeps a hostile body from turning
 *  into work. */
const MAX_CONTEXT_ITEMS = 12;
const MAX_CONTEXT_ITEM_CHARS = 80;

function bad(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  // Abuse gates yes, quota gates no. See the file header.
  const gate = await guardAgentRequest(request, {
    // `kind` only selects which rows the quota gates count, and `billable:
    // false` skips those gates entirely — nothing is ever written under it.
    kind: 'check',
    freeDaily: 0,
    proDaily: 0,
    billable: false,
  });
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad('גוף הבקשה אינו JSON תקין');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return bad('גוף הבקשה אינו JSON תקין');
  }
  const payload = body as Record<string, unknown>;

  // ---- question: the one required field -------------------------------
  const question = typeof payload.question === 'string' ? payload.question.trim() : '';
  if (!question) return bad('חסר טקסט השאלה');
  // A hard reject, NOT a truncation. `sanitizeText` would silently slice, and
  // analysing the first 2000 characters of a longer question produces a
  // confident answer to half a question — worse than refusing.
  if (question.length > MAX_QUESTION_CHARS) {
    return bad(`טקסט השאלה ארוך מ-${MAX_QUESTION_CHARS} תווים`);
  }
  // BLACKLIST is the control-character screen, and it deliberately permits
  // tab/newline/CR — a multi-line question is normal, not an attack.
  if (BLACKLIST.test(question)) return bad('טקסט השאלה מכיל תווים לא חוקיים');

  // ---- studentAnswer ---------------------------------------------------
  const studentAnswer =
    typeof payload.studentAnswer === 'string' ? payload.studentAnswer.trim() : '';
  if (studentAnswer.length > MAX_ANSWER_CHARS) {
    return bad(`התשובה ארוכה מ-${MAX_ANSWER_CHARS} תווים`);
  }
  if (studentAnswer && BLACKLIST.test(studentAnswer)) {
    return bad('התשובה מכילה תווים לא חוקיים');
  }

  // ---- requestedMode ---------------------------------------------------
  const rawMode = payload.requestedMode;
  // An unrecognised mode falls back to 'auto' rather than 400: the mode is a
  // preference, and refusing a whole analysis over it would be rude.
  const requestedMode: AnalyzeMode =
    typeof rawMode === 'string' && (MODES as string[]).includes(rawMode)
      ? (rawMode as AnalyzeMode)
      : 'auto';

  // ---- studentContext --------------------------------------------------
  const ctx =
    payload.studentContext && typeof payload.studentContext === 'object' && !Array.isArray(payload.studentContext)
      ? (payload.studentContext as Record<string, unknown>)
      : {};

  // The brief writes level as "3 | 4 | 5 יחידות", so a client may send either
  // the number or the string. Accept both, reject anything else by falling
  // back to 5 — the only level with authored topics today.
  const levelRaw = typeof ctx.level === 'string' ? parseInt(ctx.level, 10) : ctx.level;
  const level: UnitLevel = (LEVELS as number[]).includes(levelRaw as number)
    ? (levelRaw as UnitLevel)
    : 5;

  const studentContext: StudentContext = {
    level,
    knownWeakTopics: stringList(ctx.knownWeakTopics),
    recentMistakes: stringList(ctx.recentMistakes),
  };

  try {
    const analysis = await analyzeQuestion({
      question,
      ...(studentAnswer ? { studentAnswer } : {}),
      requestedMode,
      studentContext,
    });

    return Response.json(analysis, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    // The real error goes to the server log; the client gets a sentence. No
    // message, no stack, no engine internals — a parse failure inside mathjs
    // will happily quote the input back otherwise.
    console.error('analyze error:', error);
    return Response.json({ error: 'לא הצלחנו לנתח את השאלה כרגע. נסו שוב.' }, { status: 500 });
  }
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim().slice(0, MAX_CONTEXT_ITEM_CHARS))
    .filter(Boolean)
    .slice(0, MAX_CONTEXT_ITEMS);
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
