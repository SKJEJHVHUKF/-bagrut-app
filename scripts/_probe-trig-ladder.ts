/**
 * _probe-trig-ladder.ts — the check no gate performs: rung COMPOSITION of the
 * trigonometry track after the 2026-09-08 reorder, run through the real
 * getSubTopic + buildSubTopicLevels rather than inferred from a green gate.
 *
 * It also asserts, per Itay's review of 2026-09-08:
 *   · the track order is right-triangle → laws → area → identities → mixed
 *   · no cotangent survives anywhere in the trig learning content
 *   · the אתגר rung of trig-plane-basics is not a restatement of its בגרות rung
 *   · sin(2α) and sin(90°−α) actually reach the student
 *
 * Run:  npx tsx scripts/_probe-trig-ladder.ts
 */
import { getBagrutQuestionsForSubTopic, getSubTopic } from '../content/lessons';
import { buildSubTopicLevels } from '../lib/roadmap-levels';
import { TRACK_571 } from '../content/tracks/paper-571';

const SUBJECT = 'math5';
const TOPIC = 'טריגונומטריה';

const EXPECTED_ORDER = [
  'trig-right-triangle',
  'trig-sine-cosine-laws',
  'trig-triangle-area',
  'trig-plane-basics',
  'trig-plane-mixed',
];

let errors = 0;
const fail = (m: string) => {
  console.log(`❌ ${m}`);
  errors++;
};

// ── 1. track order ─────────────────────────────────────────────────────────
const trig = TRACK_571.topics.find((t) => t.id === 'trigonometry');
if (!trig) {
  fail('no trigonometry topic in TRACK_571');
} else {
  const ladders = trig.tiles.filter((t) => t.kind === 'ladder').map((t) => (t as { subId: string }).subId);
  const first5 = ladders.slice(0, 5);
  if (first5.join(',') !== EXPECTED_ORDER.join(',')) {
    fail(`track order is [${first5.join(', ')}]\n   expected [${EXPECTED_ORDER.join(', ')}]`);
  } else {
    console.log('✅ track order — ' + first5.join(' → '));
  }
}

// ── 2. rung composition of every trig stage ────────────────────────────────
const REQUIRED = ['learn', 'easy', 'mid', 'hard'] as const;
console.log('\nstage                     steps drills questions bagrut   rungs');
for (const id of EXPECTED_ORDER) {
  const st = getSubTopic(SUBJECT, TOPIC, id);
  if (!st) {
    fail(`sub-topic ${id} does not resolve`);
    continue;
  }
  const levels = buildSubTopicLevels(SUBJECT, TOPIC, st);
  const kinds = levels.map((l) => l.kind);
  const drills = (st.lesson ?? []).filter((s) => s.drill).length;
  console.log(
    `${id.padEnd(25)} ${String(st.lesson?.length ?? 0).padStart(5)} ${String(drills).padStart(6)}` +
      ` ${String(st.questions?.length ?? 0).padStart(9)} ${String(getBagrutQuestionsForSubTopic(SUBJECT, TOPIC, id).length).padStart(6)}   ${kinds.join('·')}`,
  );
  for (const need of REQUIRED) {
    if (!kinds.includes(need)) fail(`${id} has NO ${need} rung`);
  }
}

