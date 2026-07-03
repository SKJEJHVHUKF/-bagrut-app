// ============================================================
// solution-library.ts — the "answer library" the photo-solver checks
// BEFORE calling the paid AI. Built once at module load from the ~800
// pre-solved, verified questions already in the repo:
//   - every past-bagrut question   (content/past-bagruyot)
//   - every static bagrut question (content/lessons/*/bagrutQuestions)
//   - every practice question      (content/lessons/*/questions + subTopics)
//
// A scanned question is transcribed, normalized, and matched here first.
// A hit returns the stored verified solution for $0 — no AI call. This is
// how "all the bagrut solutions are already fitted into the system".

import { ALL_PAST_BAGRUYOT } from '@/content/past-bagruyot';
import { allLessonKeys, getLesson } from '@/content/lessons';
import {
  normalizeQuestionText,
  fingerprint,
  tokenSet,
  jaccard,
} from './question-match';

/** Unified solution shape — identical to what the scan UI already renders. */
export type LibrarySolution = {
  subject: string;
  topic: string;
  transcribedQuestion: string;
  steps: { title: string; content: string }[];
  finalAnswer: string;
  /** Where it came from — surfaced as a trust badge in the UI. */
  source: 'library';
  /** The library id it matched (for debugging/analytics). */
  matchId: string;
};

type IndexEntry = {
  id: string;
  topic: string;
  norm: string;
  hash: string;
  tokens: Set<string>;
  solution: LibrarySolution;
};

// ---- Builders: turn each stored shape into the unified solution ----

function fromPractice(topic: string, q: {
  id: string;
  question: string;
  solution: { steps: string[]; finalAnswer: string; explanation: string };
}): { text: string; sol: LibrarySolution } {
  const steps = q.solution.steps.map((s, i) => ({
    title: `שלב ${i + 1}`,
    content: s,
  }));
  if (q.solution.explanation) {
    steps.push({ title: 'הרעיון', content: q.solution.explanation });
  }
  return {
    text: q.question,
    sol: {
      subject: 'math5',
      topic,
      transcribedQuestion: q.question,
      steps,
      finalAnswer: q.solution.finalAnswer,
      source: 'library',
      matchId: q.id,
    },
  };
}

function fromBagrut(topic: string, q: {
  id: string;
  context: string;
  parts: { label: string; prompt: string; solution: { steps: string[]; final_answer: string } }[];
}): { text: string; sol: LibrarySolution } {
  // Flatten every part's steps into one numbered stream, prefixing the
  // section label so the multi-part structure survives.
  const steps: { title: string; content: string }[] = [];
  const finals: string[] = [];
  for (const p of q.parts) {
    p.solution.steps.forEach((s, i) => {
      steps.push({
        title: i === 0 ? `סעיף ${p.label}` : `סעיף ${p.label} (${i + 1})`,
        content: s,
      });
    });
    if (p.solution.final_answer) finals.push(`סעיף ${p.label}: ${p.solution.final_answer}`);
  }
  const text = [q.context, ...q.parts.map((p) => p.prompt)].filter(Boolean).join(' ');
  return {
    text,
    sol: {
      subject: 'math5',
      topic,
      transcribedQuestion: text,
      steps,
      finalAnswer: finals.join(' · '),
      source: 'library',
      matchId: q.id,
    },
  };
}

// ---- The index, built once ----

function buildIndex(): IndexEntry[] {
  const entries: IndexEntry[] = [];

  const add = (id: string, topic: string, text: string, sol: LibrarySolution) => {
    const norm = normalizeQuestionText(text);
    if (norm.length < 8) return; // too short to match reliably
    entries.push({ id, topic, norm, hash: fingerprint(norm), tokens: tokenSet(norm), solution: sol });
  };

  // 1) Past bagruyot
  for (const q of ALL_PAST_BAGRUYOT) {
    const { text, sol } = fromBagrut(q.topic, q);
    add(sol.matchId, q.topic, text, sol);
  }

  // 2) Lesson banks — bagrut questions + practice questions + sub-topic drills
  for (const { subject, topic } of allLessonKeys()) {
    if (subject !== 'math5') continue;
    const lesson = getLesson(subject, topic);
    if (!lesson) continue;

    for (const q of lesson.bagrutQuestions ?? []) {
      const { text, sol } = fromBagrut(topic, q);
      add(sol.matchId, topic, text, sol);
    }
    for (const q of lesson.questions ?? []) {
      const { text, sol } = fromPractice(topic, q);
      add(sol.matchId, topic, text, sol);
    }
    for (const sub of lesson.subTopics ?? []) {
      for (const q of sub.questions ?? []) {
        const { text, sol } = fromPractice(topic, q);
        add(sol.matchId, topic, text, sol);
      }
    }
  }

  return entries;
}

let _index: IndexEntry[] | null = null;
let _byHash: Map<string, IndexEntry> | null = null;

function index(): IndexEntry[] {
  if (!_index) {
    _index = buildIndex();
    _byHash = new Map();
    // First writer wins on hash collision (past-bagruyot registered first).
    for (const e of _index) if (!_byHash.has(e.hash)) _byHash.set(e.hash, e);
  }
  return _index;
}

/** Number of pre-solved questions in the library (for the trust badge). */
export function librarySize(): number {
  return index().length;
}

const DEFAULT_THRESHOLD = 0.82;

/**
 * Match a transcribed question against the verified library.
 *  - Exact normalized-hash hit → score 1.
 *  - Else best Jaccard over the token sets; prefers same-topic candidates
 *    but falls back to all if the topic hint is wrong/absent.
 * Returns null when nothing clears the threshold.
 */
export function matchQuestion(
  transcription: string,
  topicHint?: string,
  threshold = DEFAULT_THRESHOLD,
): { solution: LibrarySolution; score: number } | null {
  const all = index();
  const norm = normalizeQuestionText(transcription);
  if (norm.length < 8) return null;

  // Exact hash first — instant.
  const exact = _byHash!.get(fingerprint(norm));
  if (exact) return { solution: exact.solution, score: 1 };

  // Fuzzy — Jaccard over token sets. Same-topic entries get a tiny
  // tie-break boost so a correct-topic match wins a near-tie.
  const qTokens = tokenSet(norm);
  let best: IndexEntry | null = null;
  let bestScore = 0;
  for (const e of all) {
    let score = jaccard(qTokens, e.tokens);
    if (topicHint && e.topic === topicHint) score += 0.02;
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  if (best && bestScore >= threshold) {
    return { solution: best.solution, score: Math.min(1, bestScore) };
  }
  return null;
}
