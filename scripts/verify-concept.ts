/**
 * verify-concept.ts — structural + contract check for the static concept-quiz banks.
 *
 * ⚠️⚠️ THIS SCRIPT CANNOT TELL YOU AN ANSWER IS RIGHT. It checks SHAPE only.
 * "252/252 passed" has never meant the mathematics is correct — every `correct`
 * index still has to be re-derived by hand, independently of whoever wrote the
 * question. Do not cite a green run here as evidence of accuracy. The check that
 * actually catches wrong answer keys is scripts/verify-mcq-distinct.ts (mathjs,
 * every option pair) plus a human re-derivation.
 *
 * DELIBERATELY NOT IMPLEMENTED: any heuristic claiming to judge whether a
 * question is *actually* at its declared level. Difficulty is human judgement;
 * a script pretending to measure it would manufacture exactly the false
 * confidence this header warns about. Rules 9 and 10 are weak proxies and are
 * warnings on purpose.
 *
 * It also enforces the teaching contract, because the bank failed it badly once:
 * an audit found only 1 of 84 questions whose `why_wrong` addressed all three
 * distractors and 48 that addressed none, so a student who picked the "wrong
 * wrong answer" was handed an explanation of a mistake they didn't make.
 *
 *   npx tsx scripts/verify-concept.ts            # errors fail, warnings print
 *   npx tsx scripts/verify-concept.ts --strict    # warnings fail too
 */
import { conceptBankEntries, CONCEPT_LEVELS, type ConceptLevel } from '../content/concept-quiz';
import { MATH5_CURRICULUM } from '../content/bagrut-curriculum';

const STRICT = process.argv.includes('--strict');

const MIN_WHY_CORRECT = 60;
const MIN_NOTE = 20;
const MIN_HINT = 25;
const MAX_HINT = 200;
const MAX_L1_QUESTION = 160;
const MIN_L3_WHY_CORRECT = 120;

/**
 * Target inventory per (topic × level). Raised 6 -> 12 by the owner on
 * 2026-07-30: at 6, a session of 5 meant a second round repeated 4 of the same
 * 5 questions, so the reserve has to be roughly double the session size for a
 * repeat round to feel different.
 *
 * The hint rule and the inventory rule are promoted SEPARATELY, because they are
 * satisfied at different times. Bundling them under one flag would mean raising
 * the target instantly turns 39 passing rows into build failures, and a gate
 * that fails on everything gets bypassed within a day — the same reasoning that
 * kept both as warnings during the first authoring push.
 */
const MIN_PER_LEVEL = 12;
/** Every in-syllabus question already carries a hint — this stays enforced. */
const HINT_RULE_IS_ERROR = true;
/**
 * Flipped to true on 2026-08-17, the day every in-syllabus topic reached
 * MIN_PER_LEVEL (the ten-bank rewrite pass, ln-function through functions).
 * From here a bank that slips below target is a build failure, not a warning —
 * which is what keeps the reserve honest as content is edited. Out-of-syllabus
 * topics (EXEMPT_TOPICS, derived from the curriculum) still only warn.
 */
const INVENTORY_RULE_IS_ERROR = true;

/**
 * Topics exempt from the inventory target and the hint requirement.
 *
 * Derived from `MATH5_CURRICULUM` rather than hardcoded: a topic marked
 * `weight: 'out-of-scope'` has left the syllabus, so the app keeps its existing
 * questions as reserve content but does not invest in bringing them to target.
 * Owner's call (2026-07-30) on גדילה ודעיכה: "זה מחוץ לחומר".
 *
 * They are still fully checked for CORRECTNESS — 4 answers, correct in range,
 * distractor notes, explanation fields. Only the two volume-of-work rules are
 * relaxed. Retiring a topic must not quietly retire its quality bar, and if the
 * syllabus ever changes back the exemption disappears on its own.
 */
const EXEMPT_TOPICS = new Set(
  MATH5_CURRICULUM.filter((t) => t.weight === 'out-of-scope').map((t) => t.key),
);

const EXPLANATION_FIELDS = ['why_correct', 'why_wrong', 'concept', 'remember'] as const;

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);
/** An exempt topic always downgrades to a warning, so its state stays VISIBLE
 *  rather than silently accepted — the row still prints, it just doesn't fail
 *  the build. */
const gated = (isError: boolean, topic: string, m: string) =>
  isError && !EXEMPT_TOPICS.has(topic) ? err(m) : warn(m);

