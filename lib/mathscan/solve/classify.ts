// ============================================================
// mathscan/solve/classify.ts — what KIND of question is this?
// ============================================================
//
// Two independent signals, deliberately kept separate:
//
//   KIND    what to DO (solve / differentiate / integrate / simplify) —
//           driven mainly by the Hebrew instruction verb, because that is
//           what the exam paper actually states.
//   DOMAIN  which branch of maths it belongs to (algebra / geometry /
//           trigonometry / calculus / statistics …) — driven by vocabulary
//           and notation, and used for routing to the right topic, the right
//           unit-level scope, and the right explanation vocabulary.
//
// A question can be `kind: 'equation'` in `domain: 'trigonometry'`, and the
// solver and the explainer need both facts. Collapsing them into one label —
// which is what a single "topic" string does — is why a naive classifier
// sends `sin(x) = 1/2` to a polynomial solver.
//
// Pure and synchronous. Zero cost.

import type { ClassifiedProblem, MathDomain, ProblemKind } from '../types';
import { freeVariables, splitRelation } from './parse';

// ------------------------------------------------------------
// Hebrew instruction cues → problem kind
// ------------------------------------------------------------

type CueRule = { kind: ProblemKind; patterns: RegExp[]; weight: number };

/**
 * Whole-word matcher for a Hebrew cue.
 *
 * `\b` is useless here and quietly matches NOTHING: JavaScript defines a word
 * boundary against `[A-Za-z0-9_]`, so between a space and א there is no
 * boundary at all and `/\bגזור\b/` can never fire. Every Hebrew cue in this
 * file used to carry one, which meant the verbal signal — the strongest one
 * we have — was dead.
 *
 * The boundary is expressed as "not preceded/followed by another Hebrew
 * letter" instead. It matters: `חשב` ("compute") is a prefix of
 * `חשבון דיפרנציאלי` ("differential calculus"), so a substring match would
 * classify every calculus question as an arithmetic evaluation.
 *
 * Written with character classes rather than lookbehind so it also runs on
 * older Safari, where an unsupported `(?<!…)` is a SyntaxError at module
 * load — which would take the whole page down, not just the classifier.
 */
function heb(word: string): RegExp {
  return new RegExp(`(?:^|[^א-ת])(${word})(?:[^א-ת]|$)`);
}

// Order matters only for readability; scoring decides the winner.
const KIND_CUES: CueRule[] = [
  {
    kind: 'derivative',
    patterns: [heb('גזור'), heb('גזרו'), heb('נגזרת'), heb('הנגזרת'), /f\s*'/, /y\s*'/, /d\s*\/\s*dx/],
    weight: 3,
  },
  {
    kind: 'definite-integral',
    patterns: [/אינטגרל\s+מסוים/, /השטח\s+הכלוא/, /שטח\s+הכלוא/, /∫[^∫]*_/],
    weight: 3,
  },
  {
    kind: 'integral',
    patterns: [/אינטגרל/, /פונקציה\s+קדומה/, /∫/, heb('אנטגרל')],
    weight: 3,
  },
  { kind: 'limit', patterns: [heb('גבול'), /\blim\b/, /שואף\s+ל/], weight: 3 },
  {
    kind: 'system',
    patterns: [/מערכת\s+(?:ה)?משוואות/, /שתי\s+משוואות/],
    weight: 4,
  },
  {
    kind: 'inequality',
    // `ה?` matters: the exam writes "פתור את אי-**ה**שוויון", and without
    // the definite article the cue never fires — leaving only the generic
    // "פתור", which scores for `equation` and mis-classifies the question.
    patterns: [/אי[-\s]?ה?שוויון/, /אי[-\s]?ה?שיוויון/, /לאילו\s+ערכים/, /עבור\s+אילו\s+ערכים/],
    weight: 3,
  },
  {
    kind: 'simplify',
    patterns: [heb('פשט'), heb('פשטו'), heb('צמצם'), heb('צמצמו'), /כתוב\s+בצורה/, /הבע\s+באמצעות/],
    weight: 3,
  },
  {
    kind: 'equation',
    patterns: [heb('פתור'), heb('פתרו'), heb('פתרי'), /המשוואה/, heb('משוואה'), /מצא\s+את\s+ה?שורש/],
    weight: 2,
  },
  {
    kind: 'evaluate',
    patterns: [heb('חשב'), heb('חשבו'), /מצא\s+את\s+הערך/, /כמה\s+שווה/],
    weight: 2,
  },
];

// ------------------------------------------------------------
// Vocabulary → domain
// ------------------------------------------------------------

