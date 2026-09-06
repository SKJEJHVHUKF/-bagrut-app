/**
 * _geo-difficulty-check.ts — does the גיאומטריה ladder actually get HARDER?
 *
 *   npx tsx scripts/_geo-difficulty-check.ts
 *
 * WHY. Itay, 2026-09-05: "חשוב לי מאוד הגיוון בשאלות ועליה הדרגתית ברמת הקושי
 * בשאלות עד לרמת בגרות שבאמת יהיה עליה וגיוון". My audit
 * (_audit-geo-progression.ts) measured DUPLICATION — whether two rungs hold the
 * same question — and I then removed repeats and added אתגר questions and
 * reported the counts. Counting hard questions is not measuring difficulty.
 * Nothing here ever checked that rung N+1 is harder than rung N, so a stage
 * whose "challenge" rung sits BELOW its practice rung would have passed
 * everything, silently, exactly as it did in probability.
 *
 * The difficulty model is claude-3a's, from scripts/_prob-extra-check.ts, with
 * the mechanism and ask-shape tables rewritten for geometry. Their finding on
 * shipped probability content — six of six stages failing, two with a hard rung
 * scoring below their mid rung — is the reason to run it here rather than assume.
 *
 * WHAT IT MEASURES. Proxies that relabelling cannot satisfy: how many DISTINCT
 * named theorems a question invokes, whether it asks for a proof, whether it
 * hides a value the student must recover first, whether it returns more than one
 * quantity, and how many lines the solution takes. Weights are a deliberate
 * simplification — the ORDERING is the claim, not the numbers.
 *
 * WHAT IT CANNOT DO. Judge whether a question is interesting, or whether its
 * answer is right. verify-specs and _build-*-figs.ts cover the second; a human
 * reads for the first.
 */
import { math5EuclideanGeometry as G } from '../content/lessons/math5/euclidean-geometry';
import type { PracticeQuestion } from '../content/lessons/types';

/** Named geometry theorems, detected from the question AND its solution — the
 *  theorem usually only surfaces in the working ("לפי צ.ז.צ", "פיתגורס"). */
const MECHANISMS: [string, RegExp][] = [
  ['congruence', /חפיפה|חופפים|צ\.ז\.צ|ז\.צ\.ז|צ\.צ\.צ|צ\.צ\.ז|\\cong/],
  ['similarity', /דמיון|דומים|\\sim|ז\.ז\b|יחס הדמיון/],
  ['pythagoras', /פיתגורס/],
  ['area-formula', /שטח/],
  ['area-ratio', /יחס השטחים|יחס שטחים|k\^2|k²/],
  ['thales', /תאלס|מקביל לצלע|\\parallel BC/],
  ['angle-bisector', /חוצה (?:את )?(?:ה)?זווית|חוצי הזוויות/],
  ['midsegment', /קטע האמצעים|קו אמצעים|קטע אמצעים/],
  ['median', /תיכון|מפגש התיכונים/],
  ['isosceles', /שווה[- ]שוקיים|זוויות הבסיס/],
  ['parallel-angles', /מתאימות|מתחלפות|חד[- ]צדדיות/],
  ['vertical-adjacent', /קודקודיות|צמודות/],
  ['segment-arithmetic', /חיבור קטעים|חיסור קטעים|חיסור זוויות/],
  ['inscribed-angle', /זווית היקפית|זווית מרכזית/],
  ['chord', /מיתר/],
  ['tangent', /משיק/],
  ['cyclic-quad', /מרובע חסום|חסום במעגל/],
  ['power-of-point', /מכפלת|PT\^2|מיתרים נחתכים|משיק והחותך|המשיק והחותך/],
  ['quadrilateral', /מקבילית|מעוין|דלתון|טרפז|מלבן/],
  ['right-angle-facts', /תיכון ליתר|הגובה ליתר|ישר[- ]זווית/],
  // Missing until 2026-09-06: the angle sum is the most-cited theorem in the
  // whole topic and nothing here detected it, so every eg-angles question
  // measured as using exactly ONE mechanism and the rung comparison was flat
  // by construction.
  ['triangle-angle-sum', /סכום הזוויות במשולש|סכום זוויות המשולש|זווית חיצונית/],
  ['angle-sum-around', /סביב נקודה|זוויות סביב|$360°|360 מעלות/],
];

const mechanisms = (q: PracticeQuestion): string[] => {
  const text = `${q.question} ${(q.solution?.steps ?? []).join(' ')}`;
  return MECHANISMS.filter(([, re]) => re.test(text)).map(([n]) => n);
};

