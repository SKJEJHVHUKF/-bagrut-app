/**
 * mistakes.ts — the "מחברת טעויות" (error notebook).
 *
 * Logs every wrong answer with an error CATEGORY so the /errors dashboard can
 * show the student their personal error profile ("הטעות מספר 1 שלך: תחום
 * הגדרה"). Pure localStorage, free, zero cost — like results.ts it works
 * without login. Categories come from the AI tutor when available (Pro) or a
 * manual picker (free).
 */

const STORAGE_KEY = 'bagrut-mistakes-v1';
const MAX_MISTAKES = 300;

export type ErrorCategory =
  | 'טעות סימן'
  | 'תחום הגדרה'
  | 'גזירה פנימית'
  | 'הנחת יסוד גיאומטרית'
  | 'טעות אלגברית'
  | 'טעות חשבונית'
  | 'שכחת תנאי'
  | 'אחר';

export const ERROR_CATEGORIES: ErrorCategory[] = [
  'טעות סימן',
  'תחום הגדרה',
  'גזירה פנימית',
  'הנחת יסוד גיאומטרית',
  'טעות אלגברית',
  'טעות חשבונית',
  'שכחת תנאי',
  'אחר',
];

/** Coerce an arbitrary string (e.g. from the AI) to a known category. */
export function toErrorCategory(raw: unknown): ErrorCategory {
  return (ERROR_CATEGORIES as string[]).includes(raw as string)
    ? (raw as ErrorCategory)
    : 'אחר';
}

export type MistakeSource = 'quiz' | 'drill' | 'bagrut' | 'scan' | 'thinking';

export type MistakeRecord = {
  id: string;
  ts: number;
  subject: string;
  topic: string;
  subTopicId?: string;
  questionId?: string;
  /** Question text — kept so AI-generated questions (no id) can be re-shown. */
  questionText?: string;
  userAnswer?: string;
  correctAnswer?: string;
  category: ErrorCategory;
  source: MistakeSource;
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAll(): MistakeRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MistakeRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: MistakeRecord[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // quota / disabled — ignore
  }
}

function genId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Append a mistake. Returns the new record's id (for later re-tagging). */
export function recordMistake(m: Omit<MistakeRecord, 'id' | 'ts'>): string {
  const list = readAll();
  const rec: MistakeRecord = { ...m, id: genId(), ts: Date.now() };
  list.push(rec);
  writeAll(list.length > MAX_MISTAKES ? list.slice(list.length - MAX_MISTAKES) : list);
  return rec.id;
}

/** Re-tag a mistake's category (manual picker or AI suggestion). */
export function updateMistakeCategory(id: string, category: ErrorCategory): void {
  const list = readAll();
  const i = list.findIndex((m) => m.id === id);
  if (i < 0) return;
  list[i].category = category;
  writeAll(list);
}

/** All mistakes, newest first, optionally filtered by subject. */
export function getMistakes(subject?: string): MistakeRecord[] {
  const list = readAll().slice().reverse();
  return subject ? list.filter((m) => m.subject === subject) : list;
}

export function clearMistake(id: string): void {
  writeAll(readAll().filter((m) => m.id !== id));
}

export function clearAllMistakes(): void {
  writeAll([]);
}

export function totalMistakes(subject?: string): number {
  return getMistakes(subject).length;
}

export type CategoryStat = { category: ErrorCategory; count: number; pct: number };

/** Category breakdown, most-frequent first (pct is 0..1 of all mistakes). */
export function mistakesByCategory(subject?: string): CategoryStat[] {
  const list = getMistakes(subject);
  const counts = new Map<ErrorCategory, number>();
  for (const m of list) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
  const total = list.length || 1;
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count, pct: count / total }))
    .sort((a, b) => b.count - a.count);
}

/** The single most common category (or null if no mistakes). */
export function topCategory(subject?: string): CategoryStat | null {
  const b = mistakesByCategory(subject);
  return b.length ? b[0] : null;
}

export type TopicMistakeStat = {
  topic: string;
  count: number;
  topCategory: ErrorCategory | null;
  topCategoryPct: number; // share of this topic's mistakes in its top category
};

/** Per-topic mistake counts + each topic's dominant category, weakest first. */
export function mistakesByTopic(subject?: string): TopicMistakeStat[] {
  const list = getMistakes(subject);
  const byTopic = new Map<string, MistakeRecord[]>();
  for (const m of list) {
    const arr = byTopic.get(m.topic) ?? [];
    arr.push(m);
    byTopic.set(m.topic, arr);
  }
  return [...byTopic.entries()]
    .map(([topic, arr]) => {
      const counts = new Map<ErrorCategory, number>();
      for (const m of arr) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
      let top: ErrorCategory | null = null;
      let max = 0;
      for (const [c, n] of counts)
        if (n > max) {
          max = n;
          top = c;
        }
      return {
        topic,
        count: arr.length,
        topCategory: top,
        topCategoryPct: arr.length ? max / arr.length : 0,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/** Recent mistakes that carry enough info to re-display for practice. */
export function mistakesForPractice(limit = 10, subject?: string): MistakeRecord[] {
  return getMistakes(subject)
    .filter((m) => m.questionText || m.questionId)
    .slice(0, limit);
}
