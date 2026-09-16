'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, BookOpen, Printer } from 'lucide-react';
import { allLessonKeys, getLesson } from '@/content/lessons';
import { sheetFormulas } from '@/content/formula-sheet';
import { MathText } from '@/components/practice/MathText';
import { topicHref } from '@/lib/track';
import { TINT_FONT, TOPIC_TINTS, TintBadge, tintCard, hexA, type Tint } from '@/components/tint/tint';

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

  // Same curated set, in the same order, as the FormulaSheet drawer — the
  // drawer links here as "לכל הנוסחאות והדפסה", so the two must not disagree.
  const topicBlocks = allLessonKeys()
    .map(({ subject, topic }) => {
      const lesson = getLesson(subject, topic);
      const formulas = sheetFormulas(lesson, topic);
      if (!lesson || !formulas.length) return null;
      return { subject, topic, title: lesson.title, formulas };
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
      className="min-h-screen text-[#121420] relative overflow-x-hidden"
      style={TINT_FONT}
    >
      <GridBackground />
      <TopBar onPrint={printPage} />

      <main className="relative z-10 max-w-[1008px] mx-auto px-4 py-8 space-y-6">
        {/* The hero panel was a decorated restatement of the page title. The
            count is the only fact it carried, so it moves into the header. */}
        <header className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[28px] sm:text-[32px] leading-10 font-bold tracking-[-0.01em]">דף נוסחאות</h1>
          <p className="m-0 text-base text-[#4F5566]">
            {totalFormulas > 0
              ? `כל הנוסחאות של מתמטיקה 5 יח׳ במקום אחד, לפי נושא. ${totalFormulas} נוסחאות.`
              : 'כל הנוסחאות של מתמטיקה 5 יח׳ במקום אחד, לפי נושא.'}
          </p>
        </header>

        {/* Search */}
        <section className="sticky top-16 z-30 -mx-2 px-2 py-2 bg-[var(--background)]/90 backdrop-blur-md rounded-2xl">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
            <input aria-label="חיפוש נוסחה"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש נוסחה (לדוגמה: שורשים, נגזרת, וייטה)..."
              className="w-full bg-white border-[1.6px] border-[#E2E0EA] focus:border-[#8B5CF6] rounded-full pr-11 pl-4 py-3 text-sm text-[#121420] placeholder:text-slate-500 outline-none transition-colors"
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
                className="text-sm px-4 py-1.5 rounded-full bg-white border-[1.6px] border-[#E2E0EA] hover:border-[#8B5CF6] hover:text-[#5B21B6] text-[#3D4250] transition-colors"
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
          filtered.map((block) => {
            // Colour follows the topic's place in the full list, so a search
            // that hides topics does not repaint the ones that remain.
            const tint = TOPIC_TINTS[topicBlocks.findIndex((b) => b.topic === block.topic) % TOPIC_TINTS.length];
            return (
              <section
                key={`${block.subject}:${block.topic}`}
                id={`topic-${encodeURIComponent(block.topic)}`}
                className="scroll-mt-32 space-y-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="m-0 text-[22px] font-bold">{block.topic}</h2>
                  <Link
                    href={topicHref(block.topic)}
                    className="text-sm inline-flex items-center gap-1 transition-opacity hover:opacity-75 shrink-0"
                    style={{ color: tint.ink }}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>למסלול הלמידה</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {block.formulas.map((f, i) => (
                    <FormulaCard key={i} tint={tint} name={f.name} latex={f.latex} note={f.note} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}

function FormulaCard({
  tint,
  name,
  latex,
  note,
}: {
  tint: Tint;
  name: string;
  latex: string;
  note?: string;
}) {
  return (
    <div className="rounded-[20px] border p-4 flex flex-col gap-2.5" style={tintCard(tint)}>
      <div className="self-start chat-md">
        <TintBadge tint={tint}>
          <MathText inline>{name}</MathText>
        </TintBadge>
      </div>
      <div
        className="bg-white border rounded-xl px-3 py-2.5 text-center chat-md text-base overflow-x-auto"
        style={{ borderColor: hexA(tint.line, 0.4) }}
      >
        <MathText>{`$$${latex}$$`}</MathText>
      </div>
      {note && (
        <div className="text-[13px] text-[#4F5566] chat-md leading-relaxed">
          <MathText inline>{note}</MathText>
        </div>
      )}
    </div>
  );
}

/** The design's faint 40px grid and two soft corner washes (same as the archive). */
function GridBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 print:hidden"
      style={{
        backgroundColor: '#FBFBFD',
        backgroundImage:
          'radial-gradient(800px 500px at 100% 0%, rgba(124,58,237,0.07), rgba(124,58,237,0) 70%), radial-gradient(700px 500px at 0% 100%, rgba(42,111,181,0.06), rgba(42,111,181,0) 70%), linear-gradient(rgba(124,58,237,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.055) 1px, transparent 1px)',
        backgroundSize: 'auto, auto, 40px 40px, 40px 40px',
      }}
    />
  );
}

function TopBar({ onPrint }: { onPrint: () => void }) {
  return (
    // md:hidden — see the note in app/practice/page.tsx.
    <nav className="md:hidden sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none print:hidden">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/my-plan" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-500 to-amber-400 flex items-center justify-center shadow-xl shadow-violet-500/50 ring-1 ring-slate-900/10">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="text-base font-black font-display text-slate-800">
              MathUp
            </div>
            <div className="text-[10px] text-slate-600 -mt-0.5">דף נוסחאות</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrint}
            className="flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            aria-label="הדפס דף נוסחאות"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">הדפס</span>
          </button>
          <Link
            href="/my-plan"
            className="flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            <span>חזרה</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