const MATH5_KEYS = new Set(MATH5_CURRICULUM.map((t) => t.key));

const seenIds = new Map<string, string>(); // id -> where
let count = 0;

type Counts = Record<ConceptLevel, number>;
const table: Array<{ label: string; counts: Counts; total: number }> = [];

for (const { subject, topic, bank } of conceptBankEntries()) {
  const where = `${subject}:${topic}`;

  // Rule 8 — a one-character topic mismatch makes the whole file unservable,
  // and nothing else would notice. math5's curriculum is the source of truth.
  if (subject === 'math5' && !MATH5_KEYS.has(topic)) {
    err(`${where}: topic is not a MATH5_CURRICULUM key — this bank can never be served`);
  }
  if (bank.topic !== topic) {
    err(`${where}: registry key does not match bank.topic ("${bank.topic}")`);
  }
  if (!bank.slug) err(`${where}: bank has no slug`);

  if (!Array.isArray(bank.questions) || bank.questions.length === 0) {
    err(`${where}: no questions`);
    continue;
  }

  const counts: Counts = { 1: 0, 2: 0, 3: 0 };

  for (const q of bank.questions) {
    count++;
    const at = `${where} ${q.id}`;

    // ---- Rule 2: id uniqueness across the WHOLE registry, not just one paper.
    const prior = seenIds.get(q.id);
    if (prior) err(`${at}: duplicate id (also in ${prior})`);
    seenIds.set(q.id, where);

    // ---- Rule 7: id belongs to this file, and any -L<n>- segment agrees.
    const prefix = `cq-${bank.slug}-`;
    if (!q.id.startsWith(prefix)) {
      err(`${at}: id must start with "${prefix}" — is this question in the right file?`);
    }
    const idLevel = /-L(\d)-/.exec(q.id);
    if (idLevel && Number(idLevel[1]) !== q.level) {
      err(`${at}: id says level ${idLevel[1]} but level is ${q.level}`);
    }

    // ---- Rule 3: level range. TS covers literal files; this catches an `as any`.
    if (!CONCEPT_LEVELS.includes(q.level)) {
      err(`${at}: level must be 1, 2 or 3 (got ${JSON.stringify(q.level)})`);
    } else {
      counts[q.level]++;
    }

    // ---- Rule 1: the original structural contract, unchanged.
    if (!Array.isArray(q.answers) || q.answers.length !== 4) {
      err(`${at}: must have exactly 4 answers`);
    }
    if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
      err(`${at}: correct index out of range (${q.correct})`);
    }
    if (!q.question || q.question.trim().length === 0) {
      err(`${at}: empty question`);
    }
    for (const f of EXPLANATION_FIELDS) {
      if (!q.explanation?.[f] || q.explanation[f].trim().length === 0) {
        err(`${at}: missing explanation.${f}`);
      }
    }
    const whyCorrect = q.explanation?.why_correct?.trim() ?? '';
    if (whyCorrect && whyCorrect.length < MIN_WHY_CORRECT) {
      err(`${at}: why_correct too thin (${whyCorrect.length} < ${MIN_WHY_CORRECT}) — "${whyCorrect}"`);
    }
    const notes = q.distractorNotes;
    if (!Array.isArray(notes) || notes.length !== 4) {
      err(`${at}: distractorNotes must be an array of 4 (one per answer)`);
    } else {
      for (let i = 0; i < 4; i++) {
        if (i === q.correct) continue;
        if (!notes[i] || notes[i].trim().length < MIN_NOTE) {
          err(`${at}: distractorNotes[${i}] missing/too short for answer "${q.answers?.[i]}"`);
        }
      }
    }

    // ---- Rule 4 (gated): a hint on every question.
    const hint = q.hint?.trim() ?? '';
    if (!hint) {
      gated(HINT_RULE_IS_ERROR, topic, `${at}: no hint`);
    } else if (hint.length < MIN_HINT || hint.length > MAX_HINT) {
      gated(HINT_RULE_IS_ERROR, topic, `${at}: hint length ${hint.length}, want ${MIN_HINT}-${MAX_HINT}`);
    }

    // ---- Rule 5 (warning ON PURPOSE): a hint must not hand over the answer.
    // This is the rule with real teeth AND the one most likely to be the gate's
    // own bug — a hint may legitimately quote the answer's *form*. Promote only
    // after a full authoring wave shows zero legitimate hits.
    const correctText = typeof q.correct === 'number' ? q.answers?.[q.correct] : undefined;
    if (hint && correctText && correctText.trim().length > 3 && hint.includes(correctText.trim())) {
      warn(`${at}: hint contains the correct answer verbatim ("${correctText}")`);
    }

    // ---- Rules 9/10: weak level-shape proxies, warnings only.
    if (q.level === 1 && q.question.length > MAX_L1_QUESTION) {
      warn(`${at}: level-1 question is ${q.question.length} chars (> ${MAX_L1_QUESTION}) — reads like level 2`);
    }
    if (q.level === 3 && whyCorrect.length < MIN_L3_WHY_CORRECT) {
      warn(`${at}: level-3 why_correct is ${whyCorrect.length} chars (< ${MIN_L3_WHY_CORRECT}) — a bagrut-grade question needs a worked reason`);
    }
  }

  // ---- Rule 6 (gated): inventory per level.
  for (const lv of CONCEPT_LEVELS) {
    if (counts[lv] < MIN_PER_LEVEL) {
      gated(INVENTORY_RULE_IS_ERROR, topic, `${where}: level ${lv} has ${counts[lv]}/${MIN_PER_LEVEL} questions`);
    }
  }

  table.push({ label: where, counts, total: bank.questions.length });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const pad = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length));
