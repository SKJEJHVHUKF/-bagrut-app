/**
 * agents/tools.ts — the two things the tutor may do besides talk.
 *
 * ============================================================
 * THE RULE THIS FILE EXISTS TO ENFORCE
 * ============================================================
 * A tool call here NEVER mutates the student's study state and NEVER carries a
 * URL the model wrote. The model contributes intent ("practice this", "he told
 * me his exam is on the 12th"); the SERVER resolves that intent against real
 * content and drops anything it cannot resolve.
 *
 * Why: structured tool schemas enforce SHAPE, not VALUES — the same lesson
 * lib/teach/prompt.ts learned when `coerceCoveredIds` had to filter key-point
 * ids the model had invented. A schema saying `subTopic: string` does not stop
 * the model returning a sub-topic that does not exist, and an unresolved
 * suggestion rendered as a button is a student clicking through to a 404.
 *
 * So: `resolveSuggestion` returns null on anything it cannot match, and the
 * caller renders nothing. A missing button is a non-event; a wrong one is a
 * broken promise from something the student is told is their tutor.
 *
 * ⚠️ COST — tools are serialised into the cached prefix BEFORE the system
 * blocks. Adding, removing or editing anything in TUTOR_TOOLS therefore
 * invalidates every existing tutor cache entry once, on deploy. That is a
 * one-off; afterwards the definitions ride the same cached prefix as
 * TUTOR_CORE and cost nothing per turn. Re-run scripts/measure-cache.ts after
 * editing, exactly as prompts.ts requires.
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import { getSubTopics } from '@/content/lessons';
import { hasGhostReplay } from '@/content/ghost-replay';

/** Actions the client knows how to render. Anything else is dropped. */
export type SuggestionKind = 'practice' | 'review' | 'replay';

const KINDS: readonly SuggestionKind[] = ['practice', 'review', 'replay'] as const;

/** What reaches the client. `href` is always server-built. */
export type ResolvedSuggestion = {
  kind: SuggestionKind;
  label: string;
  reason: string;
  href: string;
};

/**
 * ⚠️ These descriptions are in ENGLISH while everything the tutor says is in
 * Hebrew — deliberately, and it is worth ~600 tokens on EVERY turn.
 *
 * MEASURED with the free token-counting endpoint, not estimated — total cost of
 * TUTOR_TOOLS in the prefix, same guardrails, only the language changed:
 *
 *                          claude-sonnet-4-6   claude-haiku-4-5
 *   Hebrew descriptions         1,453 tok          4,753 tok
 *   English descriptions        1,006 tok          1,139 tok
 *
 * Of which 531 tokens (Sonnet) is fixed tool-use overhead that no wording can
 * remove. So the descriptions themselves went 922 → 475 on Sonnet, and the
 * Haiku path — the model the UNGROUNDED chat picks, i.e. the cheap default —
 * dropped by 76%. Hebrew tokenises far worse than English, and worst of all on
 * the small model.
 * Output language is set by the system prompt, not by the schema: the model
 * reads an English schema and answers the student in Hebrew exactly as before.
 * Only the VALUES that must be Hebrew say so explicitly.
 *
 * The pre-measurement estimate for this whole block was ~350 tokens. It was off
 * by more than 10× on the Haiku path. Do not re-estimate it; re-run the script.
 *
 * ⚠️ TRIMMING THIS BLOCK SAVES ALMOST NOTHING, AND CAN COST A LOT.
 * MEASURED 2026-08-26 after a wording pass: 1,139 → 1,035 on Haiku, i.e. 104
 * tokens — and the whole block is inside the CACHED prefix, read at 0.1x. That
 * is ~10 token-equivalents a turn, well under $0.00002. Meanwhile the same 104
 * tokens count against Haiku's 4,096-token cache minimum, where being short is
 * not a saving but a 10x loss (see lib/agents/prompts.ts). So the descriptions
 * below are written for PRECISION, not for brevity: `subTopicTitle` in
 * particular is the only thing standing between the model and an invented
 * sub-topic. Shorten nothing here without re-running `npm run measure:cache`
 * and confirming the ungrounded prefix still clears 4,096.
 */