// ── 3. Itay's content asks, checked against the real strings ───────────────
const basics = getSubTopic(SUBJECT, TOPIC, 'trig-plane-basics');
if (!basics) {
  fail('trig-plane-basics missing');
} else {
  const blob = JSON.stringify(basics);

  // 3a. no cotangent, anywhere
  const cot = blob.match(/\\\\cot|קוטנגנס/g);
  if (cot) fail(`cotangent still present ${cot.length}×`);
  else console.log('\n✅ no cotangent in trig-plane-basics');

  // 3b. the two identities he asked for
  for (const [needle, label] of [
    ['2\\\\sin\\\\alpha\\\\cos\\\\alpha', 'sin(2α) = 2 sin α cos α'],
    ['\\\\sin(90° - \\\\alpha) = \\\\cos\\\\alpha', 'sin(90°−α) = cos α'],
  ] as const) {
    if (!blob.includes(needle)) fail(`identity missing from the stage: ${label}`);
    else console.log(`✅ identity reaches the student: ${label}`);
  }

  // 3c. the motivation step comes before any identity step
  const titles = (basics.lesson ?? []).map((s) => s.title);
  if (titles[0] !== 'למה בכלל צריך זהויות') {
    fail(`first lesson step is "${titles[0]}", expected the "why identities" motivation step`);
  } else {
    console.log('✅ motivation step is first');
  }

  // 3d. the אתגר rung must not restate the בגרות rung.
  //
  // Hebrew word overlap is useless here — "חשב", "עגל לשתי ספרות אחרי הנקודה"
  // and "נתון" appear in every question in the file. What actually made the
  // flagged pair the SAME question was its MATHEMATICAL objects: both named
  // ∠AOB, ∠ACB, ∠ADB and asked for cos(∠ADB) = −cos(∠ACB). So compare the
  // math tokens, with the numbers stripped — that is exactly the "same
  // question, different data" Itay pointed at.
  // Only DISTINCTIVE tokens count. Bare vertex and side labels ($ABC$, $AB = 8$,
  // $BC$) appear in practically every triangle question in the file, so counting
  // them flags four honest questions as duplicates — a gate that cries wolf gets
  // switched off within a day. A token is distinctive when it names an OBJECT or
  // an OPERATION: \angle, \sin, \cos, \tan, \sqrt. That is precisely what made
  // the pair Itay flagged the same question.
  const mathTokens = (text: string): Set<string> => {
    const out = new Set<string>();
    for (const m of text.matchAll(/\$([^$]+)\$/g)) {
      const body = m[1].replace(/[\d.]+/g, '').replace(/\s+/g, '');
      if (body.length >= 2 && /\\(angle|sin|cos|tan|sqrt)/.test(body)) out.add(body);
    }
    return out;
  };
  const bagrutTokensFor = (subId: string) =>
    mathTokens(
      getBagrutQuestionsForSubTopic(SUBJECT, TOPIC, subId)
        .map((b) => b.context + b.parts.map((p) => p.prompt).join(' '))
        .join(' '),
    );
  const overlap = (text: string, against: Set<string>) => {
    const t = mathTokens(text);
    const shared = [...t].filter((x) => against.has(x));
    return { shared, ratio: t.size ? shared.length / t.size : 0 };
  };
  const bagrutTokens = bagrutTokensFor('trig-plane-basics');
  const overlapWith = (text: string) => overlap(text, bagrutTokens);

  // Itay: "אני רוצה שלא יהיו כמעט בכלל שאלות זהות בצורה הזו" — so sweep EVERY
  // stage of the track, not only the one he happened to have open.
  const DUP = 0.5;
  let compared = 0;
  for (const id of EXPECTED_ORDER) {
    const st = getSubTopic(SUBJECT, TOPIC, id);
    const against = bagrutTokensFor(id);
    if (!st || against.size === 0) continue;
    for (const q of st.questions ?? []) {
      compared++;
      const { shared, ratio } = overlap(q.question, against);
      if (shared.length >= 3 && ratio > DUP) {
        fail(
          `${id}: bank question ${q.id} restates its own bagrut question — ` +
            `${shared.length} shared math objects (${shared.join(', ')})`,
        );
      }
    }
  }
  console.log(`✅ ${compared} bank questions compared against their stage's bagrut question, no restatement`);

  // planted defect: the question this rung USED to hold must still be caught,
  // otherwise the check above proves nothing.
  const RETIRED_DUPLICATE =
    'במעגל שמרכזו $O$ נתונה הזווית המרכזית $\\angle AOB = 130°$. הנקודה $C$ נמצאת על ' +
    'הקשת הגדולה $AB$, והנקודה $D$ נמצאת על הקשת הקטנה $AB$. חשב את $\\angle ACB$ ואת ' +
    '$\\angle ADB$, והסבר מדוע מתקיים $\\cos(\\angle ADB) = -\\cos(\\angle ACB)$.';
  const planted = overlapWith(RETIRED_DUPLICATE);
  if (!(planted.shared.length >= 3 && planted.ratio > DUP)) {
    fail(
      'the duplication check does NOT catch the question it was written for ' +
        `(${planted.shared.length} shared, ratio ${planted.ratio.toFixed(2)}) — it is asserting nothing`,
    );
  } else {
    console.log(
      `✅ duplication check verified against the retired question ` +
        `(${planted.shared.length} shared objects, ratio ${planted.ratio.toFixed(2)})`,
    );
  }

  // 3e. negative-angle family: taught, but NOT drilled
  const negDrilled = (basics.questions ?? []).filter((q) => JSON.stringify(q).includes('(-\\\\alpha)'));
  if (negDrilled.length > 0) {
    fail(`negative-angle identities have ${negDrilled.length} bank question(s); Itay asked for almost none`);
  } else {
    console.log('✅ negative-angle family taught but not drilled in the bank');
  }
}

// ── 4. the Greek-letter convention must precede the area formula ───────────
const rt = getSubTopic(SUBJECT, TOPIC, 'trig-right-triangle');
if (!rt) fail('trig-right-triangle missing');
else if (!(rt.lesson ?? []).some((s) => s.title.includes('אלפא'))) {
  fail('the α/β/γ naming step is not in trig-right-triangle, which is now the FIRST tile');
} else {
  console.log('✅ α/β/γ naming convention taught in the first tile');
}

console.log(errors === 0 ? '\n✅ probe passed' : `\n❌ ${errors} problem(s)`);
process.exit(errors === 0 ? 0 : 1);