const lpad = (s: string, n: number) => (s.length >= n ? s : ' '.repeat(n - s.length) + s);

console.log('\nINVENTORY — questions per level (target ' + MIN_PER_LEVEL + ' each)\n');
console.log(pad('bank', 34) + lpad('L1', 4) + lpad('L2', 4) + lpad('L3', 4) + lpad('tot', 6));
const totals: Counts = { 1: 0, 2: 0, 3: 0 };
for (const r of table) {
  const exempt = EXEMPT_TOPICS.has(r.label.split(':')[1] ?? '');
  const short = CONCEPT_LEVELS.some((lv) => r.counts[lv] < MIN_PER_LEVEL);
  const flag = exempt ? '  · מחוץ לסילבוס, לא נספר ליעד' : short ? '  ←' : '';
  console.log(
    pad(r.label, 34) +
      lpad(String(r.counts[1]), 4) +
      lpad(String(r.counts[2]), 4) +
      lpad(String(r.counts[3]), 4) +
      lpad(String(r.total), 6) +
      flag,
  );
  for (const lv of CONCEPT_LEVELS) totals[lv] += r.counts[lv];
}
console.log(
  pad('TOTAL', 34) +
    lpad(String(totals[1]), 4) +
    lpad(String(totals[2]), 4) +
    lpad(String(totals[3]), 4) +
    lpad(String(count), 6),
);
// Counted separately: a shortfall in an exempt topic is not work owed, and
// folding it into one number would make a finished bank look unfinished forever.
const shortfall = (only: 'required' | 'exempt') =>
  table
    .filter((r) => (EXEMPT_TOPICS.has(r.label.split(':')[1] ?? '') ? only === 'exempt' : only === 'required'))
    .reduce(
      (s, r) => s + CONCEPT_LEVELS.reduce((t, lv) => t + Math.max(0, MIN_PER_LEVEL - r.counts[lv]), 0),
      0,
    );
const owed = shortfall('required');
const exemptShort = shortfall('exempt');
console.log(
  `\nmissing to target: ${owed} question(s)` +
    (exemptShort > 0
      ? `  (plus ${exemptShort} in out-of-syllabus topics, not counted — reserve content)`
      : ''),
);

const show = (list: string[], label: string) => {
  if (list.length === 0) return;
  console.log(`\n${label} (${list.length}):`);
  for (const m of list.slice(0, 40)) console.log(`  ${m}`);
  if (list.length > 40) console.log(`  … and ${list.length - 40} more`);
};
show(errors, 'ERRORS');
show(warnings, 'WARNINGS');

console.log(
  `\n${count} concept questions checked — ${errors.length} error(s), ${warnings.length} warning(s).`,
);
if (!INVENTORY_RULE_IS_ERROR) {
  console.log(
    `note: the per-level inventory target (${MIN_PER_LEVEL}) is a WARNING while authoring is in flight — ` +
      'flip INVENTORY_RULE_IS_ERROR once every in-syllabus topic reaches it. Hint coverage is already an error.',
  );
}
process.exit(errors.length > 0 || (STRICT && warnings.length > 0) ? 1 : 0);
