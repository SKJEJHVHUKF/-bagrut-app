/**
 * agents/config.ts — the single source of truth for the multi-agent tier.
 *
 * Two agents share this config:
 *   • TUTOR  (/api/chat/tutor)  — Socratic, streaming, cheap model.
 *   • GRADER (/api/chat/grade)  — structured JSON evaluation, stronger model.
 *
 * SCALABILITY: every request carries `unitLevel` (3 | 4 | 5) and `formNumber`
 * (free-form שאלון string). Nothing here is hard-coded to 5 units — adding
 * 3/4-unit support later is a body parameter, not a code change.
 */

// ============================================================
// Unit level (יחידות לימוד)
// ============================================================

/** Matches `UnitLevel` in lib/study-plan.ts so client state maps 1:1. */
export type UnitLevel = 3 | 4 | 5;

export const DEFAULT_UNIT_LEVEL: UnitLevel = 5;

export function normalizeUnitLevel(raw: unknown): UnitLevel {
  const n = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
  return n === 3 || n === 4 || n === 5 ? n : DEFAULT_UNIT_LEVEL;
}

// ============================================================
// Form number (מספר שאלון)
// ============================================================

/**
 * Default שאלון.
 *
 * ⚠️ This is '572', NOT '581'. Israeli schools moved from 581/582 to 571/572,
 * and the whole app followed: `BagrutPaper` in content/bagrut-curriculum.ts is
 * `'571' | '572'`, and roadmapData's DEFAULT_PAPER is '572'. Defaulting the API
 * to a שאלון the content layer no longer knows about would silently produce
 * prompts that don't match any topic list.
 */
export const DEFAULT_FORM_NUMBER = '572';

/**
 * Legacy renumbering, mirroring `normalizePaper` in lib/study-plan.ts so a
 * stale localStorage value ('581'/'582') keeps working end to end.
 */
const LEGACY_FORMS: Record<string, string> = { '581': '571', '582': '572' };

/**
 * Accepts ANY 3-4 digit שאלון so 3-unit forms (e.g. '35381') and future
 * numbering drop in without touching this file. Non-numeric input falls back
 * to the default rather than reaching the model as free text.
 */
export function normalizeFormNumber(raw: unknown): string {
  const s = typeof raw === 'string' || typeof raw === 'number' ? String(raw).trim() : '';
  if (!/^\d{3,5}$/.test(s)) return DEFAULT_FORM_NUMBER;
  return LEGACY_FORMS[s] ?? s;
}

// ============================================================
// Model tiering — the main cost lever
// ============================================================

/**
 * TUTOR → Haiku 4.5. High-volume, conversational, one hint at a time.
 *
 * ⚠️ Haiku 4.5 REJECTS `output_config.effort` with a 400
 * ("This model does not support the effort parameter"). It is Sonnet/Opus 4.6+
 * only. Never add an effort valve to the tutor call — Haiku is the cheap tier
 * anyway, so there is nothing to save.
 */
export const TUTOR_MODEL = 'claude-haiku-4-5';

/**
 * GRADER → Sonnet 5. Chosen deliberately over Sonnet 4.6:
 *   • Sonnet 4.6 does NOT support structured outputs (`output_config.format`),
 *     so grading would need hand-rolled JSON parsing + retries — retries cost
 *     real money. Sonnet 5 guarantees the schema on the first call.
 *   • Same $3/$15 list price, currently at $2/$10 introductory pricing.
 */
export const GRADER_MODEL = 'claude-sonnet-5';

/**
 * Effort valve for the grader (Sonnet 5 supports low → max).
 * Default 'low': grading one solution against a rubric is a scoped task, and
 * the JSON schema already forces a step-by-step pass. Raise via env if the
 * grades feel shallow — expect roughly linear cost growth.
 */
const EFFORT_VALUES = ['low', 'medium', 'high'] as const;
export type GraderEffort = (typeof EFFORT_VALUES)[number];

export function graderEffort(): GraderEffort {
  const raw = (process.env.AGENT_GRADER_EFFORT ?? '').trim() as GraderEffort;
  return EFFORT_VALUES.includes(raw) ? raw : 'low';
}

/**
 * Sonnet 5 runs ADAPTIVE THINKING when `thinking` is omitted — a silent
 * default change from Sonnet 4.6, and one that spends tokens. We always send
 * it explicitly. Adaptive is on by default here because a mis-graded solution
 * costs more trust than it saves money; set AGENT_GRADER_THINKING=disabled to
 * turn it off.
 */
export function graderThinking(): { type: 'adaptive' } | { type: 'disabled' } {
  return (process.env.AGENT_GRADER_THINKING ?? '').trim() === 'disabled'
    ? { type: 'disabled' }
    : { type: 'adaptive' };
}

// ============================================================
// Token + input caps (Vercel Hobby caps functions at 60s)
// ============================================================

/** One Socratic hint, not a wall of text. ~5-15s on Haiku. */
export const TUTOR_MAX_TOKENS = 800;

/** Thinking + the JSON verdict. Streamed, so no HTTP timeout risk. */
export const GRADER_MAX_TOKENS = 3000;

export const MIN_MESSAGE_LEN = 3; // reject "?" / "hi" before spending a call
export const MAX_MESSAGE_LEN = 800;
export const MAX_SOLUTION_LEN = 4000;
export const MAX_QUESTION_LEN = 2000;
export const MAX_TOPIC_LEN = 80;
export const MAX_CONTEXT_LEN = 2000;

/** Turns of history replayed to the tutor (3 user/assistant pairs). */
export const TUTOR_HISTORY_TURNS = 6;

// ============================================================
// Quotas
// ============================================================

/** The user-facing "max 20 requests per user per hour" ceiling. */
export const AGENT_HOURLY_LIMIT = 20;

/**
 * Daily caps for the grader — the expensive agent. Tutor reuses the chat caps.
 *
 * Measured cost: ~1.5-2¢ per grade (the JSON verdict itself is ~750 output
 * tokens, which dominates). At 5/day a single heavy free user tops out around
 * 10¢/day; the whole Anthropic budget is ~$5/month, so this is the number to
 * turn down first if the bill climbs.
 */
export const FREE_DAILY_GRADE = 5;
export const PRO_DAILY_GRADE = 40;

/** `ai_generation_log.kind` values written by these routes. */
export type AgentKind = 'tutor' | 'grade';
