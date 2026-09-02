/**
 * measure-suggested-prompts.ts — every prompt the app OFFERS, priced.
 *
 *   npx tsx scripts/measure-suggested-prompts.ts
 *
 * FREE. Pure functions plus authored content; no API call.
 *
 * ============================================================
 * WHY THIS EXISTS
 * ============================================================
 * A button the app itself offers is a prompt WE chose. Paying a model to
 * answer it is paying for something we could have written. "תסביר לי משהו
 * מהחומר" was billed on every tap for a reply that could only ever be "which
 * topic?" — see lib/topic-overview.chooseTopicPrompt. This measures whether any
 * of the others are in the same position.
 *
 * ⚠️ EVERY PROMPT IS READ OUT OF ITS SOURCE FILE, never retyped here.
 * A hardcoded copy passes forever while the button says something else and
 * bills for it — the same rule scripts/test-topic-overview.ts follows for
 * IDLE_PROMPTS. `focusPrompts` is a function, so it is imported and called.
 *
 * ⚠️ THE CHAIN BELOW IS TutorBubble.send's ORDER, NOT A TIDIER ONE.
 * The verdict is "which layer answers FIRST", so a reordered copy measures a
 * tutor that does not exist. Read components/tutor/TutorBubble.tsx §send.
 *
 * ⚠️ TWO SURFACES DO NOT RUN THIS CHAIN AT ALL.
 * app/chat/page.tsx §send and components/scan/QuestionTutor.tsx §send go
 * straight to the API. Their prompts are priced here against the chain anyway,
 * because that answers the only question worth asking: is the reply knowable in
 * advance, or does it need the model?
 */

import { readFileSync } from 'node:fs';

import { routeMessage, canonicalFor } from '../lib/tutor-router';
import { metaAnswer } from '../lib/tutor-meta-asks';
import { examMetaAnswer } from '../lib/tutor-exam-meta';
import { answerLocally } from '../lib/tutor-local';
import { resolveTopic, isVagueAsk, isTopicOnly } from '../lib/resolve-topic';
import { PLAN_ASK_FOR_TEST } from '../lib/tutor-plan-answer';
import { canonicalIntent } from '../lib/tutor-intent';
import { offTopicRedirect } from '../lib/off-topic';
import { focusPrompts, type TutorFocus } from '../lib/tutor-presence';
import { getLesson } from '../content/lessons';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

// ------------------------------------------------------------
// 1. the prompts the app offers, read from source
// ------------------------------------------------------------

/** Hebrew single-quoted literals inside `slice` of `file`. */
function literals(file: string, from: RegExp): string[] {
  const src = readFileSync(file, 'utf8');
  const body = from.exec(src)?.[1] ?? '';
  return [...body.matchAll(/'([^']*)'/g)]
    .map((m) => m[1])
    .filter((s) => /[֐-׿]/.test(s));
}

const GENERIC = literals('lib/tutor-greeting.ts', /export const GENERIC_PROMPTS = \[([^\]]*)\]/);
const IDLE = literals('components/tutor/TutorBubble.tsx', /const IDLE_PROMPTS = \[([^\]]*)\]/);
// The scan tutor's openers. Two are unconditional, three are keyed to what the
// scan found; the fourth is a template literal naming a step and is skipped —
// it is not a fixed string, so there is nothing to author against it.
const SCAN = literals(
  'lib/mathscan/tutor-client.ts',
  /export function suggestedQuestions[\s\S]*?\{([\s\S]*?)\n\}/,
);

// ------------------------------------------------------------
// 2. the focus each prompt is actually shown under
// ------------------------------------------------------------

/**
 * A REAL authored question, not a fabricated one.
 *
 * `focusPrompts`' question and wrong-answer chips are only ever drawn when a
 * question is on screen, so pricing them against `focus = null` would report
 * PAID for buttons that cannot be tapped in that state — a false alarm. The
 * question comes out of content/ so the local templates are filled from the
 * same material a student would be looking at.
 */
function realFocus(topic: string): { q: TutorFocus; wrong: TutorFocus } | null {
  const lesson = getLesson('math5', topic);
  const sub = (lesson?.subTopics ?? []).find(
    (s: SubTopic) => s.questions?.some((q) => q.hint && q.solution?.steps?.length),
  );
  const question = sub?.questions.find(
    (q: PracticeQuestion) => q.hint && q.solution?.steps?.length,
  );
  if (!sub || !question) return null;

  const q: TutorFocus = {
    where: `תרגול · ${sub.title}`,
    topic,
    subTopicId: sub.id,
    questionText: question.question,
    question,
    subTopic: sub,
  };
  return {
    q,
    wrong: {
      ...q,
      wrongAnswer: 'לא יודע',
      correctAnswer: question.solution.finalAnswer,
    },
  };
}

