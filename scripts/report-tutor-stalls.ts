/**
 * report-tutor-stalls.ts — does the tutor STALL, and on which topics?
 *
 *   npx tsx scripts/report-tutor-stalls.ts
 *   npx tsx scripts/report-tutor-stalls.ts --show      also print the answers
 *
 * FREE. Content plus pure functions; no model call, no network.
 *
 * ============================================================
 * WHY A REPORT ABOUT STALLS AND NOT ABOUT COVERAGE
 * ============================================================
 * Every instrument this repo already has counts a template as a WIN.
 * `test:voice` reports "0 נפילות ל-API", `measure-faq-intercept` calls a
 * template hit `intercepted` but not wrong, `report:tutor` reports a local
 * rate. So the answer that made Itay give up on the tutor —
 *
 *     "בוא נפרק את השאלה שעל המסך, בלי לפתור אותה… עכשיו קרא אותה שוב לאט,
 *      וכתוב לעצמך בשורה אחת מה נתון ומה מבקשים."
 *
 * — scored as a success in all three, on every topic, for months.
 *
 * A STALL is an answer that carries no information: it tells the student to
 * re-read the question and report back. It is the right reply to the one-tap
 * chip "תסביר לי את השאלה הזאת מההתחלה" and to a bare "לא הבנתי", where the
 * student has said nothing to work with. It is the wrong reply to a sentence
 * that named the step, the number or the operation the student is stuck on —
 * and until 2026-09-06 every typed "למה …?" got exactly that, because
 * `followUp`'s `why` rule is the WORD למה anywhere in the message.
 *
 * So this asks one question per topic, in the students' own register, and
 * prints WHO answered. The bar is not "how much is free" — it is that a
 * question naming its own subject is never met with a stall.
 */

// A localStorage, so tutor-flags / planAnswer do not throw. Same shim and the
// same ordering constraint as scripts/test-tutor-chain.ts — tsx evaluates in
// source order, so this must precede the imports.
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

import { runTutorChain, emptyChainState } from '../lib/tutor-chain';
import { allLessonKeys, getLesson } from '../content/lessons';

const SHOW = process.argv.includes('--show');

/**
 * The register students actually type in, taken from Itay's screenshots and
 * from report:worklist. Every one of them NAMES something — an operation, a
 * step, a number — so every one of them deserves a real answer.
 *
 * `{n}` is filled with a number the exercise itself uses, so the message reads
 * like a student pointing at the screen rather than a template with a hole.
 */
const TYPED = [
  'למה מכפילים ולא מחברים',
  'למה צריך את השלב הזה בכלל',
  'אני יגיד לך מה שלא הבנתי זה למה זה יוצא {n}',
  'למה לא אפשר פשוט להציב {n}',
  'מאיפה הגיע ה{n}',
];

/** The bare asks. These SHOULD be answered from authored content, for free. */
const BARE = ['רמז', 'לא הבנתי', 'מאיפה מתחילים', 'מה הטעות שלי'];

/**
 * An answer that gives the student nothing to act on except "look again".
 *
 * Matched on the TEXT and not on the layer, deliberately: which layer wins is
 * content that moves every week, and a stall served by the compiler is exactly
 * as useless as one served by a template.
 */
const STALL = [
  'קרא אותה שוב לאט',
  'קרא אותה שוב',
  'תכתוב לי במשפט אחד',
  'ואגיד לך אם דייקת',
  'כתוב לעצמך בשורה אחת',
];
const isStall = (t: string) => STALL.some((s) => t.includes(s));

/** The first number in the exercise, for the `{n}` slot. */
function aNumber(q: string): string {
  return q.match(/\d+(?:\.\d+)?/)?.[0] ?? '2';
}

(async () => {
  let typedTotal = 0, typedStalled = 0, bareTotal = 0, bareAnswered = 0;
  const byLayer = new Map<string, number>();
  const offenders: string[] = [];

  console.log('\nנושא                          שאלות מנוסחות        שאלות סתמיות');
  console.log('                              נענו / נתקעו         נענו בחינם');

  for (const { subject, topic } of allLessonKeys()) {
    if (subject !== 'math5') continue;
    const L = getLesson(subject, topic);
    // One real question per topic — the first sub-topic that has one.
    let q: unknown = null;
    let st: unknown = null;
    for (const s of L?.subTopics ?? []) {
      const first = s.questions?.[0];
      if (first) { q = first; st = s; break; }
    }
    if (!q) continue;

    const text = String((q as { question: string }).question);
    const focus = {
      where: `תרגול · ${topic}`,
      topic,
      subTopicId: (st as { id?: string })?.id ?? '',
      questionText: text,
      question: q,
      subTopic: st,
    } as never;

    let stalled = 0;
    for (const raw of TYPED) {
      const message = raw.replace('{n}', aNumber(text));
      const r = await runTutorChain({
        message,
        focus,
        state: { ...emptyChainState(), tutorSpoke: true },
      });
      const layer = r.answered ? r.layer : 'model';
      byLayer.set(layer, (byLayer.get(layer) ?? 0) + 1);
      typedTotal++;
      if (r.answered && isStall(r.text)) {
        stalled++; typedStalled++;
        offenders.push(`  ${layer.padEnd(16)} ${topic} · "${message}"`);
      }
      if (SHOW) console.log(`\n  [${topic}] 👦 ${message}\n     ${layer} · ${r.answered ? r.text.slice(0, 160) : '(→ model)'}`);
    }

    let free = 0;
    for (const message of BARE) {
      const r = await runTutorChain({
        message,
        focus,
        state: { ...emptyChainState(), tutorSpoke: true },
      });
      bareTotal++;
      if (r.answered) { free++; bareAnswered++; }
    }

    if (!SHOW) {
      const mark = stalled === 0 ? '✅' : '⛔';
      console.log(
        `${mark} ${topic.padEnd(26)} ${String(TYPED.length - stalled).padStart(2)}/${TYPED.length} נענו · ${stalled} נתקעו   ${free}/${BARE.length}`,
      );
    }
  }

  console.log(`\nשאלות מנוסחות: ${typedTotal} · נתקעו ${typedStalled} (${((typedStalled / typedTotal) * 100).toFixed(1)}%)`);
  console.log(`שאלות סתמיות:  ${bareTotal} · נענו מתוכן בחינם ${bareAnswered} (${((bareAnswered / bareTotal) * 100).toFixed(1)}%)`);

  console.log('\nמי ענה על השאלות המנוסחות:');
  for (const [layer, n] of [...byLayer].sort((a, b) => b[1] - a[1])) {
    const paid = layer === 'model' ? '  ← בתשלום' : '';
    console.log(`  ${layer.padEnd(18)} ${String(n).padStart(3)}${paid}`);
  }

  if (offenders.length) {
    console.log('\nהתקיעות שנשארו:');
    for (const o of offenders) console.log(o);
  }

  process.exit(typedStalled === 0 ? 0 : 1);
})();