const DOMAIN_CUES: { domain: MathDomain; patterns: RegExp[] }[] = [
  {
    domain: 'geometry',
    patterns: [
      /משולש/, /מרובע/, /מלבן/, /ריבוע/, /טרפז/, /מקבילית/, /מעוין/,
      /היקף/, /נפח/, /תיכון/, /חוצה\s+זווית/, /גובה\s+ל/, /חפיפ/, /דמיון/,
      /משיק\s+למעגל/, /מיתר/, /קשת/, /זווית\s+היקפית/, /זווית\s+מרכזית/,
    ],
  },
  {
    domain: 'trigonometry',
    patterns: [/\bsin\b/i, /\bcos\b/i, /\btan\b/i, /\bcot\b/i, /טריגונומטר/, /סינוס/, /קוסינוס/, /טנגנס/],
  },
  {
    domain: 'calculus',
    patterns: [
      // Same `\b` trap as the kind cues — this one survived the first sweep,
      // and its effect was visible: "גזור את הפונקציה f(x) = x³ − 4x" solved
      // correctly but was filed under אלגברה instead of חשבון דיפרנציאלי,
      // so the topic chip and any topic-based routing pointed at the wrong
      // lesson.
      /נגזרת/, heb('גזור'), heb('גזרו'), /אינטגרל/, /פונקציה\s+קדומה/, /נקודות?\s+קיצון/,
      /תחומי\s+עלייה/, /תחומי\s+ירידה/, /אסימפטוט/, /נקודת\s+פיתול/, /\blim\b/, /קעירות/,
    ],
  },
  {
    domain: 'statistics',
    patterns: [
      /הסתברות/, /סיכוי/, /ממוצע/, /חציון/, /שכיח/, /סטיית\s+תקן/, /שונות/,
      /התפלגות/, /מדגם/, /תוחלת/, /בלתי\s+תלוי/, /מותנית/,
    ],
  },
  {
    domain: 'sequences',
    patterns: [heb('סדרה'), /סדרה\s+חשבונית/, /סדרה\s+הנדסית/, heb('איבר'), /סכום\s+האיברים/, /a_?n/],
  },
  {
    domain: 'complex',
    patterns: [/מרוכב/, /\bcis\b/, /צמוד/, /המישור\s+המרוכב/, /ארגומנט/],
  },
  { domain: 'vectors', patterns: [/וקטור/, /מכפלה\s+סקלרית/, /מכפלה\s+וקטורית/] },
  {
    domain: 'analytic-geometry',
    patterns: [
      /שיפוע/, /משוואת\s+הישר/, /משוואת\s+המעגל/, /פרבולה/, /אליפסה/, /היפרבולה/,
      /מוקד/, /מדריך/, /אנך/, /מקבילים/, /נקודת\s+חיתוך/,
    ],
  },
  {
    domain: 'algebra',
    patterns: [/משוואה/, /אי[-\s]?שוויון/, /פירוק\s+לגורמים/, /שורש/, /ריבועית/, /פולינום/, /חזקה/],
  },
];

// ------------------------------------------------------------
// Classification
// ------------------------------------------------------------

export type ClassifyInput = {
  /** The full transcription — Hebrew prose included. The Hebrew IS the
   *  signal; classifying from the equation alone loses the instruction. */
  text: string;
  /** Math runs already extracted by `ocr/normalize.ts`. */
  expressions: string[];
};

export function classifyProblem(input: ClassifyInput): ClassifiedProblem {
  const text = input.text ?? '';
  const expressions = input.expressions.filter(Boolean);

  // --- kind ---
  const scores = new Map<ProblemKind, number>();
  const cues: string[] = [];
  for (const rule of KIND_CUES) {
    for (const pattern of rule.patterns) {
      const m = text.match(pattern);
      if (!m) continue;
      scores.set(rule.kind, (scores.get(rule.kind) ?? 0) + rule.weight);
      // `heb()` captures the word itself in group 1; the full match carries
      // the surrounding delimiter characters and would show up in the UI.
      cues.push((m[1] ?? m[0]).trim());
      break; // one hit per rule is enough; repeats aren't stronger evidence
    }
  }

  // Structural evidence, added on top of the verbal cues.
  const relations = expressions.map(splitRelation);
  const equationCount = relations.filter((r) => r && r.relation === '=').length;
  const inequalityCount = relations.filter(
    (r) => r && (r.relation === '<' || r.relation === '>' || r.relation === '≤' || r.relation === '≥')
  ).length;

  if (equationCount >= 2) scores.set('system', (scores.get('system') ?? 0) + 3);
  else if (equationCount === 1) scores.set('equation', (scores.get('equation') ?? 0) + 2);
  if (inequalityCount >= 1) {
    // A `>` on the page and no `=` anywhere outranks the generic verb
    // "פתור", which scores for `equation` and would otherwise win the tie
    // purely because it was inserted into the score map first.
    scores.set('inequality', (scores.get('inequality') ?? 0) + (equationCount === 0 ? 3 : 2));
  }

  // A definite integral beats a plain one whenever bounds are visible.
  const bounds = extractBounds(text);
  if (bounds && (scores.get('integral') ?? 0) > 0) {
    scores.set('definite-integral', (scores.get('definite-integral') ?? 0) + 3);
  }

  let kind: ProblemKind = 'unknown';
  let top = 0;
  for (const [k, v] of scores) {
    if (v > top) {
      top = v;
      kind = k;
    }
  }
  // No verbal cue and no relation, but we do have an expression → the exam's
  // implicit default is "compute this".
  if (kind === 'unknown' && expressions.length > 0) {
    kind = equationCount > 0 ? 'equation' : 'evaluate';
    top = 1;
  }

  // --- domain ---
  const domain = classifyDomain(text, expressions);

  // --- variables ---
  // Each SIDE of a relation is parsed separately: `x + y = 5` is not a valid
  // mathjs expression, so extracting variables from the whole string yields
  // nothing and the solver ends up with no variable to solve for.
  const variableCounts = new Map<string, number>();
  const countVariables = (source: string) => {
    for (const v of freeVariables(source)) {
      variableCounts.set(v, (variableCounts.get(v) ?? 0) + 1);
    }
  };
  for (let i = 0; i < expressions.length; i++) {
    const relation = relations[i];
    if (relation) {
      countVariables(relation.lhs);
      countVariables(relation.rhs);
    } else {
      countVariables(expressions[i]);
    }
  }
  // Most-used variable first: in "f(x) = 3x + a" we want to solve for x, not a.
  const variables = [...variableCounts.entries()]
    .sort((a, b) => b[1] - a[1] || preferredVariableRank(a[0]) - preferredVariableRank(b[0]))
    .map(([name]) => name);

  // --- multi-section detection ---
  const parts = extractSectionLabels(text);

  // --- confidence ---
  // Verbal cue + matching structure → high. One or the other → medium.
  // Neither → we guessed, and the caller should treat it as a guess.
  const hasVerbalCue = cues.length > 0;
  const hasStructure = equationCount + inequalityCount > 0 || expressions.length > 0;
  const confidence =
    hasVerbalCue && hasStructure ? 0.9 : hasVerbalCue || hasStructure ? 0.6 : 0.25;

  return {
    kind,
    domain,
    expressions,
    variables,
    bounds: bounds ?? undefined,
    cues,
    confidence,
    multiPart: parts.length >= 2,
    parts,
  };
}