const TOPIC = 'הסתברות';
const real = realFocus(TOPIC);
if (!real) {
  console.log(`\nx  no authored question found under ${TOPIC} — the measurement cannot run\n`);
  process.exitCode = 1;
}

/** A roadmap/plan screen: a topic, and no exercise. */
const topicOnlyFocus: TutorFocus = { where: `מפת הלמידה · ${TOPIC}`, topic: TOPIC };

// ------------------------------------------------------------
// 3. the chain, in TutorBubble.send's order
// ------------------------------------------------------------

type Verdict = { layer: string; free: boolean };

const PAID: Verdict = { layer: 'ANTHROPIC API', free: false };

async function chain(text: string, focus: TutorFocus | null): Promise<Verdict> {
  const hasQuestion = Boolean(focus?.question);
  let probe = text;

  const route = routeMessage(text, focus, {});
  if (route.kind === 'ack') return { layer: 'router:ack', free: true };
  // 'answer' grades a typed value against a spec. A suggested prompt is never
  // a value, so that branch is unreachable here by construction.
  if (route.kind === 'ask') probe = canonicalFor(route.ask);

  if (metaAnswer(text, { hasQuestion })) return { layer: 'meta-asks', free: true };
  if (examMetaAnswer(text, focus?.topic)) return { layer: 'exam-meta', free: true };

  const local = answerLocally(probe, focus, []);
  if (local) {
    return { layer: `tutor-local:${local.kind}${local.fallback ? '/fallback' : ''}`, free: true };
  }

  const cardTopic = focus?.topic || resolveTopic(text) || '';

  // Two doors into the same banks, and which one opens is the safety model —
  // see the comments in TutorBubble.send and scripts/test-general-faq.ts.
  if (focus?.question && focus.topic) {
    try {
      const { answerFromFaq } = await import('../lib/tutor-faq');
      const hit = await answerFromFaq(text, focus);
      if (hit) return { layer: `faq:question ${hit.faqId}`, free: true };
    } catch {
      /* no bank for this topic yet */
    }
  } else {
    try {
      const { answerTopicFaq } = await import('../lib/tutor-faq');
      const hit = await answerTopicFaq(text, cardTopic || null);
      if (hit) return { layer: `faq:topic ${hit.faqId}`, free: true };
    } catch {
      /* no bank for this topic yet */
    }
  }

  if (!focus?.question && !cardTopic && isVagueAsk(text)) {
    return { layer: 'chooseTopicPrompt', free: true };
  }

  if (!focus?.question && cardTopic && isTopicOnly(text)) {
    try {
      const { topicOverview } = await import('../lib/topic-overview');
      if (await topicOverview(cardTopic)) return { layer: 'topicOverview', free: true };
    } catch {
      /* nothing authored for this topic */
    }
  }

  if (!focus?.question) {
    try {
      const { answerGeneralFaq } = await import('../lib/tutor-faq');
      const hit = await answerGeneralFaq(text);
      if (hit) return { layer: `faq:general ${hit.faqId}`, free: true };
    } catch {
      /* the general bank is optional */
    }
  }

  // The response compiler sits here, behind `tutorFlag('compiler')` — off for
  // everyone until a student sets the localStorage flag by hand. Not counted:
  // this measures what the app bills today.

  // ⚠️ THE PATTERN, NOT `planAnswer`. `planAnswer` calls `buildTodayPlan`,
  // which needs localStorage; in node it always returns null, so calling it
  // would report PAID for a button that is free on a real device. It is also
  // null for a student with NO plan yet — flagged rather than hidden.
  if (!hasQuestion && PLAN_ASK_FOR_TEST.test(text.trim())) {
    return { layer: 'plan-answer (needs a non-empty plan)', free: true };
  }

  if (canonicalIntent(text, undefined).intent === 'study_tips') {
    return { layer: 'study-tips', free: true };
  }

  const redirect = offTopicRedirect(
    text,
    focus?.question ? `${focus.question.question} ${focus.topic ?? ''}` : undefined,
  );
  if (redirect) return { layer: 'off-topic', free: true };

  return PAID;
}

// ------------------------------------------------------------
// 4. the table
// ------------------------------------------------------------

type Row = { surface: string; shown: string; prompt: string; focus: TutorFocus | null };

