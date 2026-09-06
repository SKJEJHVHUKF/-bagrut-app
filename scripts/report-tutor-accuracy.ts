/**
 * report-tutor-accuracy.ts — did he answer THE QUESTION THAT WAS ASKED?
 *
 *   npm run report:accuracy
 *   npm run report:accuracy -- הסתברות        one topic
 *   npm run report:accuracy -- --show          print the wrong answers
 *
 * FREE. Content plus pure functions; no model call, no network.
 *
 * ============================================================
 * WHY THIS EXISTS ALONGSIDE test:faq AND report:stalls
 * ============================================================
 * Each of the instruments already here answers a different question, and none
 * of them answers this one:
 *
 *   test:faq         does the MATCHER find the entry?      (matcher only)
 *   report:stalls    does the tutor refuse to answer?      (7 phrasings/topic)
 *   report:tutor     how much is free?                     (counts local vs paid)
 *
 * A turn can pass all three and still be the failure Itay reported: an
 * authored, verified, confident answer — to a different question. "למה לא 0.7
 * כפול 0.7 כפול 0.7" was answered with the note about ADDING, and every gate
 * in this repo called that a success, because something answered and it cost
 * nothing.
 *
 * So this runs one authored phrasing per entry through the REAL chain and
 * compares the served text with the text that entry was written to serve.
 * Five outcomes, and the one that matters is `wrong`:
 *
 *   right   the bank served THIS entry's answer
 *   wrong   the bank served ANOTHER entry's answer      ← the trust-killer
 *   stall   an answer that only says "read it again"    ← see report:stalls
 *   other   the compiler or a template answered instead
 *   model   nothing local answered; the turn is billed
 *
 * ⚠️ WHAT THIS CANNOT SEE. Every phrasing tested is one the bank itself
 * contains, so the matcher has the exact sentence indexed. That makes `wrong`
 * a LOWER bound: it measures which entry wins when the words are known, not
 * how the tutor copes with a sentence nobody wrote. The blind-query half —
 * a phrasing held out of the index — is what `npm run test:faq` measures, and
 * the two together are the honest picture.
 */

const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  },
  location: { pathname: '/roadmap', search: '' },
  dispatchEvent: () => true,
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;

import { getLesson, allLessonKeys } from '../content/lessons';
import { loadFaqBank } from '../content/tutor-faq';
import { partAsQuestion, type TutorFocus } from '../lib/tutor-presence';
import { runTutorChain, emptyChainState } from '../lib/tutor-chain';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

const args = process.argv.slice(2);
const SHOW = args.includes('--show');
const ONLY = args.find((a) => !a.startsWith('--'));

/** An answer that only tells the student to look again. Matched on TEXT — a
 *  stall from the compiler is exactly as useless as one from a template. */
const STALL = ['קרא אותה שוב', 'תכתוב לי במשפט אחד', 'ואגיד לך אם דייקת', 'כתוב לעצמך בשורה אחת'];

type Outcome = 'right' | 'wrong' | 'stall' | 'other' | 'model';
const OUTCOMES: Outcome[] = ['right', 'wrong', 'stall', 'other', 'model'];
type Row = Record<Outcome, number>;
const blank = (): Row => ({ right: 0, wrong: 0, stall: 0, other: 0, model: 0 });

const byShape: Record<string, Row> = {};
const byTopic: Record<string, Row> = {};
const total = blank();
const wrongSamples: string[] = [];

/**
 * ONE phrasing per entry, and not `q`.
 *
 * `q` is the canonical sentence and the one most likely to win by construction;
 * scoring on it would flatter every number. `alts[4]` is one of the two the
 * blind-query gate holds out, so it is the phrasing least shaped by the
 * matcher's own indexing — the closest thing here to a student's own words.
 */
const probeOf = (f: { q: string; alts: string[] }) => f.alts[4] ?? f.alts[1] ?? f.alts[0] ?? f.q;

