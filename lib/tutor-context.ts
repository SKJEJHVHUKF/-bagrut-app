/**
 * tutor-context.ts — the student snapshot the chat tutor never had.
 *
 * The tutor prompt (lib/tutor-grounding) already tells the model to "diagnose
 * before explaining" and "calibrate to the student" — but the runtime gave it
 * ZERO data to do either. All the signals exist client-side (mistakes, level,
 * pacing, spaced-repetition), they were just never sent.
 *
 * buildStudentSnapshot assembles a compact Hebrew brief and the chat page ships
 * it as the request's `context` field. The server injects it into the CURRENT
 * turn only (not persisted, doesn't pollute cache/history) — so the tutor knows
 * the student's #1 mistake type, their level/pace, and what they recently got
 * wrong, and can open with a targeted diagnosis instead of a generic hint.
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

const MAX_LEN = 1800; // server hard-caps context at 2000; stay safely under

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
 * A compact Hebrew snapshot of what the tutor should know about this student
 * right now. `topic` is the current lesson topic (from ?topic=), or '' on the
 * generic /chat entry — the brief adapts to whichever it gets.
 */
export function buildStudentSnapshot(subject: string, topic: string): string {
  const lines: string[] = [];

  // --- level + pace band --------------------------------------------------
  try {
    const unit = getUnitLevel();
    const band = topic ? tierLabel(studentTier(subject, topic)) : null;
    lines.push(`רמה: ${unit} יחידות${band ? ` · ${band}` : ''}.`);
  } catch {
    /* skip */
  }

  // --- days to the exam ---------------------------------------------------
  try {
    const plan = getPlan();
    if (plan?.bagrutDate) {
      const d = daysUntilBagrut(plan);
      if (d >= 0) lines.push(`נשארו ${d} ימים לבגרות.`);
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
      if (!topic) lines.push(`המידע הבא הוא על הנושא "${cog.topic}":`);
      if (cog.insight) lines.push(cog.insight);

      const wl = cog.weakestLink;
      if (wl) {
        lines.push(
          `החוליה השבורה: "${wl.childTitle}" נשען על "${wl.rootTitle}", והבסיס חלש יותר. אם הוא נתקע — התחל משם ולא מלמעלה.`
        );
      }

      const live = cog.misconceptions
        .filter((m) => m.status === 'active' || m.status === 'suspected')
        .slice(0, 2);
      if (live.length) {
        const items = live
          .map((m) => `"${m.title}" (${m.hits} מתוך ${m.opportunities} הזדמנויות)`)
          .join(' · ');
        lines.push(`תפיסות שגויות שחוזרות אצלו: ${items}. אל תאשים אותו בהן — בדוק אם הן עדיין שם.`);
      }

      lines.push(`הצעד שהמערכת ממליצה עליו: ${cog.nextStep.title} — ${cog.nextStep.reason}`);
    }
  } catch {
    /* skip */
  }

  // --- #1 error type (the whole point of "error-focused feedback") --------
  try {
    const top = topCategory(subject);
    if (top && top.count >= 2) {
      lines.push(`הטעות הכי שכיחה שלו: ${top.category} (${top.count} פעמים).`);
    }
  } catch {
    /* skip */
  }

  // --- recent wrong answers, prefer this topic ----------------------------
  try {
    const all = getMistakes(subject);
    const scoped = topic ? all.filter((m) => m.topic === topic) : all;
    const recent = (scoped.length ? scoped : all).slice(0, 3);
    if (recent.length) {
      const items = recent
        .map((m) => {
          const q = short(m.questionText, 70);
          const wrong = m.userAnswer ? ` ענה: "${short(m.userAnswer, 30)}"` : '';
          const right = m.correctAnswer ? ` (נכון: "${short(m.correctAnswer, 30)}")` : '';
          const cat = m.category && m.category !== 'אחר' ? ` [${m.category}]` : '';
          return `• ${q}${wrong}${right}${cat}`;
        })
        .join('\n');
      lines.push(`טעויות אחרונות${topic ? ' בנושא' : ''}:\n${items}`);
    }
  } catch {
    /* skip */
  }

  // --- spaced-repetition backlog ------------------------------------------
  try {
    const due = dueCount();
    if (due > 0) lines.push(`יש לו ${due} שאלות לחזרה שממתינות (Leitner).`);
  } catch {
    /* skip */
  }

  if (!lines.length) return '';
  const brief = lines.join('\n');
  return brief.length > MAX_LEN ? brief.slice(0, MAX_LEN) : brief;
}