const rows: Row[] = [
  // /chat's empty state. `greeting.prompts` = up to 3 personal lines from the
  // student's own state, topped up from GENERIC_PROMPTS. Only the generic four
  // are fixed strings; the personal ones are measured separately below.
  ...GENERIC.map((prompt) => ({
    surface: '/chat empty state',
    shown: 'always (no chain on this surface)',
    prompt,
    focus: null,
  })),
  // The bubble, on any screen that publishes no question and no topic.
  ...IDLE.map((prompt) => ({
    surface: 'TutorBubble idle',
    shown: 'no question, no topic',
    prompt,
    focus: null,
  })),
  ...(real
    ? [
        ...focusPrompts(real.wrong).map((prompt) => ({
          surface: 'TutorBubble chips',
          shown: 'after a wrong answer',
          prompt,
          focus: real.wrong,
        })),
        ...focusPrompts(real.q).map((prompt) => ({
          surface: 'TutorBubble chips',
          shown: 'a question on screen',
          prompt,
          focus: real.q,
        })),
      ]
    : []),
  ...focusPrompts(topicOnlyFocus).map((prompt) => ({
    surface: 'TutorBubble chips',
    shown: 'a topic, no question',
    prompt,
    focus: topicOnlyFocus,
  })),
  ...SCAN.map((prompt) => ({
    surface: '/scan solution',
    shown: 'after a scan (no chain on this surface)',
    prompt,
    focus: null,
  })),
];

/**
 * The personal greeting lines from lib/tutor-greeting — templates with a slot,
 * so there is no literal to read out of the file. The slots are filled the way
 * the greeting fills them: `topic` is a curriculum topic, but `weakestLink`
 * and a misconception title are SUB-TOPIC titles, which is a different string
 * for `resolveTopic` to fail on. Filled from real content for that reason.
 */
const PERSONAL = [
  'בוא נעבור על מה שממתין לי לחזרה', // dueCount > 0
  `תעזור לי עם ${TOPIC}`, // the topic prop
  `למה אני ממשיך לטעות את אותה טעות — ${real?.q.subTopic?.title ?? TOPIC}?`, // a live misconception
  `תסביר לי מההתחלה את ${real?.q.subTopic?.title ?? TOPIC}`, // the weakest link
];

(async () => {
  console.log('\n=== every prompt the app offers, and who answers it ===\n');
  console.log('verdict | layer that answers | surface | prompt\n');

  const paid: Row[] = [];
  for (const row of rows) {
    const v = await chain(row.prompt, row.focus);
    if (!v.free) paid.push(row);
    console.log(
      `${v.free ? 'FREE' : 'PAID'} | ${v.layer.padEnd(34)} | ${row.surface.padEnd(19)} | ${row.prompt}`,
    );
  }

  console.log('\n=== the greeting\'s personal lines (built from the student\'s state) ===\n');
  for (const prompt of PERSONAL) {
    const v = await chain(prompt, null);
    console.log(`${v.free ? 'FREE' : 'PAID'} | ${v.layer.padEnd(34)} | greeting/personal    | ${prompt}`);
  }

  // ⚠️ THE SAME CHIPS WITH NO QUESTION ON SCREEN.
  // Not a hypothetical: the chips above are free because `answerLocally` has an
  // authored question to fill its templates from. This prints what they would
  // cost without one, which is what every prompt on /chat and /scan gets today.
  if (real) {
    console.log('\n=== control: the question chips with focus = null ===\n');
    for (const prompt of focusPrompts(real.q)) {
      const v = await chain(prompt, null);
      console.log(`${v.free ? 'FREE' : 'PAID'} | ${v.layer.padEnd(34)} | (no focus)          | ${prompt}`);
    }
  }

  // The gate: the two buttons the bubble offers when it knows nothing about the
  // screen are the ones a student taps most, and both are already answered
  // without the model. If either stops being answered, this fails.
  const idlePaid: string[] = [];
  for (const prompt of IDLE) {
    if (!(await chain(prompt, null)).free) idlePaid.push(prompt);
  }

  console.log(
    `\n${rows.length} suggested prompts measured · ${paid.length} reach the model\n`,
  );
  if (idlePaid.length) {
    console.log(`FAILED: the bubble's idle buttons are billed again: ${idlePaid.join(' | ')}\n`);
  } else {
    console.log("OK: both of the bubble's idle buttons are answered without a model call\n");
  }
  process.exitCode = idlePaid.length === 0 && real ? 0 : 1;
})();
