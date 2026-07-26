/**
 * review.ts — spaced repetition (Leitner) for the learning path.
 *
 * A review item is just a POINTER to a question the student has already met
 * (its id + a box), so there is no new content and no new question type. Every
 * wrong first attempt anywhere drops the question into box 1 (due tomorrow);
 * getting it right in a review promotes it to a longer interval, getting it
 * wrong sends it back to box 1. This is the day-2 retention loop the product
 * had none of — the thing that pulls a student back before the June exam.
 *
 * localStorage only (bagrut-review-v1). Pure, client-side.
 */

import { getSubTopic } from '@/content/lessons';
import { getMistakes } from '@/lib/mistakes';
import type { PracticeQuestion } from '@/content/lessons/types';
import type { RoadmapLevel } from '@/lib/roadmap-levels';

const STORAGE_KEY = 'bagrut-review-v1';
const BACKFILL_FLAG = 'bagrut-review-backfilled-v1';
const DAY = 24 * 60 * 60 * 1000;

/** Days until a card in box N is due again (box 1 → tomorrow, up to box 5 → 35d). */
export const BOX_INTERVAL_DAYS = [1, 3, 7, 16, 35] as const;
export const MAX_BOX = 5;
export const MAX_ITEMS = 300;

export type ReviewItem = {
  subject: string;
  topic: string;
  subTopicId: string;
  questionId: string;
  box: number; // 1..5
  dueAt: number; // ms epoch
  lapses: number;
  lastResult?: boolean;
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAll(): ReviewItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ReviewItem[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: ReviewItem[]) {
  if (!isBrowser()) return;
  try {
    // Evict when over capacity: keep the most useful — lowest box (least
    // learned) and soonest due — drop the rest.
    let out = items;
    if (out.length > MAX_ITEMS) {
      out = [...out].sort((a, b) => a.box - b.box || a.dueAt - b.dueAt).slice(0, MAX_ITEMS);
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch {
    /* quota / disabled — ignore */
  }
}

function dueAtForBox(box: number, now: number): number {
  const idx = Math.min(Math.max(box, 1), MAX_BOX) - 1;
  return now + BOX_INTERVAL_DAYS[idx] * DAY;
}

/** A wrong first attempt in a drill/quiz → schedule the question for review
 *  (box 1, due tomorrow). No-op if it's already scheduled. */
export function seedFromMiss(
  e: { subject: string; topic: string; subTopicId?: string; questionId?: string },
  now: number = Date.now(),
): void {
  if (!e.questionId || !e.subTopicId) return;
  const items = readAll();
  if (items.some((it) => it.questionId === e.questionId)) return; // already tracked
  items.push({
    subject: e.subject,
    topic: e.topic,
    subTopicId: e.subTopicId,
    questionId: e.questionId,
    box: 1,
    dueAt: dueAtForBox(1, now),
    lapses: 0,
    lastResult: false,
  });
  writeAll(items);
}

/** When a substantive rung is cleared, lightly schedule ONE of its questions
 *  (box 2, due in a few days) so even correct material gets a spaced check. */
export function seedFromClear(
  subject: string,
  topic: string,
  subTopicId: string,
  level: RoadmapLevel,
  now: number = Date.now(),
): void {
  if (level.kind !== 'mid' && level.kind !== 'hard') return;
  const q = level.questions[level.questions.length - 1]; // hardest-served last
  if (!q) return;
  const items = readAll();
  if (items.some((it) => it.questionId === q.id)) return;
  items.push({
    subject,
    topic,
    subTopicId,
    questionId: q.id,
    box: 2,
    dueAt: dueAtForBox(2, now),
    lapses: 0,
  });
  writeAll(items);
}

/** Grade a review answer: correct → next box (longer interval); wrong → back to
 *  box 1 and count a lapse. */
export function gradeReview(questionId: string, correct: boolean, now: number = Date.now()): void {
  const items = readAll();
  const it = items.find((x) => x.questionId === questionId);
  if (!it) return;
  if (correct) {
    it.box = Math.min(it.box + 1, MAX_BOX);
    it.lastResult = true;
  } else {
    it.box = 1;
    it.lapses += 1;
    it.lastResult = false;
  }
  it.dueAt = dueAtForBox(it.box, now);
  writeAll(items);
}

/** Items due for review now, soonest-first, capped. */
export function dueItems(now: number = Date.now(), limit = 15): ReviewItem[] {
  return readAll()
    .filter((it) => it.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, limit);
}

export function dueCount(now: number = Date.now()): number {
  return readAll().filter((it) => it.dueAt <= now).length;
}

/** How many due items each sub-topic has (for the map badges). */
export function dueCountBySubTopic(now: number = Date.now()): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of readAll()) {
    if (it.dueAt <= now) out[it.subTopicId] = (out[it.subTopicId] ?? 0) + 1;
  }
  return out;
}

export function nextDueAt(): number | null {
  const items = readAll();
  if (items.length === 0) return null;
  return Math.min(...items.map((it) => it.dueAt));
}

export function totalReviewItems(): number {
  return readAll().length;
}

/** Resolve a stored pointer back to the authored question (sub-topic practice
 *  bank, then its lesson drills). Returns null if the content was renamed. */
export function resolveQuestion(item: ReviewItem): PracticeQuestion | null {
  const st = getSubTopic(item.subject, item.topic, item.subTopicId);
  if (!st) return null;
  const inBank = (st.questions ?? []).find((q) => q.id === item.questionId);
  if (inBank) return inBank;
  for (const step of st.lesson ?? []) {
    if (step.drill?.id === item.questionId) return step.drill;
  }
  return null;
}

/** One-time backfill: seed the review queue from the existing mistake notebook
 *  so a returning student's queue isn't empty on the day this ships. */
export function backfillFromMistakes(now: number = Date.now()): void {
  if (!isBrowser()) return;
  if (window.localStorage.getItem(BACKFILL_FLAG)) return;
  try {
    for (const m of getMistakes('math5')) {
      seedFromMiss(
        { subject: m.subject, topic: m.topic, subTopicId: m.subTopicId, questionId: m.questionId },
        now,
      );
    }
    window.localStorage.setItem(BACKFILL_FLAG, '1');
  } catch {
    /* ignore */
  }
}
