/**
 * tutor-context.ts — the student snapshot the chat tutor never had.
 *
 * The tutor prompt (lib/tutor-grounding) already tells the model to "diagnose
 * before explaining" and "calibrate to the student" — but the runtime gave it
 * ZERO data to do either. All the signals exist client-side (mistakes, level,
 * pacing, spaced-repetition), they were just never sent.
 *
 * buildStudentSnapshot assembles a compact brief and the chat page ships it as
 * the request's `context` field. The server injects it into the CURRENT turn
 * only (not persisted, doesn't pollute cache/history) — so the tutor knows the
 * student's #1 mistake type, their level/pace, and what they recently got
 * wrong, and can open with a targeted diagnosis instead of a generic hint.
 *
 * ============================================================
 * FORMAT: `key: value` LINES, ENGLISH KEYS, NEVER JSON, NEVER PROSE
 * ============================================================
 * This block rides in the USER message, so it is re-read at FULL PRICE on every
 * single turn — it can never sit in the cached prefix, because it is unique to
 * one student. That makes it the most expensive text the tutor sends per token,
 * and the only one where shortening is worth real money.
 *
 * Three rules, in order of what each saves:
 *
 *  1. KEYS IN ENGLISH, VALUES IN HEBREW. Model-facing Hebrew tokenises 3-4x
 *     worse than English on Haiku (measured in lib/agents/tools.ts: the same
 *     tool block went 4,753 -> 1,139 tokens on language alone). The keys are
 *     labels, not content; the values — topic names, misconception titles, the
 *     student's own words — stay Hebrew because they ARE the content. Output
 *     language is set by the system prompt, not by this block.
 *  2. NO PROSE, NO JSON. The previous version wrote full Hebrew sentences
 *     ("החוליה השבורה: X נשען על Y, והבסיס חלש יותר. אם הוא נתקע — התחל משם"),
 *     which is ~4x the tokens of `weak: X <- Y`. Nested JSON would be worse
 *     still: braces, quotes and repeated key names on every object.
 *  3. THE INSTRUCTIONS MOVED TO THE CACHED PREFIX. Every "אל תאשים אותו בהן" /
 *     "התחל משם ולא מלמעלה" sentence used to be re-sent per turn. They are now
 *     stated ONCE in TUTOR_CORE (see the "מצב התלמיד" block, which documents
 *     these exact keys) and cost 0.1x there. This block is pure DATA.
 *
 * ⚠️ The keys are a contract with that TUTOR_CORE block. Renaming one here
 * without renaming it there leaves the model reading an undocumented field.
 * scripts/test-tutor-brief.ts asserts on the key names for exactly this reason.
 *
 * Pure client/localStorage. Every piece is guarded so one missing signal never
 * breaks the whole brief. Returns '' when there's nothing useful to say, so the
 * server sends no context wrapper at all.
 */

import { topCategory, getMistakes } from '@/lib/mistakes';
import { studentTier, tierLabel } from '@/lib/adaptive';
import { getPlan, getUnitLevel, daysUntilBagrut } from '@/lib/study-plan';
import { dueCount } from '@/lib/review';
import { getCognitiveState, type CognitiveState } from '@/lib/cognition';
import { cognitionEntries } from '@/content/cognition';

/**
 * 1200, down from 1800.
 *
 * The server caps the WHOLE `context` field at MAX_CONTEXT_LEN (4000) and
 * truncates from the END, so this block competes with the focus brief (~800)
 * and the authored solution it carries (≤1200). The compressed format below
 * fits the same signals in roughly a third of the characters, so the old
 * headroom is no longer needed — and a tighter cap means the mistake list can
 * never push the cognitive block out of a turn.
 */
const MAX_LEN = 1200;

/** Below this the state is noise, not a diagnosis. Same reasoning as
 *  MIN_CONFIDENCE in lib/cognition: telling a tutor "he's weak at X" off two
 *  answers turns "we haven't measured" into "you're bad at this". */
const MIN_OBSERVATIONS = 3;

/**
 * The cognitive state to brief the tutor on.
 *
 * Prefers the topic the student is actually looking at. On the generic /chat
 * entry there is no topic, and without this fallback the richest signal the app
 * owns would reach the tutor ONLY from inside a lesson — so we pick whichever
 * mapped topic the student has the most evidence in. `getCognitiveState`
 * returns null for unmapped topics, so this is a no-op until a topic has a
 * catalog in content/cognition (today: complex numbers only).
 */
export function resolveCognitive(subject: string, topic: string): CognitiveState | null {
  if (topic) return getCognitiveState(subject, topic);
  let best: CognitiveState | null = null;
  for (const map of cognitionEntries()) {
    if (map.subject !== subject) continue;
    const st = getCognitiveState(subject, map.topic);
    if (st && (!best || st.totalObservations > best.totalObservations)) best = st;
  }
  return best;
}

