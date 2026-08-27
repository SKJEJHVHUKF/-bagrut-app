/**
 * generator/index.ts — the registry, and the id that makes a question portable.
 *
 * THE ID IS THE QUESTION
 * ----------------------
 *   gen:<templateId>:<difficulty>:<seed>
 *
 * Nothing else is persisted. `generateById` rebuilds the identical question
 * from that string, which is what lets a generated question live in
 * `lib/results` exactly like an authored one — same event shape, same accuracy
 * maths, same review card, same report row — with no new store and no growth
 * in what has to be synced.
 *
 * The prefix `gen:` is also the marker every consumer needs: `lib/results` can
 * tell a generated attempt from an authored one without a schema change, and
 * `lib/remediation` can prefer unseen generated supply over a re-served bank
 * question. Do not change the separator; ids already written to answer logs
 * are parsed with it.
 */

import type { Difficulty } from '@/lib/remediation/types';
import { makeRng } from './rng';
import type { GeneratedQuestion, GenTemplate } from './types';
import { EUCLIDEAN_TEMPLATES } from './templates/euclidean';
import { GEOMETRY_TEMPLATES } from './templates/geometry';
import { PROBABILITY_TEMPLATES } from './templates/probability';
import { SEQUENCES_TEMPLATES } from './templates/sequences';

export * from './types';
export { makeRng, Frac, choose, fact } from './rng';

const TEMPLATES: GenTemplate[] = [
  ...SEQUENCES_TEMPLATES,
  ...PROBABILITY_TEMPLATES,
  ...GEOMETRY_TEMPLATES,
  ...EUCLIDEAN_TEMPLATES,
];

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

/**
 * Rejected draws before we give up on a (template, difficulty) pair.
 *
 * Templates reject degenerate parameterisations (see `GenTemplate.build`), so a
 * few retries are normal and expected. Twenty-five is far above the worst
 * observed rate; hitting it means the template's accept region is effectively
 * empty for that difficulty, which is a bug the gate fails on rather than
 * something to paper over with a bigger number.
 */
const MAX_ATTEMPTS = 25;

export const allTemplates = (): GenTemplate[] => TEMPLATES;

export function getTemplate(templateId: string): GenTemplate | null {
  return BY_ID.get(templateId) ?? null;
}

/** Every template that repairs this sub-topic. */
export function templatesFor(subject: string, topic: string, subTopicId: string): GenTemplate[] {
  return TEMPLATES.filter(
    (t) => t.subject === subject && t.topic === topic && t.subTopicId === subTopicId,
  );
}

export function generatedId(templateId: string, difficulty: Difficulty, seed: number): string {
  return `gen:${templateId}:${difficulty}:${seed}`;
}

export function isGeneratedId(id: string): boolean {
  return id.startsWith('gen:');
}

export function parseGeneratedId(
  id: string,
): { templateId: string; difficulty: Difficulty; seed: number } | null {
  const parts = id.split(':');
  if (parts.length !== 4 || parts[0] !== 'gen') return null;
  const seed = Number(parts[3]);
  if (!Number.isInteger(seed)) return null;
  const difficulty = parts[2] as Difficulty;
  if (difficulty !== 'easy' && difficulty !== 'mid' && difficulty !== 'hard') return null;
  return { templateId: parts[1], difficulty, seed };
}

/**
 * Build one instance at a given seed, reseeding deterministically past rejected
 * draws. The returned question's id encodes the seed that ACTUALLY produced it,
 * so `generateById` on that id lands on the same instance in one attempt.
 */
export function generate(
  templateId: string,
  difficulty: Difficulty,
  seed: number,
): GeneratedQuestion | null {
  const t = BY_ID.get(templateId);
  if (!t || !t.difficulties.includes(difficulty)) return null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const s = seed + attempt;
    const built = t.build(makeRng(`${templateId}:${difficulty}:${s}`), difficulty);
    if (!built) continue;
    return {
      question: { ...built, id: generatedId(templateId, difficulty, s), difficulty },
      templateId,
      skill: t.skill,
      seed: s,
      difficulty,
    };
  }
  return null;
}

/** Rebuild the exact question behind a stored id. Null if the template is gone. */
export function generateById(id: string): GeneratedQuestion | null {
  const parsed = parseGeneratedId(id);
  if (!parsed) return null;
  const t = BY_ID.get(parsed.templateId);
  if (!t) return null;
  const built = t.build(makeRng(`${parsed.templateId}:${parsed.difficulty}:${parsed.seed}`), parsed.difficulty);
  if (!built) return null;
  return {
    question: { ...built, id, difficulty: parsed.difficulty },
    templateId: parsed.templateId,
    skill: t.skill,
    seed: parsed.seed,
    difficulty: parsed.difficulty,
  };
}

/**
 * `count` DISTINCT instances for a sub-topic at a difficulty, avoiding ids the
 * student has already answered.
 *
 * Distinctness is by question TEXT, not by id: two seeds can land on the same
 * parameters, and serving the same question twice under two ids inside one
 * five-step repair path is exactly the failure this whole module exists to
 * remove. `seedBase` keeps it deterministic — the caller passes something
 * stable (the fix path's `createdAt`) so a resumed session rebuilds the same
 * ladder.
 */
export function generateBatch(
  subject: string,
  topic: string,
  subTopicId: string,
  difficulty: Difficulty,
  count: number,
  seedBase: number,
  exclude: ReadonlySet<string> = new Set(),
): GeneratedQuestion[] {
  const pool = templatesFor(subject, topic, subTopicId).filter((t) =>
    t.difficulties.includes(difficulty),
  );
  if (!pool.length) return [];

  const out: GeneratedQuestion[] = [];
  const seenText = new Set<string>();

  // Round-robin across templates so a sub-topic with three families does not
  // hand the student five variants of the same one.
  for (let round = 0; out.length < count && round < count * 4; round++) {
    const t = pool[round % pool.length];
    const g = generate(t.id, difficulty, seedBase + round * 977);
    if (!g) continue;
    if (exclude.has(g.question.id)) continue;
    if (seenText.has(g.question.question)) continue;
    seenText.add(g.question.question);
    out.push(g);
  }
  return out;
}
