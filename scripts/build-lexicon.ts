/**
 * build-lexicon.ts — every Hebrew word this app has ever written down.
 *
 *   npx tsx scripts/build-lexicon.ts
 *
 * FREE. Reads content, writes one generated file. No model, no network.
 *
 * ============================================================
 * WHY A LEXICON AND NOT A GIBBERISH DETECTOR
 * ============================================================
 * Three attempts at detecting gibberish by SHAPE were measured and all three
 * failed (see lib/off-topic and scripts/measure-concept-transfer):
 *
 *   a content vocabulary   "כדורגל" is in it, "אינדקס" is not
 *   consonant runs         a threshold that rejects "אסדגכלדס" rejects
 *                          "דיפרנציאלי" too, which has four in a row
 *   letter bigrams         0% false positives on real words, and it does not
 *                          catch mash either: 6,958 words cover 502 of the
 *                          ~484 possible Hebrew bigrams, so there is no signal
 *                          left to find
 *
 * The question was wrong. "Is this gibberish" has no reliable answer in Hebrew.
 * "Does this message contain ANY evidence of being a question" does, because
 * evidence is a positive thing you can enumerate: a question word, a digit, a
 * maths term, a word from the exercise on screen, or a word this app has
 * written down somewhere.
 *
 * This file builds that last one — the widest and most important source, and
 * the only one that cannot be written by hand.
 *
 * ============================================================
 * WHY IT IS GENERATED AND SERVER-SIDE
 * ============================================================
 * ~10,000 words is ~130 KB. That is nothing on a server and unacceptable in a
 * browser bundle, so the gate that uses it runs in /api/chat. The round trip
 * still happens; the model call does not, and the model call is the entire
 * cost. A client-side copy would have to be a smaller, worse lexicon, and a
 * worse lexicon means telling a student their real question is not a question.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { conceptBankEntries, getConceptQuestions, CONCEPT_LEVELS } from '../content/concept-quiz';
import { faqBankKeys, loadFaqBank } from '../content/tutor-faq';

// ⚠️ This used to be a hardcoded list of module basenames:
//   ['probability', 'sequences', 'trigonometry', 'geometry']
// Two banks were silently missing from the lexicon because of it. 'geometry'
// never matched — the module is euclidean-geometry.ts — and the import sits in
// a try/catch, so the failure was swallowed and the run still reported success.
// A newly registered bank (functions) was invisible for the same reason: adding
// 1,734 student-voiced entries produced a byte-identical lexicon, which reads
// as "nothing to do" rather than "nothing was read".
//
// Same class of bug that test-tutor-faq already fixed by enumerating
// faqBankKeys(). Enumerate the registry here too, so registering a bank is the
// only step there is.

/** Words shorter than this are function words: they are evidence of nothing. */
const MIN_LEN = 3;

