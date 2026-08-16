/**
 * verify-tutor-notes.ts — does the tutor answer about the question the student
 * actually got wrong?
 *   npx tsx scripts/verify-tutor-notes.ts            report, exit 0
 *   npx tsx scripts/verify-tutor-notes.ts --strict   fail on any wiring break
 *   npx tsx scripts/verify-tutor-notes.ts --show     print every dangling note
 *
 * WHY THIS EXISTS SEPARATELY FROM verify-distractors.ts
 * That script checks the SHAPE of the data: an array as long as `answers`,
 * empty at `correct`, substantive elsewhere. It says so itself, and it is right
 * to stop there. This one checks the thing a student experiences: open the
 * tutor after a wrong pick and see whether the reply is about YOUR mistake.
 *
 * TWO CHECKS, AND THEY ARE NOT THE SAME KIND OF CLAIM
 *
 * 1. WIRING (mechanical, exact, gate-worthy). Replays the real path — the focus
 *    QuestionRunnerCard publishes, into lib/tutor-local.answerLocally — once per
 *    wrong option, and asserts the reply names THAT option and carries THAT
 *    option's note and no other's. A misaligned or mis-indexed reply fails here
 *    with no judgement involved.
 *
 * 2. DANGLING POINTS (heuristic, reported, never a gate). The bug that started
 *    this: a note reading "זהו $\vec{AM}$ — חצי האלכסון" on a question that
 *    names only $A$, $B$, $C$, $D$. The note was correct and correctly selected;
 *    it just opened on a point the student had never been shown, so it read as
 *    an answer to someone else's question.
 *
 *    ⚠️ Deliberately narrow. scripts/verify-distractors.ts documents a
 *    token-overlap alignment detector that was built, measured at 15/15 false
 *    positives, and deleted — a good note cites the OTHER options' numbers, so
 *    note↔option overlap proves nothing. This rule runs on a different axis:
 *    note↔QUESTION, and only on RUNS OF 2+ CONSECUTIVE CAPITALS, which in this
 *    corpus are geometric point groups ($ABCD$, $\vec{DB}$, $\angle ABC$) and
 *    essentially nothing else. Single capitals are excluded on purpose — $S$,
 *    $V$, $P$, $C$, $E$, $N$, $H$ are areas, volumes, probabilities, constants
 *    and counts far more often than they are points, and including them buries
 *    the real hits. A note may still legitimately introduce a point and define
 *    it in the same breath, so this half REPORTS and never fails the run.
 */
import { getLesson, allLessonKeys } from '@/content/lessons';
import { conceptBankEntries } from '@/content/concept-quiz';
import { answerLocally } from '@/lib/tutor-local';

const STRICT = process.argv.includes('--strict');
const SHOW = process.argv.includes('--show');

/** The chip the student actually taps — lib/tutor-presence.focusPrompts. */
const ASK = 'למה התשובה שלי שגויה?';

type Q = {
  id?: string;
  kind?: string;
  question?: string;
  answers?: string[];
  correct?: number;
  distractorNotes?: (string | undefined)[];
  hint?: string;
  solution?: unknown;
};

type Break = { id: string; where: string; why: string };
const breaks: Break[] = [];
const dangling: { id: string; where: string; letters: string[]; note: string }[] = [];
let replays = 0;
let questions = 0;

// ------------------------------------------------------------
// 1. wiring — replay the real path, once per wrong option
// ------------------------------------------------------------

function replay(q: Q, where: string, subTopic: unknown) {
  const answers = q.answers ?? [];
  const notes = q.distractorNotes;
  const id = q.id ?? '(no id)';
  if (q.kind !== 'mcq' || !Array.isArray(notes) || notes.length !== answers.length) return;
  questions++;

  for (let i = 0; i < answers.length; i++) {
    if (i === q.correct) continue;
    const note = String(notes[i] ?? '').trim();

    // Both reachable states: the student just missed (D not yet revealed), and
    // the page has since revealed the answer. Different templates — both must
    // still be about option i.
    for (const revealed of [false, true]) {
      replays++;
      const focus = {
        where,
        topic: where,
        questionText: q.question,
        question: q,
        subTopic,
        chosenIndex: i,
        wrongAnswer: answers[i],
        ...(revealed && typeof q.correct === 'number'
          ? { correctAnswer: answers[q.correct] }
          : {}),
      };
      const tag = revealed ? 'revealed' : 'fresh';
      const r = answerLocally(ASK, focus as never, []);

      if (!r) {
        breaks.push({ id, where, why: `[${tag}] option ${i}: no local answer — falls through to a paid API call` });
        continue;
      }
      if (r.kind !== 'why-wrong') {
        breaks.push({ id, where, why: `[${tag}] option ${i}: answered as "${r.kind}", not why-wrong` });
        continue;
      }
      // The anchor. Without it the reply opens mid-thought and reads as though
      // it belongs to another question — the whole reason this script exists.
      if (!r.text.includes(answers[i])) {
        breaks.push({ id, where, why: `[${tag}] option ${i}: reply never names the option the student picked` });
      }
      if (note && !r.text.includes(note)) {
        breaks.push({ id, where, why: `[${tag}] option ${i}: reply does not carry distractorNotes[${i}]` });
      }
      // Cross-contamination: another option's note in this option's reply.
      for (let j = 0; j < notes.length; j++) {
        if (j === i) continue;
        const other = String(notes[j] ?? '').trim();
        if (other.length > 20 && r.text.includes(other)) {
          breaks.push({ id, where, why: `[${tag}] option ${i}: reply carries distractorNotes[${j}] instead` });
        }
      }
    }
  }
}