/**
 * Section labels of a bagrut-style question: "א.", "ב)", "ג ." at the start
 * of a line or after whitespace.
 *
 * Requires TWO distinct labels in alphabetical sequence before calling it
 * multi-part. A single "א." is just how many questions open, and one stray
 * letter followed by a full stop is ordinary Hebrew punctuation — treating
 * either as a section would push every simple question away from the local
 * engine and onto the paid path.
 */
function extractSectionLabels(text: string): string[] {
  const ORDER = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז'];
  const found: string[] = [];
  const pattern = /(?:^|[\s(])([א-ז])\s*[.)]/gm;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const letter = match[1];
    if (!ORDER.includes(letter)) continue;
    if (found.includes(letter)) continue;
    found.push(letter);
  }
  // Must start at א and run consecutively — "ג." alone, or "א." plus a "ד."
  // from elsewhere on the page, is not a section list.
  const sequential: string[] = [];
  for (let i = 0; i < ORDER.length; i++) {
    if (!found.includes(ORDER[i])) break;
    sequential.push(ORDER[i]);
  }
  return sequential;
}

function classifyDomain(text: string, expressions: string[]): MathDomain {
  const haystack = `${text}\n${expressions.join('\n')}`;
  let best: MathDomain = 'unknown';
  let bestHits = 0;
  for (const { domain, patterns } of DOMAIN_CUES) {
    let hits = 0;
    for (const pattern of patterns) if (pattern.test(haystack)) hits++;
    // Strict `>` keeps DOMAIN_CUES order as the tie-break: the specific
    // domains are listed before the catch-all `algebra`, so a question that
    // matches both "משוואה" and "משולש" is geometry, not algebra.
    if (hits > bestHits) {
      bestHits = hits;
      best = domain;
    }
  }
  // Anything with an equation but no distinguishing vocabulary is algebra —
  // the honest default for the 5-unit paper.
  if (best === 'unknown' && expressions.length > 0) return 'algebra';
  return best;
}

/** x, then t/y/z, then everything else — matches how bagrut questions name
 *  the unknown, so a question with both `x` and `a` solves for `x`. */
function preferredVariableRank(name: string): number {
  const order = ['x', 't', 'y', 'z', 'n', 'u', 'v'];
  const idx = order.indexOf(name);
  return idx === -1 ? order.length + name.charCodeAt(0) / 1000 : idx;
}

/** Integration limits: `∫_{a}^{b}`, `∫_a^b`, or the Hebrew "בתחום [a, b]". */
function extractBounds(text: string): { lower: string; upper: string } | null {
  const latex = text.match(/∫\s*_\s*\{?([^{}\s^]+)\}?\s*\^\s*\{?([^{}\s]+)\}?/);
  if (latex) return { lower: latex[1], upper: latex[2] };

  const hebrew = text.match(/בתחום\s*\[\s*([^,\]]+)\s*,\s*([^\]]+)\s*\]/);
  if (hebrew) return { lower: hebrew[1].trim(), upper: hebrew[2].trim() };

  const between = text.match(/בין\s+([0-9.\-]+)\s+ל[-]?\s*([0-9.\-]+)/);
  if (between) return { lower: between[1], upper: between[2] };

  return null;
}

export const __testables = {
  classifyDomain,
  extractBounds,
  preferredVariableRank,
  extractSectionLabels,
};