(async () => {
  const words = new Set<string>();
  /**
   * ⚠️ A SECOND, NARROWER SET: the vocabulary of ASKING.
   *
   * The wide lexicon contains every word the app has written, answers and word
   * problems included — which is why "חיים" is in it, from a probability
   * question about somebody called חיים. On a two-word message that is not
   * evidence of anything: "חיים אתה" passed the gate on it.
   *
   * This one takes only the phrasings students USE to ask — FAQ questions and
   * their alternates, Topic Card aliases, maths nouns, curriculum names — and a
   * short message has to clear it rather than the wide one. "אינדקס" is here
   * because it is a card alias; "חיים" is not, because nobody asks with it.
   */
  const asking = new Set<string>();
  const addAsking = (t: unknown) => {
    if (typeof t !== 'string') return;
    for (const w of t.replace(/[^֐-׿\s]/g, ' ').split(/\s+/)) {
      if (w.length >= MIN_LEN) { asking.add(w); words.add(w); }
    }
  };
  const add = (t: unknown) => {
    if (typeof t !== 'string') return;
    for (const w of t.replace(/[^֐-׿\s]/g, ' ').split(/\s+/)) {
      if (w.length >= MIN_LEN) words.add(w);
    }
  };

  // ---- source 1: every concept-quiz question, in full ----
  let quiz = 0;
  for (const e of conceptBankEntries()) {
    for (const lvl of CONCEPT_LEVELS) {
      for (const q of getConceptQuestions(e.subject, e.topic, lvl)) {
        quiz++;
        const o = q as Record<string, unknown>;
        add(o.question);
        add(o.hint);
        for (const a of (o.answers as string[]) ?? []) add(a);
        for (const d of (o.distractorNotes as string[]) ?? []) add(d);
        for (const v of Object.values((o.explanation ?? {}) as Record<string, string>)) add(v);
      }
    }
    add(e.topic);
  }

  // ---- source 2: the FAQ banks — the largest body of student-voiced Hebrew ----
  let faq = 0;
  for (const [subject, topic] of faqBankKeys()) {
    const bank = await loadFaqBank(subject, topic);
    if (!bank) {
      console.log(`  ⚠ registered bank ${subject}/${topic} did not load`);
      continue;
    }
    for (const list of Object.values(bank)) {
      for (const f of list) {
        faq++;
        addAsking(f.q);
        for (const alt of f.alts) addAsking(alt);
        add(f.a);
      }
    }
  }

  // ---- source 3: every Topic Card alias ----
  //
  // ⚠️ THE ALIASES ARE THE STRONGEST EVIDENCE THERE IS, because they are
  // literally the phrasings this app can already answer. "אינדקס" appears
  // nowhere in the written content and is an alias of seq-index-n — a message
  // containing it is a question we have a card for, and blocking it would be
  // refusing to answer something we wrote an answer for.
  let cards = 0;
  for (const topic of ['probability', 'sequences']) {
    try {
      const mod = (await import(`../content/topic-cards/math5/${topic}`)).default as Array<
        Record<string, unknown>
      >;
      for (const c of mod) {
        cards++;
        for (const a of (c.aliases as string[]) ?? []) addAsking(a);
        add(c.shortExplanation);
        add(c.formulaOrRule);
        add(c.commonMistake);
      }
    } catch {
      /* a topic with no cards yet */
    }
  }

  // ---- source 4: the maths vocabulary the tutor already screens on ----
  try {
    const { MATHS_NOUNS } = await import('../lib/maths-vocabulary');
    for (const n of MATHS_NOUNS as string[]) addAsking(n);
  } catch {
    /* the screen keeps working; this only widens the lexicon */
  }

  // ---- source 5: the curriculum's own names ----
  try {
    const { MATH5_CURRICULUM } = await import('../content/bagrut-curriculum');
    for (const t of MATH5_CURRICULUM as Array<Record<string, unknown>>) {
      addAsking(t.key);
      addAsking(t.title);
      for (const s of (t.subTopics as Array<Record<string, unknown>>) ?? []) {
        addAsking(s.title);
        addAsking(s.key);
      }
    }
  } catch {
    /* the curriculum shape may differ; the other two sources carry the weight */
  }

  const sorted = [...words].sort();
  const askingSorted = [...asking].sort();
  const out = `/**
 * hebrew-lexicon.ts — GENERATED by scripts/build-lexicon.ts. Do not edit.
 *
 * Every Hebrew word of ${MIN_LEN}+ characters that appears anywhere in this
 * app's written content: ${quiz} quiz questions with their hints, options,
 * distractor notes and four-field explanations, ${faq} FAQ entries with their
 * phrasings and answers, and the curriculum's topic names.
 *
 * ⚠️ IT IS EVIDENCE, NOT A DICTIONARY. A word being here does not make a
 * message a question, and a word being absent does not make it gibberish —
 * "כדורגל" is in here because probability questions are about football
 * matches. It is one of six independent signals in lib/is-question, and the
 * only one wide enough to cover the vocabulary a student shares with the
 * material.
 *
 * Regenerate after adding content: npx tsx scripts/build-lexicon.ts
 */

export const HEBREW_LEXICON: ReadonlySet<string> = new Set(${JSON.stringify(sorted)});

/**
 * The vocabulary of ASKING — FAQ questions and their alternates, Topic Card
 * aliases, maths nouns, curriculum names. ${askingSorted.length} words.
 *
 * ⚠️ A SHORT MESSAGE HAS TO CLEAR THIS ONE, NOT THE WIDE SET. "חיים אתה" passed
 * the gate on the wide lexicon, because "חיים" appears in a probability
 * question about somebody by that name — true, and no evidence at all that a
 * question was asked. "אינדקס" is here because it is a card alias, so a student
 * who types it alone is still asking something this app can answer.
 */
export const ASKING_LEXICON: ReadonlySet<string> = new Set(${JSON.stringify(askingSorted)});
`;

  if (!existsSync('lib/generated')) mkdirSync('lib/generated', { recursive: true });
  writeFileSync('lib/generated/hebrew-lexicon.ts', out, 'utf8');

  const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(0);
  console.log(`\nquiz questions ${quiz} · FAQ entries ${faq}`);
  console.log(`lexicon: ${sorted.length} words (asking: ${askingSorted.length}), ${kb} KB`);
  console.log('\nspot check:');
  for (const w of ['אינדקס', 'דיפרנציאלי', 'קומבינטוריקה', 'הסתברות', 'מקומות', 'כדורגל', 'ייעיעעיעי', 'אסדגכלדס']) {
    console.log(`  ${w.padEnd(16)} wide=${words.has(w) ? 'in' : '— '}  asking=${asking.has(w) ? 'in' : '—'}`);
  }
  console.log();
})();
