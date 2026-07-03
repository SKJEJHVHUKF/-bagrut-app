'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, BookOpen, FileText, Printer } from 'lucide-react';
import { allLessonKeys, getLesson } from '@/content/lessons';
import { MathText } from '@/components/practice/MathText';

/**
 * /formulas — single page that aggregates every formula from every
 * registered lesson, grouped by topic, with sticky topic navigation
 * and a search box.
 *
 * The data source is purely the existing lesson registry — no new
 * content authored. Adding a formula in a lesson file automatically
 * shows up here.
 */
export default function FormulasPage() {
  const [query, setQuery] = useState('');

  // Aggregate all lessons that have at least one formula.
  const topicBlocks = allLessonKeys()
    .map(({ subject, topic }) => {
      const lesson = getLesson(subject, topic);
      if (!lesson || !lesson.formulas?.length) return null;
      return { subject, topic, title: lesson.title, formulas: lesson.formulas };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  // Filter — match query against topic name or formula name/note.
  const q = query.trim().toLowerCase();
  const filtered = q
    ? topicBlocks
        .map((b) => {
          const matchingFormulas = b.formulas.filter((f) => {
            const haystack = `${f.name} ${f.note ?? ''} ${b.topic}`.toLowerCase();
            return haystack.includes(q);
          });
          return matchingFormulas.length > 0 ? { ...b, formulas: matchingFormulas } : null;
        })
        .filter((b): b is NonNullable<typeof b> => b !== null)
    : topicBlocks;

  const totalFormulas = filtered.reduce((sum, b) => sum + b.formulas.length, 0);

  function printPage() {
    if (typeof window !== 'undefined') window.print();
  }

  return (
    <div
      className="min-h-screen text-slate-50 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <BackgroundOrbs />
      <TopBar onPrint={printPage} />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-600/15 to-indigo-600/15 backdrop-blur-md border border-indigo-500/30 rounded-3xl p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <FileText className="w-7 h-7 text-slate-900" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black mb-2">
            <span className="font-display text-slate-800">
              דף נוסחאות
            </span>
          </h1>
          <p className="text-sm text-slate-700">
            כל הנוסחאות של מתמטיקה 5 יח׳ במקום אחד.{' '}
            {totalFormulas > 0 && (
              <span className="text-indigo-700 font-bold">{totalFormulas} נוסחאות</span>
            )}
          </p>
        </section>

        {/* Search */}
        <section className="sticky top-16 z-30 -mx-2 px-2 py-2 bg-[#FDFDFB]/90 backdrop-blur-md rounded-2xl">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש נוסחה (לדוגמה: שורשים, נגזרת, וייטה)..."
              className="w-full surface-premium focus:border-indigo-500/60 rounded-xl pr-11 pl-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-colors"
            />
          </div>
        </section>

        {/* Topic nav chips */}
        {!q && (
          <nav className="flex flex-wrap gap-2 pb-2">
            {topicBlocks.map((b) => (
              <a
                key={`${b.subject}:${b.topic}`}
                href={`#topic-${encodeURIComponent(b.topic)}`}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-indigo-500/40 text-slate-700 font-bold transition-all"
              >
                {b.topic}
              </a>
            ))}
          </nav>
        )}

        {/* Topic sections */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">לא נמצאו נוסחאות התואמות לחיפוש &quot;{query}&quot;.</p>
          </div>
        ) : (
          filtered.map((block) => (
            <section
              key={`${block.subject}:${block.topic}`}
              id={`topic-${encodeURIComponent(block.topic)}`}
              className="scroll-mt-32 space-y-3"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-black text-slate-900">
                  <span className="font-display text-slate-800">
                    {block.topic}
                  </span>
                </h2>
                <Link
                  href={`/practice/${block.subject}/${encodeURIComponent(block.topic)}`}
                  className="text-xs text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>לשיעור המלא</span>
                </Link>
              </div>

              <div className="space-y-2">
                {block.formulas.map((f, i) => (
                  <FormulaRow key={i} name={f.name} latex={f.latex} note={f.note} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}

function FormulaRow({
  name,
  latex,
  note,
}: {
  name: string;
  latex: string;
  note?: string;
}) {
  return (
    <div className="surface-premium rounded-2xl p-4 space-y-2 hover:border-indigo-500/30 transition-colors">
      <div className="text-xs font-black text-indigo-800 tracking-wide chat-md">
        <MathText inline>{name}</MathText>
      </div>
      <div className="bg-slate-900/[0.03] border border-slate-900/[0.06] rounded-xl px-4 py-3 text-center chat-md text-base">
        <MathText>{`$$${latex}$$`}</MathText>
      </div>
      {note && (
        <div className="text-[11px] text-slate-600 chat-md leading-relaxed">
          <MathText inline>{note}</MathText>
        </div>
      )}
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 print:hidden">
      <div
        className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/25 blur-[120px] animate-pulse"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />
    </div>
  );
}

function TopBar({ onPrint }: { onPrint: () => void }) {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-[#FDFDFB]/80 border-b border-slate-900/10 print:hidden">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/my-plan" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-500 to-amber-400 flex items-center justify-center shadow-xl shadow-indigo-500/50 ring-1 ring-slate-900/10">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="text-base font-black font-display text-slate-800">
              בגרות בכיס
            </div>
            <div className="text-[10px] text-slate-600 -mt-0.5">דף נוסחאות</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrint}
            className="flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-indigo-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            aria-label="הדפס דף נוסחאות"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">הדפס</span>
          </button>
          <Link
            href="/my-plan"
            className="flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-indigo-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            <span>חזרה</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
