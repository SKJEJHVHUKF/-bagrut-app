import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronLeft, Clock, Award, ListChecks, Layers } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  ALL_MITKONOT,
  MITKONET_LEVELS,
  getMitkonotByLevel,
  mitkonotTopics,
  totalMitkonetParts,
} from '@/content/mitkonot';

export const metadata: Metadata = {
  title: 'מתכונות לפי רמת קושי | MathUp',
  description:
    'שאלות מתכונת בשלוש רמות קושי: קצת מתחת לרמת בגרות, רמת בגרות, ומעל רמת בגרות. עם פתרון מלא שלב אחר שלב.',
};

// The hub is a SERVER component on purpose: the bank is static content, so
// there is nothing to fetch and nothing to hydrate. The interactive part — the
// answer boxes, hints and tutor — lives one route down, inside the question.
export default function MitkonotHubPage() {
  const topics = mitkonotTopics();
  const parts = totalMitkonetParts();

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <PageHeader
        title="מתכונות לפי רמת קושי"
        description="שאלות בגרות שלמות, מסודרות לפי כמה שהן קשות ולא לפי מועד. בוחרים רמה, פותרים, ומשווים לפתרון המלא."
        actions={
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-600">
            <Layers aria-hidden="true" className="w-4 h-4 text-violet-600" />
            <span>
              {ALL_MITKONOT.length} מתכונות · {parts} סעיפים
            </span>
          </div>
        }
      />

      {/* What the ladder means, before the student picks a rung. */}
      <section className="surface-premium rounded-2xl p-5 mb-8">
        <h2 className="font-display text-base font-black text-ink mb-2">איך זה בנוי</h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          כל מתכונת היא שאלה שלמה בסגנון הבגרות, עם כמה סעיפים שנבנים זה על זה. שלוש הרמות אינן
          נושאים שונים אלא אותו נושא בשלוש דרגות קושי, ולכן אפשר לטפס: מתחילים ברמה שמרגישה נוחה
          ועולים עד שרמה 2 מרגישה שגרתית.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mt-2">
          לכל סעיף יש רמזים מדורגים, בדיקת תשובה, ופתרון מלא שלב אחר שלב, כולל שורת הכלל שמסבירה
          <span className="font-bold"> למה </span>
          בוחרים דווקא את הנוסחה הזו.
        </p>
        {topics.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-900/[0.06]">
            <span className="text-[11px] font-black tracking-wide text-slate-500">נושאים:</span>
            {topics.map((t) => (
              <span
                key={t}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-900/[0.04] text-slate-700"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="space-y-10">
        {MITKONET_LEVELS.map((meta) => {
          const questions = getMitkonotByLevel(meta.level);
          return (
            <section key={meta.level} aria-labelledby={`level-${meta.level}`}>
              {/* Level header — the rail carries the colour so the cards stay white. */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-1.5 self-stretch rounded-full ${meta.rail}`} aria-hidden="true" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2
                      id={`level-${meta.level}`}
                      className="font-display text-xl font-black text-ink"
                    >
                      {meta.title}
                    </h2>
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${meta.chip}`}>
                      {meta.subtitle}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1 max-w-prose">
                    {meta.blurb}
                  </p>
                </div>
              </div>

              {questions.length === 0 ? (
                <p className="text-sm text-slate-500 bg-slate-900/[0.03] rounded-xl px-4 py-3">
                  עוד לא נוספו מתכונות ברמה הזו.
                </p>
              ) : (
                <ul className="grid sm:grid-cols-2 gap-3">
                  {questions.map((q) => (
                    <li key={q.id}>
                      <Link
                        href={`/mitkonot/${q.id}`}
                        className="surface-premium rounded-2xl p-4 h-full flex flex-col gap-3 hover:shadow-lg transition-shadow group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[11px] font-black tracking-wide text-violet-700 mb-1">
                              {q.topic} · שאלון {q.paper}
                            </div>
                            <h3 className="font-display text-base font-black text-ink leading-snug">
                              {q.title}
                            </h3>
                          </div>
                          <ChevronLeft
                            aria-hidden="true"
                            className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-violet-600 transition-colors"
                          />
                        </div>

                        <ul className="flex flex-wrap gap-1.5">
                          {q.skills.map((s) => (
                            <li
                              key={s}
                              className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-900/[0.04] text-slate-700"
                            >
                              {s}
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto pt-2 border-t border-slate-900/[0.06] flex items-center gap-4 text-[11px] font-bold text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <ListChecks aria-hidden="true" className="w-3.5 h-3.5" />
                            {q.parts.length} סעיפים
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock aria-hidden="true" className="w-3.5 h-3.5" />
                            {q.minutes} דקות
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Award aria-hidden="true" className="w-3.5 h-3.5" />
                            {q.points} נק׳
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
