// ============================================================
// search-index.ts — one client-side index over everything searchable:
// topics, sub-topics, formulas, and past-bagrut questions. Built lazily on
// first open of the global search palette (the content modules are big).
// Zero network, zero API cost.
// ============================================================

import { MATH5_CURRICULUM } from '@/content/bagrut-curriculum';
import { allLessonKeys, getLesson } from '@/content/lessons';
import { ALL_PAST_BAGRUYOT } from '@/content/past-bagruyot';
import { normalizeQuestionText, tokenSet } from '@/lib/question-match';

export type SearchKind = 'topic' | 'subtopic' | 'formula' | 'bagrut';

export type SearchItem = {
  kind: SearchKind;
  title: string;
  subtitle: string;
  emoji?: string;
  href: string;
  /** Normalized haystack for matching. */
  norm: string;
};

export const KIND_LABELS: Record<SearchKind, string> = {
  topic: 'נושאים',
  subtopic: 'תתי-נושאים',
  formula: 'נוסחאות',
  bagrut: 'בגרויות מהמאגר',
};

const SEASON_HE: Record<string, string> = { summer: 'קיץ', winter: 'חורף' };

let _index: SearchItem[] | null = null;

export function buildIndex(): SearchItem[] {
  if (_index) return _index;
  const items: SearchItem[] = [];

  // Topics (curriculum — includes emoji + paper for context)
  for (const t of MATH5_CURRICULUM) {
    if (t.weight === 'out-of-scope') continue;
    items.push({
      kind: 'topic',
      title: t.displayName,
      subtitle: `שאלון ${t.paper}${t.alsoIn ? ` + ${t.alsoIn}` : ''}`,
      emoji: t.emoji,
      href: `/practice/math5/${encodeURIComponent(t.key)}`,
      norm: normalizeQuestionText(`${t.displayName} ${t.examStyle}`),
    });
  }

  // Sub-topics + formulas from every lesson
  for (const { subject, topic } of allLessonKeys()) {
    if (subject !== 'math5') continue;
    const lesson = getLesson(subject, topic);
    if (!lesson) continue;

    for (const sub of lesson.subTopics ?? []) {
      items.push({
        kind: 'subtopic',
        title: sub.title,
        subtitle: topic,
        emoji: sub.emoji,
        href: `/roadmap/${encodeURIComponent(sub.id)}`,
        norm: normalizeQuestionText(`${sub.title} ${sub.tagline} ${topic}`),
      });
    }

    const seen = new Set<string>();
    const formulaLists = [lesson.formulas ?? [], ...(lesson.subTopics ?? []).map((s) => s.formulas ?? [])];
    for (const list of formulaLists) {
      for (const f of list) {
        if (seen.has(f.name)) continue;
        seen.add(f.name);
        items.push({
          kind: 'formula',
          title: f.name,
          subtitle: topic,
          emoji: '📐',
          href: '/formulas',
          norm: normalizeQuestionText(`${f.name} ${topic}`),
        });
      }
    }
  }

  // Past bagrut questions
  for (const q of ALL_PAST_BAGRUYOT) {
    const season = SEASON_HE[q.season] ?? q.season;
    const moed = q.moed === 'b' ? ' מועד ב׳' : q.moed === 'special' ? ' מיוחד' : '';
    items.push({
      kind: 'bagrut',
      title: `${season} ${q.year}${moed} · שאלה ${q.questionNumber}`,
      subtitle: `${q.topic} · שאלון ${q.paper}`,
      emoji: '🏛️',
      href: '/bagruyot/archive',
      norm: normalizeQuestionText(`${q.topic} ${q.year} ${season} ${q.context.slice(0, 200)}`),
    });
  }

  _index = items;
  return items;
}

export type SearchResult = { item: SearchItem; score: number };

/** Score: substring hit = strong; token overlap = weaker. */
export function searchAll(query: string, perKind = 5): Map<SearchKind, SearchItem[]> {
  const q = normalizeQuestionText(query);
  const grouped = new Map<SearchKind, SearchItem[]>();
  if (q.length < 2) return grouped;

  const qTokens = [...tokenSet(q)];
  const results: SearchResult[] = [];

  for (const item of buildIndex()) {
    let score = 0;
    if (item.norm.includes(q)) score = 3;
    else {
      const hits = qTokens.filter((t) => item.norm.includes(t)).length;
      if (hits === qTokens.length && qTokens.length > 0) score = 2;
      else if (hits > 0) score = hits / qTokens.length;
    }
    if (score >= 1) results.push({ item, score });
  }

  results.sort((a, b) => b.score - a.score);
  for (const { item } of results) {
    const list = grouped.get(item.kind) ?? [];
    if (list.length < perKind) {
      list.push(item);
      grouped.set(item.kind, list);
    }
  }
  return grouped;
}
