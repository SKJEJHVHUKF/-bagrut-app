import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight, Clock, Award, ListChecks } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BagrutQuestionBlock } from '@/components/practice/BagrutQuestionBlock';
import {
  ALL_MITKONOT,
  MITKONET_LEVELS,
  getMitkonetById,
  type MitkonetLevel,
} from '@/content/mitkonot';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return ALL_MITKONOT.map((q) => ({ id: q.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const q = getMitkonetById(id);
  if (!q) return { title: 'מתכונת לא נמצאה | MathUp' };
  return {
    title: `${q.title} · ${q.topic} | MathUp`,
    description: `שאלת מתכונת ב${q.topic}, ${q.parts.length} סעיפים, עם פתרון מלא שלב אחר שלב.`,
  };
}

/** The bank's own level maps onto the practice components' difficulty scale. */
const DIFFICULTY: Record<MitkonetLevel, 'easy' | 'mid' | 'hard'> = {
  1: 'easy',
  2: 'mid',
  3: 'hard',
};

export default async function MitkonetPage({ params }: Props) {
  const { id } = await params;
  const q = getMitkonetById(id);
  if (!q) notFound();

  const meta = MITKONET_LEVELS.find((m) => m.level === q.level)!;

  // The same topic at the other rungs. This is the whole point of grading by
  // difficulty rather than by exam session: a student who found this one hard
  // should be able to step DOWN in one tap, not go hunting.
  const siblings = ALL_MITKONOT.filter((o) => o.topic === q.topic && o.id !== q.id).sort(
    (a, b) => a.level - b.level,
  );

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <PageHeader
        title={q.title}
        description={`${q.topic} · שאלון ${q.paper} · ${meta.subtitle}`}
      />

      {/* The question's own vitals, on one line. */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${meta.chip}`}>
          {meta.title} · {meta.subtitle}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600">
          <ListChecks aria-hidden="true" className="w-3.5 h-3.5" />
          {q.parts.length} סעיפים
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600">
          <Clock aria-hidden="true" className="w-3.5 h-3.5" />
          {q.minutes} דקות
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600">
          <Award aria-hidden="true" className="w-3.5 h-3.5" />
          {q.points} נק׳
        </span>
      </div>

      <BagrutQuestionBlock
        question={{
          id: q.id,
          difficulty: DIFFICULTY[q.level],
          context: q.context,
          topic_tag: q.topic,
          parts: q.parts,
        }}
        topic={q.topic}
      />

      {siblings.length > 0 && (
        <section className="mt-10 surface-premium rounded-2xl p-5">
          <h2 className="font-display text-base font-black text-ink mb-1">
            אותו נושא, רמה אחרת
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            אם זה היה קשה מדי או קל מדי, אפשר לעבור רמה בלי לחזור אחורה.
          </p>
          <ul className="space-y-2">
            {siblings.map((s) => {
              const sMeta = MITKONET_LEVELS.find((m) => m.level === s.level)!;
              return (
                <li key={s.id}>
                  <Link
                    href={`/mitkonot/${s.id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-900/[0.03] hover:bg-slate-900/[0.06] transition-colors"
                  >
                    <span className={`w-1.5 h-8 rounded-full shrink-0 ${sMeta.rail}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-black text-slate-500">
                        {sMeta.title} · {sMeta.subtitle}
                      </span>
                      <span className="block text-sm font-bold text-ink truncate">{s.title}</span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="w-4 h-4 shrink-0 text-slate-400 rotate-180"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Link
        href="/mitkonot"
        className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 mt-8"
      >
        ← כל המתכונות
      </Link>
    </main>
  );
}