/** Trim a possibly-long answer string for the brief. */
function short(s: string | undefined, n = 60): string {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

/**
 * A compact snapshot of what the tutor should know about this student right
 * now. `topic` is the current lesson topic (from ?topic=), or '' on the generic
 * /chat entry — the brief adapts to whichever it gets.
 *
 * Emitted as `key: value` lines under a `STATE` header. See the file header for
 * why, and TUTOR_CORE's "מצב התלמיד" block for what each key means to the model.
 */
export function buildStudentSnapshot(subject: string, topic: string): string {
  const lines: string[] = [];

  // --- level + pace band --------------------------------------------------
  try {
    const unit = getUnitLevel();
    const band = topic ? tierLabel(studentTier(subject, topic)) : null;
    lines.push(`lvl: ${unit}${band ? ` ${band}` : ''}`);
  } catch {
    /* skip */
  }

  // --- days to the exam ---------------------------------------------------
  try {
    const plan = getPlan();
    if (plan?.bagrutDate) {
      const d = daysUntilBagrut(plan);
      if (d >= 0) lines.push(`exam_d: ${d}`);
    }
  } catch {
    /* skip */
  }

  // --- cognitive state: the strongest signal the app owns -----------------
  // lib/cognition already derives skills, active misconceptions, the broken
  // prerequisite and the next step — and none of it reached the tutor, which
  // re-diagnosed from scratch every conversation while the answer sat one
  // import away. Free: same pure function /roadmap renders from, no API call.
  // Placed BEFORE the mistake list on purpose — the brief is truncated at
  // MAX_LEN from the tail, and a long mistake list must not push this out.
  try {
    const cog = resolveCognitive(subject, topic);
    if (cog && cog.totalObservations >= MIN_OBSERVATIONS) {
      // On the generic entry the state may describe a topic the student didn't
      // name. Say so, or the tutor reads it as being about whatever comes up.
      // Always emitted when there IS a scoped finding, so the model never has
      // to infer which topic `weak`/`misc` below are talking about.
      lines.push(`scope: ${cog.topic}`);
      if (cog.insight) lines.push(`insight: ${cog.insight}`);

      const wl = cog.weakestLink;
      // "child leans on root, and the root is the weaker one" — the arrow is
      // the whole sentence. What to DO about it lives in TUTOR_CORE.
      if (wl) lines.push(`weak: ${wl.childTitle} <- ${wl.rootTitle}`);

      const live = cog.misconceptions
        .filter((m) => m.status === 'active' || m.status === 'suspected')
        .slice(0, 2);
      if (live.length) {
        lines.push(
          `misc: ${live.map((m) => `${m.title} ${m.hits}/${m.opportunities}`).join(' · ')}`,
        );
      }

      lines.push(`next: ${cog.nextStep.title} — ${cog.nextStep.reason}`);
    }
  } catch {
    /* skip */
  }

  // --- #1 error type (the whole point of "error-focused feedback") --------
  try {
    const top = topCategory(subject);
    if (top && top.count >= 2) lines.push(`top_err: ${top.category} x${top.count}`);
  } catch {
    /* skip */
  }

  // --- recent wrong answers, prefer this topic ----------------------------
  // One line per mistake, pipe-separated. `ans`/`ok` are 3 tokens between them;
  // the Hebrew "ענה:" / "(נכון:" wrappers they replace were ~8, on every turn.
  try {
    const all = getMistakes(subject);
    const scoped = topic ? all.filter((m) => m.topic === topic) : all;
    const recent = (scoped.length ? scoped : all).slice(0, 3);
    if (recent.length) {
      const items = recent
        .map((m) => {
          const parts = [short(m.questionText, 70)];
          if (m.userAnswer) parts.push(`ans ${short(m.userAnswer, 30)}`);
          if (m.correctAnswer) parts.push(`ok ${short(m.correctAnswer, 30)}`);
          if (m.category && m.category !== 'אחר') parts.push(m.category);
          return `- ${parts.join(' | ')}`;
        })
        .join('\n');
      lines.push(`wrong:\n${items}`);
    }
  } catch {
    /* skip */
  }

  // --- spaced-repetition backlog ------------------------------------------
  try {
    const due = dueCount();
    if (due > 0) lines.push(`due: ${due}`);
  } catch {
    /* skip */
  }

  if (!lines.length) return '';
  // The header is what TUTOR_CORE's key legend keys off. Without it the block
  // is a bare list of English words in the middle of a Hebrew conversation.
  const brief = `STATE\n${lines.join('\n')}`;
  return brief.length > MAX_LEN ? brief.slice(0, MAX_LEN) : brief;
}