// ------------------------------------------------------------
// 2. dangling points — a note naming what the question never showed
// ------------------------------------------------------------

const CAPS_RUN = /[A-Z]{2,}/g;

function scanDangling(q: Q, where: string) {
  const notes = q.distractorNotes;
  if (q.kind !== 'mcq' || !Array.isArray(notes)) return;
  // What the student can see when the note is served: the question and the
  // options. NOT the solution — that is exactly what they have not opened.
  const shown = new Set(
    ((q.question ?? '') + ' ' + (q.answers ?? []).join(' ')).match(/[A-Z]/g) ?? [],
  );
  notes.forEach((raw, i) => {
    const note = String(raw ?? '').trim();
    if (!note || i === q.correct) return;
    const missing = new Set<string>();
    for (const run of note.match(CAPS_RUN) ?? []) {
      // "רבע II", "רבע IV" — quadrants, not points. 13 of the first 15 hits.
      // Only I and V are skipped, NOT the full roman alphabet: C, D, M, L and X
      // are ordinary point names here, so testing /^[IVXLCDM]+$/ would swallow
      // a genuinely undefined $\vec{CD}$ to spare a quadrant.
      if (/^[IV]+$/.test(run)) continue;
      for (const ch of run) if (!shown.has(ch)) missing.add(ch);
    }
    if (missing.size) {
      dangling.push({
        id: `${q.id ?? '(no id)'}[${i}]`,
        where,
        letters: [...missing].sort(),
        note,
      });
    }
  });
}

// ------------------------------------------------------------
// walk both banks
// ------------------------------------------------------------

for (const { subject, topic } of allLessonKeys()) {
  const lesson = getLesson(subject, topic);
  if (!lesson) continue;
  for (const q of (lesson.questions ?? []) as Q[]) {
    replay(q, topic, undefined);
    scanDangling(q, topic);
  }
  for (const st of lesson.subTopics ?? []) {
    const where = `תרגול · ${st.title ?? topic}`;
    for (const q of (st.questions ?? []) as Q[]) {
      replay(q, where, st);
      scanDangling(q, where);
    }
  }
}

for (const { subject, bank } of conceptBankEntries()) {
  for (const q of bank.questions as Q[]) {
    replay(q, `concept-${subject}`, undefined);
    scanDangling(q, `concept-${subject}`);
  }
}

// ------------------------------------------------------------
// report
// ------------------------------------------------------------

console.log(`replayed ${replays} tutor answers across ${questions} MCQs\n`);

if (breaks.length) {
  console.log(`🔴 ${breaks.length} wiring break(s) — the student is shown the wrong thing:`);
  for (const b of breaks.slice(0, 40)) console.log(`   ${b.where}  ${b.id}: ${b.why}`);
  if (breaks.length > 40) console.log(`   … and ${breaks.length - 40} more`);
} else {
  console.log('✅ wiring: every reply names the option picked and carries that option\'s note.');
}

console.log(
  `\n${dangling.length ? '🟡' : '✅'} dangling points: ${dangling.length} note(s) reference a capital the question never shows`,
);
if (dangling.length) {
  console.log('   (judgement call — a note may introduce a point and define it in the same sentence)');
  const list = SHOW ? dangling : dangling.slice(0, 15);
  for (const d of list) {
    console.log(`\n   ${d.where}  ${d.id}  →  missing: ${d.letters.join(', ')}`);
    console.log(`     «${d.note.slice(0, 160)}${d.note.length > 160 ? '…' : ''}»`);
  }
  if (!SHOW && dangling.length > 15) console.log(`\n   … and ${dangling.length - 15} more (--show for all)`);
}

if (STRICT && breaks.length) process.exit(1);

export {};