export const TUTOR_TOOLS: Tool[] = [
  {
    name: 'suggest_action',
    description:
      'Offer one in-app action when practising would now help more than another explanation. ' +
      'A suggestion only: the student sees a button and decides. Answer first, then suggest. ' +
      'At most once per reply, and only for a reason arising from this conversation.',
    input_schema: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: ['practice', 'review', 'replay'],
          description:
            'practice = drill a sub-topic; review = the spaced-repetition queue; ' +
            'replay = guided walk through one question (few sub-topics have one)',
        },
        subTopicTitle: {
          type: 'string',
          // The one description that must NOT be shortened further: it is the
          // only thing standing between the model and an invented sub-topic,
          // and resolveSuggestion below drops the whole button when it misses.
          description:
            'practice/replay only: the sub-topic title in Hebrew, EXACTLY as written in the ' +
            'verified material given to you. Never invent or rephrase. Omit for review.',
        },
        label: {
          type: 'string',
          description: 'Button text, Hebrew, max 4 words, imperative. e.g. "נתרגל דה-מואבר"',
        },
        reason: {
          type: 'string',
          description: 'One Hebrew sentence to the student: why this, why now.',
        },
      },
      required: ['kind', 'label', 'reason'],
    },
  },
  {
    name: 'remember',
    description:
      'Store one durable fact about this student — exam date, a topic they said they find hard, ' +
      'how they prefer to be taught, what their class teacher does differently. Only facts still ' +
      'true in two weeks. NOT the current question, an answer they gave, a mood ("he is ' +
      'frustrated"), or anything the app already measures (scores, mistakes, accuracy).',
    input_schema: {
      type: 'object',
      properties: {
        fact: {
          type: 'string',
          description: 'One short Hebrew sentence, third person. e.g. "המבחן שלו ב-12 במרץ."',
        },
      },
      required: ['fact'],
    },
  },
];

/** Normalise for title matching: strip niqqud-ish noise, quotes and spacing. */
function norm(s: string): string {
  return s
    .replace(/["'׳״]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Turn a raw `suggest_action` input into something safe to render, or null.
 *
 * Every failure mode returns null rather than a best guess: an unknown kind, a
 * sub-topic title that matches no real module, a practice suggestion with no
 * topic in scope. The caller sends no action frame and the reply is still a
 * perfectly good answer — the button was never load-bearing.
 */
export function resolveSuggestion(
  raw: unknown,
  subject: string,
  topic: string,
): ResolvedSuggestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const input = raw as Record<string, unknown>;

  const kind = String(input.kind ?? '') as SuggestionKind;
  if (!KINDS.includes(kind)) return null;

  const label = String(input.label ?? '').trim().slice(0, 40);
  const reason = String(input.reason ?? '').trim().slice(0, 200);
  if (!label || !reason) return null;

  if (kind === 'review') {
    // The one destination that needs no content lookup — it is the whole queue.
    return { kind, label, reason, href: '/roadmap/review' };
  }

  // practice / replay both need a real sub-topic to point at.
  if (!topic) return null;
  const wanted = norm(String(input.subTopicTitle ?? ''));
  if (!wanted) return null;

  let subTopics;
  try {
    subTopics = getSubTopics(subject, topic);
  } catch {
    return null;
  }
  if (!subTopics?.length) return null;

  // Exact normalised title first; a contains-match second, because the model
  // tends to return "ההצגה הקוטבית" for a module titled "הצגה קוטבית". Both
  // sides of the contains check are required to be non-trivial, so a one-word
  // title cannot swallow an unrelated module.
  const hit =
    subTopics.find((st) => norm(st.title) === wanted) ??
    subTopics.find((st) => {
      const t = norm(st.title);
      return wanted.length >= 4 && (t.includes(wanted) || wanted.includes(t));
    });
  if (!hit) return null;

  // The 🧠 rung only exists on sub-topics that have an authored replay — it is
  // added per sub-topic, not per topic. Suggesting it elsewhere sends the
  // student to a level that isn't on their ladder. Only 5 sub-topics have one
  // today, so the model WILL guess wrong here; the guard is not theoretical.
  if (kind === 'replay' && !hasGhostReplay(subject, topic, hit.id)) return null;

  const base = `/roadmap/${encodeURIComponent(hit.id)}`;
  return {
    kind,
    label,
    reason,
    // 'ghost' is the thinking-walkthrough rung; 'mid' is ordinary practice.
    href: kind === 'replay' ? `${base}?level=ghost` : `${base}?level=mid`,
  };
}