(async () => {
  for (const { subject, topic } of allLessonKeys()) {
    if (subject !== 'math5') continue;
    if (ONLY && topic !== ONLY) continue;
    const bank = await loadFaqBank(subject, topic);
    const L = getLesson(subject, topic);
    if (!bank || !L) continue;

    const screens: { question: PracticeQuestion; subTopic?: SubTopic }[] = [];
    for (const st of L.subTopics ?? [])
      for (const q of st.questions ?? []) screens.push({ question: q, subTopic: st });
    for (const b of L.bagrutQuestions ?? [])
      for (const p of b.parts ?? []) screens.push({ question: partAsQuestion(p, { questionId: b.id }) });

    const t = (byTopic[topic] ??= blank());
    for (const { question, subTopic } of screens) {
      for (const f of bank[question.id] ?? []) {
        const phrasing = probeOf(f);
        const focus = {
          where: topic,
          topic,
          subTopicId: subTopic?.id ?? '',
          questionText: question.question,
          question,
          ...(subTopic ? { subTopic } : {}),
          ...(f.reveals ? { correctAnswer: question.solution?.finalAnswer ?? '' } : {}),
        } as unknown as TutorFocus;

        let outcome: Outcome = 'model';
        let served = '';
        try {
          const r = await runTutorChain({ message: phrasing, focus, state: emptyChainState() });
          if (r.answered) {
            served = r.text;
            if (STALL.some((s) => r.text.includes(s))) outcome = 'stall';
            else if (r.layer.startsWith('faq')) outcome = r.text === f.a ? 'right' : 'wrong';
            else outcome = 'other';
          }
        } catch {
          outcome = 'other';
        }

        const s = (byShape[f.kind] ??= blank());
        s[outcome]++; t[outcome]++; total[outcome]++;
        if (outcome === 'wrong' && wrongSamples.length < 12) {
          wrongSamples.push(`  ${f.id} (${f.kind})\n    👦 ${phrasing}\n    🤖 ${served.slice(0, 130)}`);
        }
      }
    }
  }

  const n = OUTCOMES.reduce((a, k) => a + total[k], 0);
  const pct = (x: number, d: number) => (d ? `${((100 * x) / d).toFixed(1)}%` : '—');
  const line = (name: string, r: Row) => {
    const d = OUTCOMES.reduce((a, k) => a + r[k], 0);
    return `${name.padEnd(24)} ${String(d).padStart(5)}  ${pct(r.right, d).padStart(6)} ${pct(r.wrong, d).padStart(6)} ${pct(r.stall, d).padStart(6)} ${pct(r.other, d).padStart(6)} ${pct(r.model, d).padStart(6)}`;
  };

  console.log('\n                         שאלות   נכון   שגוי  תקיעה   אחר   מודל');
  console.log('--- לפי סוג השאלה ---');
  for (const [k, r] of Object.entries(byShape).sort((a, b) => b[1].wrong - a[1].wrong)) console.log(line(k, r));
  console.log('--- לפי נושא ---');
  for (const [k, r] of Object.entries(byTopic)) console.log(line(k, r));
  console.log(`\nסה"כ ${n}: נכון ${pct(total.right, n)} · שגוי ${pct(total.wrong, n)} · תקיעה ${pct(total.stall, n)} · אחר ${pct(total.other, n)} · מודל ${pct(total.model, n)}`);

  // ⚠️ AND THE NUMBER ABOVE IS CONDITIONAL. It can only score questions that
  // HAVE an authored answer to compare against, so on its own it says "when a
  // bank exists, the right entry wins" — and reads as if it were about the
  // whole app. Printing the coverage underneath is what stops it being a gate
  // that is correct about what it looked at and silent about the rest.
  if (!ONLY) {
    console.log('\n--- ולכמה שאלות בכלל יש תשובות כתובות ---');
    let banked = 0;
    let all = 0;
    for (const { subject, topic } of allLessonKeys()) {
      if (subject !== 'math5') continue;
      const L = getLesson(subject, topic);
      if (!L) continue;
      const ids: string[] = [];
      for (const st of L.subTopics ?? []) for (const q of st.questions ?? []) ids.push(q.id);
      for (const b of L.bagrutQuestions ?? [])
        for (const p of b.parts ?? []) ids.push(partAsQuestion(p, { questionId: b.id }).id);
      const bank = await loadFaqBank(subject, topic);
      const have = ids.filter((id) => (bank?.[id]?.length ?? 0) > 0).length;
      banked += have;
      all += ids.length;
      const p = ids.length ? Math.round((100 * have) / ids.length) : 0;
      console.log(`${have === ids.length && have > 0 ? '✅' : have ? '◐ ' : '⛔'} ${topic.padEnd(24)} ${String(have).padStart(4)}/${String(ids.length).padEnd(5)} (${p}%)`);
    }
    console.log(`\nכיסוי בנק: ${banked}/${all} שאלות = ${Math.round((100 * banked) / all)}%`);
    console.log('על היתר אין תשובה כתובה כלל, והשרשרת נופלת לקומפיילר או למודל.');
  }

  if (SHOW && wrongSamples.length) {
    console.log('\nתשובות שגויות (דוגמאות):');
    for (const s of wrongSamples) console.log(s);
  }
  // A stall is a defect with a known cause; a wrong answer is the trust-killer.
  // Both are reported, only the stall is a hard failure — the wrong-answer rate
  // is a bank-precision number that content moves, not a gate a commit can pass.
  process.exit(total.stall === 0 ? 0 : 1);
})();
