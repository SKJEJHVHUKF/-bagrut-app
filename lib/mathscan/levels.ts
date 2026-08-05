// ============================================================
// mathscan/levels.ts — unit-level scope: 5 today, 3 and 4 without a rewrite.
// ============================================================
//
// The scanner is level-aware from the first line of code, because retro-
// fitting a level axis is exactly the kind of change that breaks a working
// pipeline. Three things are level-dependent and nothing else is:
//
//   1. WHICH TOPICS exist  — a 3-unit student never gets "מספרים מרוכבים".
//   2. WHICH PROBLEM KINDS are in scope — integrals are not on the 3-unit
//      paper, so a 3-unit scan that classifies as an integral is a
//      misclassification, not a hard question.
//   3. WHAT WE SAY when something is out of scope — "זה מעבר לחומר של
//      3 יחידות" is useful; a generic failure is not.
//
// Adding a level is: fill in its `topics` list and its `kinds` set below.
// No other file changes. The 5-unit list is the live one and mirrors
// `MATH5_CURRICULUM` keys byte-for-byte — the topic string is a lookup key
// in `content/lessons` and `content/concept-quiz`, where a one-character
// difference silently serves the wrong bank (that has bitten this repo
// before: `גיאומטריה` vs `גאומטריה`).

import type { MathDomain, ProblemKind, UnitLevel } from './types';

// ------------------------------------------------------------
// Topic names, exactly as the content registries key them.
// ------------------------------------------------------------

const MATH5_TOPICS = [
  'אלגברה',
  'סדרות',
  'גיאומטריה אוקלידית',
  'טריגונומטריה',
  'גאומטריה אנליטית',
  'הסתברות',
  'חשבון דיפרנציאלי',
  'חשבון אינטגרלי',
  'פונקציה מעריכית',
  'פונקציית ln',
  'גדילה ודעיכה',
  'וקטורים במרחב',
  'מספרים מרוכבים',
  'סטטיסטיקה',
] as const;

export type LevelScope = {
  level: UnitLevel;
  label: string;
  /** Topic keys available at this level. Empty = content not authored yet. */
  topics: readonly string[];
  /** Problem kinds the syllabus contains at this level. */
  kinds: readonly ProblemKind[];
  /** Domains the syllabus contains at this level. */
  domains: readonly MathDomain[];
  /** False until the level's content exists — the UI says so plainly
   *  instead of pretending to support it. */
  ready: boolean;
};

const COMMON_KINDS: ProblemKind[] = ['equation', 'inequality', 'system', 'simplify', 'evaluate'];

export const LEVEL_SCOPES: Record<UnitLevel, LevelScope> = {
  5: {
    level: 5,
    label: '5 יחידות',
    topics: MATH5_TOPICS,
    kinds: [...COMMON_KINDS, 'derivative', 'integral', 'definite-integral', 'limit'],
    domains: [
      'algebra', 'geometry', 'trigonometry', 'calculus', 'statistics',
      'sequences', 'analytic-geometry', 'vectors', 'complex',
    ],
    ready: true,
  },
  4: {
    level: 4,
    label: '4 יחידות',
    // Populated when the 4-unit content lands (שאלונים 571/572 already exist
    // in `content/past-bagruyot`, so this is a content task, not a code one).
    topics: [],
    kinds: [...COMMON_KINDS, 'derivative', 'integral', 'definite-integral'],
    domains: [
      'algebra', 'geometry', 'trigonometry', 'calculus', 'statistics',
      'sequences', 'analytic-geometry',
    ],
    ready: false,
  },
  3: {
    level: 3,
    label: '3 יחידות',
    topics: [],
    // No calculus on the 3-unit paper — an integral classification at this
    // level means the classifier misread, which is worth telling the student.
    kinds: [...COMMON_KINDS],
    domains: ['algebra', 'geometry', 'trigonometry', 'statistics', 'sequences'],
    ready: false,
  },
};

export function scopeFor(level: UnitLevel): LevelScope {
  return LEVEL_SCOPES[level] ?? LEVEL_SCOPES[5];
}

// ------------------------------------------------------------
// Domain → topic
// ------------------------------------------------------------

/**
 * Best app topic for a detected domain, restricted to the level's topics.
 *
 * Several domains map to more than one topic (calculus covers both the
 * differential and the integral topic), so the caller passes the problem
 * kind to disambiguate. Returns null rather than guessing when the level has
 * no content — a wrong topic sends the student to the wrong lesson.
 */
export function topicForDomain(
  domain: MathDomain,
  level: UnitLevel,
  kind?: ProblemKind
): string | null {
  const scope = scopeFor(level);
  if (scope.topics.length === 0) return null;

  const candidates = DOMAIN_TO_TOPICS[domain] ?? [];
  const refined =
    domain === 'calculus' && kind
      ? kind === 'integral' || kind === 'definite-integral'
        ? ['חשבון אינטגרלי', 'חשבון דיפרנציאלי']
        : ['חשבון דיפרנציאלי', 'חשבון אינטגרלי']
      : candidates;

  for (const topic of refined) {
    if (scope.topics.includes(topic)) return topic;
  }
  return null;
}

const DOMAIN_TO_TOPICS: Record<MathDomain, string[]> = {
  algebra: ['אלגברה'],
  geometry: ['גיאומטריה אוקלידית'],
  trigonometry: ['טריגונומטריה'],
  calculus: ['חשבון דיפרנציאלי', 'חשבון אינטגרלי'],
  statistics: ['הסתברות', 'סטטיסטיקה'],
  sequences: ['סדרות'],
  'analytic-geometry': ['גאומטריה אנליטית'],
  vectors: ['וקטורים במרחב'],
  complex: ['מספרים מרוכבים'],
  unknown: [],
};

// ------------------------------------------------------------
// Scope checks
// ------------------------------------------------------------

export type ScopeCheck =
  | { inScope: true }
  | { inScope: false; reason: string };

/** Is this problem inside the student's syllabus? The message is what the
 *  result screen shows, so it names the level rather than saying "no". */
export function checkScope(
  kind: ProblemKind,
  domain: MathDomain,
  level: UnitLevel
): ScopeCheck {
  const scope = scopeFor(level);
  if (kind !== 'unknown' && !scope.kinds.includes(kind)) {
    return {
      inScope: false,
      reason: `שאלה מסוג זה אינה חלק מחומר ${scope.label}. נפתור בכל זאת — רק שתדע.`,
    };
  }
  if (domain !== 'unknown' && !scope.domains.includes(domain)) {
    return {
      inScope: false,
      reason: `הנושא ${domain} אינו חלק מחומר ${scope.label}. נפתור בכל זאת — רק שתדע.`,
    };
  }
  return { inScope: true };
}

/** All levels, for a settings/level picker. */
export function allLevels(): LevelScope[] {
  return [LEVEL_SCOPES[5], LEVEL_SCOPES[4], LEVEL_SCOPES[3]];
}
