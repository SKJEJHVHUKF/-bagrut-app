/**
 * tutor-faq/index.ts — lazy access to the per-topic FAQ banks.
 *
 * Each topic is its own module and is loaded with a dynamic import the first
 * time the bubble needs it. The banks are large (≈10 entries × 8 phrasings per
 * solution) and the bubble is mounted in the root layout, so a static import
 * here would put every topic's bank into the first-paint bundle of every page.
 */

import type { TutorFaqBank } from './types';

export * from './types';

type Loader = () => Promise<{ default: TutorFaqBank }>;

/** `${subject}/${topic}` → module. Add a line per generated file. */
const LOADERS: Record<string, Loader> = {
  'math5/סדרות': () => import('./math5/sequences'),
  'math5/הסתברות': () => import('./math5/probability'),
  'math5/טריגונומטריה': () => import('./math5/trigonometry'),
  'math5/גיאומטריה אוקלידית': () => import('./math5/euclidean-geometry'),
  'math5/פונקציות': () => import('./math5/functions'),
  // Covers the five בעיות קיצון stages only. The older חשבון דיפרנציאלי modules
  // and the topic's /quiz concept bank are still unbanked.
  'math5/חשבון דיפרנציאלי': () => import('./math5/derivatives'),
};

/**
 * Every registered bank, as [subject, topic].
 *
 * ⚠️ EXISTS BECAUSE THE GATE WAS BLIND. `scripts/test-tutor-faq` had its own
 * hardcoded list of two topics while LOADERS was the real registry, so a bank
 * registered here was live for students and invisible to the test — and the
 * run came back with the identical count, which reads as "nothing changed".
 * Found by the session authoring trigonometry, on the day it registered one.
 *
 * Anything that wants to iterate every bank must read this, never a copy.
 */
export function faqBankKeys(): Array<[string, string]> {
  return Object.keys(LOADERS).map((k) => {
    const i = k.indexOf('/');
    return [k.slice(0, i), k.slice(i + 1)] as [string, string];
  });
}

const cache = new Map<string, Promise<TutorFaqBank | null>>();

/** The bank for a topic, or null when none has been authored yet. Never throws. */
export function loadFaqBank(subject: string, topic: string): Promise<TutorFaqBank | null> {
  const key = `${subject}/${topic}`;
  const loader = LOADERS[key];
  if (!loader) return Promise.resolve(null);
  let p = cache.get(key);
  if (!p) {
    p = loader()
      .then((m) => m.default)
      .catch(() => null);
    cache.set(key, p);
  }
  return p;
}

export function hasFaqBank(subject: string, topic: string): boolean {
  return `${subject}/${topic}` in LOADERS;
}