/** What the student is asked to PRODUCE — the variety axis. */
function askShape(q: PracticeQuestion): string {
  const t = q.question;
  // "הצדק" is the exam's other word for "justify" and was missing here, so
  // eg-sub-thales-004 ("האם DE ∥ BC? הצדק.") scored as a plain length question
  // and collided with eg-sub-thales-006. That is a detector bug, not content:
  // a question demanding a justification is a proof-shaped question whichever
  // verb it uses. Fixed rather than worked around.
  // identify BEFORE prove, deliberately: eg-mth-001/002/003 quote the word
  // "הוכח" inside the proof they hand the student and then ask "מהו הנימוק?" /
  // "מה הבעיה?" — the ask is to NAME something, not to prove it. Testing prove
  // first swallowed all three. "מהו הנימוק", "מה הבעיה", "איזה מהלך" were also
  // simply missing from the list. Detector gaps, not content.
  if (/לפי איזה משפט|איזו טענה|מה \*\*חסר\*\*|מה חסר|מה \*\*נובע\*\*|מה נובע|איזו כתיבה|מה מותר להסיק|באיזו נקודה|באיזה מרובע|מהו הנימוק|מה הבעיה|איזה מהלך|איזו שגיאה/.test(t)) return 'identify';
  // `הוכח(?![הת])` and not a bare `הוכח`: the imperative "הוכח" is the ask, but
  // the NOUNS "הוכחה" / "בהוכחה" / "הוכחת חפיפה" merely mention one, and a bare
  // substring match counted those as proof questions too.
  if (/הוכח(?![הת])|הסק|נמק|הצדק|מש״ל|בכתיבה מלאה/.test(t)) return 'prove';
  if (/מצא את שטח|חשב את שטח|מצא את השטח/.test(t)) return 'area';
  if (/מהי הזווית|מצא את הזווית|מצא את זווית|מהי כל אחת מזוויות/.test(t)) return 'angle';
  return 'length';
}

/** A value the student must recover before the asked quantity is reachable —
 *  an algebraic unknown, or a given stated as a ratio rather than a number. */
const hasParameter = (q: PracticeQuestion) =>
  /\bx\b|נעלם|\$3x|\$5x|x \+ 40/.test(q.question) ||
  /יחס [^.]*\d ?: ?\d|פי \$?\\?d?frac|ביחס \$?\d ?: ?\d/.test(q.question);

/** More than one quantity to return — the exam's own shape. */
const multiOutput = (q: PracticeQuestion) =>
  Array.isArray(q.answerLabels) && q.answerLabels.length > 1;

function difficulty(q: PracticeQuestion) {
  const m = mechanisms(q);
  const steps = q.solution?.steps?.length ?? 0;
  const shape = askShape(q);
  return {
    score:
      steps * 1 +
      m.length * 2.5 +
      (hasParameter(q) ? 3 : 0) +
      (multiOutput(q) ? 3 : 0) +
      (shape === 'prove' ? 2 : 0),
    mechanisms: m,
    steps,
    shape,
  };
}

/** "The same question with different numbers": same ask, same theorems, and
 *  neither hides a value the other does not. */
const signature = (q: PracticeQuestion) =>
  `${askShape(q)}|${mechanisms(q).slice().sort().join(',')}${hasParameter(q) ? '|param' : ''}`;

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const MIN_MECH_UP = 0.3;
let problems = 0;
const err = (where: string, rule: string, detail: string) => {
  problems++;
  console.log(`  ❌ ${rule.padEnd(26)} ${where} — ${detail}`);
};

for (const st of G.subTopics ?? []) {
  const qs = st.questions ?? [];
  const byRung = {
    easy: qs.filter((q) => q.difficulty === 'easy').map(difficulty),
    mid: qs.filter((q) => q.difficulty === 'mid').map(difficulty),
    hard: qs.filter((q) => q.difficulty === 'hard').map(difficulty),
  };
  const stat = (a: ReturnType<typeof difficulty>[]) => ({
    n: a.length,
    score: avg(a.map((x) => x.score)),
    mech: avg(a.map((x) => x.mechanisms.length)),
    steps: avg(a.map((x) => x.steps)),
  });
  const e = stat(byRung.easy), m = stat(byRung.mid), h = stat(byRung.hard);

  console.log(
    `\n### ${st.id}\n` +
    `    חימום n=${e.n} score=${e.score.toFixed(1)} mech=${e.mech.toFixed(2)} steps=${e.steps.toFixed(1)}\n` +
    `    ביסוס n=${m.n} score=${m.score.toFixed(1)} mech=${m.mech.toFixed(2)} steps=${m.steps.toFixed(1)}\n` +
    `    אתגר  n=${h.n} score=${h.score.toFixed(1)} mech=${h.mech.toFixed(2)} steps=${h.steps.toFixed(1)}`,
  );

  if (e.n && m.n && m.score <= e.score) err(st.id, 'no-escalation-score', `חימום ${e.score.toFixed(1)} → ביסוס ${m.score.toFixed(1)}`);
  if (m.n && h.n && h.score <= m.score) err(st.id, 'no-escalation-score', `ביסוס ${m.score.toFixed(1)} → אתגר ${h.score.toFixed(1)}`);
  if (e.n && m.n && m.mech - e.mech < MIN_MECH_UP) err(st.id, 'no-escalation-mechanisms', `חימום ${e.mech.toFixed(2)} → ביסוס ${m.mech.toFixed(2)}`);
  if (m.n && h.n && h.mech - m.mech < MIN_MECH_UP) err(st.id, 'no-escalation-mechanisms', `ביסוס ${m.mech.toFixed(2)} → אתגר ${h.mech.toFixed(2)}`);

  // The rule that catches the real defect: a hard question that is a lower rung
  // restated. Compared by signature, not by wording.
  const lower = new Map<string, string>();
  for (const q of qs) if (q.difficulty !== 'hard') lower.set(signature(q), q.id);
  for (const q of qs) {
    if (q.difficulty !== 'hard') continue;
    const twin = lower.get(signature(q));
    if (twin) err(q.id, 'hard-is-a-restatement', `same ask + same theorems as ${twin} (${signature(q)})`);
  }

  const shapes = new Set(qs.map(askShape));
  if (qs.length >= 5 && shapes.size < 3) err(st.id, 'low-variety-of-ask', `only ${[...shapes].join(', ')}`);
}

console.log(`\n=== ${problems} escalation problem(s) across the topic ===`);
