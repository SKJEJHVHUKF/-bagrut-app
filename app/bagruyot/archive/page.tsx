'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { sparkle, celebrateCorrect } from '@/lib/confetti';
import {
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Eye,
  CheckCircle2,
  ArrowRight,
  ScanLine,
  Home,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MathText } from '@/components/practice/MathText';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { hexA, TINT_FONT } from '@/components/tint/tint';
import {
  ALL_PAST_BAGRUYOT,
  availablePapers,
  totalQuestions,
  type PastBagrutQuestion,
  type PastBagrutPart,
  type BagrutPaper,
} from '@/content/past-bagruyot';

/** מועד א׳ before מועד ב׳ before מועד מיוחד, within the same year. */
const MOED_ORDER: Record<string, number> = { a: 0, b: 1, special: 2 };

/** Within a year, קיץ is the later (newer) session. */
const SEASON_ORDER: Record<string, number> = { summer: 0, winter: 1 };

const MOED_LABEL: Record<string, string> = { a: 'מועד א', b: 'מועד ב', special: 'מועד מיוחד' };

type Session = {
  key: string;
  year: number;
  season: 'summer' | 'winter';
  paper: string;
  moed?: string;
  count: number;
};

/**
 * The distinct exam sessions in the archive, newest first — one card per real
 * bagrut. Within a year the order is שאלון, then מועד, as in the 2026-09 design
 * (M53Bagruyot): 571 א, 571 ב, 572, …
 */
function examSessions(): Session[] {
  const map = new Map<string, Session>();
  for (const q of ALL_PAST_BAGRUYOT) {
    const key = sessionKeyOf(q);
    const found = map.get(key);
    if (found) found.count += 1;
    else map.set(key, { key, year: q.year, season: q.season, paper: q.paper, moed: q.moed, count: 1 });
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      b.year - a.year ||
      SEASON_ORDER[a.season] - SEASON_ORDER[b.season] ||
      a.paper.localeCompare(b.paper) ||
      MOED_ORDER[a.moed ?? 'a'] - MOED_ORDER[b.moed ?? 'a'],
  );
}

function sessionKeyOf(q: PastBagrutQuestion): string {
  return `${q.year}-${q.season}-${q.paper}-${q.moed ?? 'a'}`;
}

/** Card colour per שאלון — values from the design file, one hue family each. */
const PAPER_STYLE: Record<
  string,
  { bg: string; border: string; badge: string; ink: string; icon: 'doc' | 'book' | 'cap' }
> = {
  '571': { bg: '#E7F6EC', border: '#3DA85A', badge: '#2F8F4A', ink: '#1E6B35', icon: 'doc' },
  '572': { bg: '#E6F0FB', border: '#3B82C4', badge: '#2A6FB5', ink: '#1E4E80', icon: 'book' },
  '581': { bg: '#F2ECFF', border: '#8B5CF6', badge: '#7C3AED', ink: '#5B21B6', icon: 'cap' },
  '582': { bg: '#FDF5DE', border: '#C4940F', badge: '#B8860B', ink: '#7A5B08', icon: 'cap' },
};


/** The soft pill badge of direction ב: tinted fill, same-hue border, dark ink. */
function PaperBadge({ paper }: { paper: string }) {
  const st = PAPER_STYLE[paper] ?? PAPER_STYLE['581'];
  return (
    <span
      className="rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap border"
      style={{ background: hexA(st.badge, 0.12), color: st.ink, borderColor: hexA(st.badge, 0.25) }}
    >
      שאלון {paper}
    </span>
  );
}

/** How many exam cards show before "עוד N בגרויות". */
const FIRST_CARDS = 9;

const questionsLabel = (n: number) => (n === 1 ? 'שאלה אחת' : `${n} שאלות`);
const seasonLabel = (s: Session) => `${s.season === 'summer' ? 'קיץ' : 'חורף'} ${s.year}`;

// The archive is open to every signed-in student — free and Pro alike.
// Only the sign-in step remains, so progress can be attached to an account.
type AuthState = { status: 'loading' } | { status: 'unauthenticated' } | { status: 'in' };

export default function BagruyotArchivePage() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterPaper, setFilterPaper] = useState<BagrutPaper | 'all'>('all');
  const [openSession, setOpenSession] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setAuth({ status: 'unauthenticated' });
        return;
      }
      setAuth({ status: 'in' });
    });
  }, []);

  const sessions = useMemo(() => examSessions(), []);
  const shown = useMemo(
    () => sessions.filter((s) => filterPaper === 'all' || s.paper === filterPaper),
    [sessions, filterPaper],
  );

  // ---------- Auth gates ----------

  if (auth.status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </main>
    );
  }

  if (auth.status === 'unauthenticated') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="surface-premium rounded-2xl p-8 max-w-md text-center space-y-4">
          <BookOpen className="w-12 h-12 text-violet-600 mx-auto" />
          <h1 className="font-display text-2xl font-black">מאגר בגרויות</h1>
          <p className="text-slate-700">יש להתחבר כדי לגשת למאגר.</p>
          <Link
            href={`/login?next=${encodeURIComponent('/bagruyot/archive')}`}
            className="inline-flex items-center gap-2 bg-gradient-to-l from-violet-600 to-violet-600 px-6 py-3 rounded-2xl font-bold"
          >
            התחברות
          </Link>
        </div>
      </main>
    );
  }

  // ---------- Main UI ----------

  const totalCount = totalQuestions();
  const years = sessions.map((s) => s.year);
  const current = openSession ? sessions.find((s) => s.key === openSession) : undefined;
  const visible = showAll ? shown : shown.slice(0, FIRST_CARDS);
  const hidden = shown.slice(visible.length);

  return (
    <main
      className="relative min-h-screen px-4 sm:px-6 pt-10 pb-12 text-[#121420]"
      style={TINT_FONT}
    >
      {/* The design's faint 40px grid and two soft corner washes. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundColor: '#FBFBFD',
          backgroundImage:
            'radial-gradient(800px 500px at 100% 0%, rgba(124,58,237,0.07), rgba(124,58,237,0) 70%), radial-gradient(700px 500px at 0% 100%, rgba(42,111,181,0.06), rgba(42,111,181,0) 70%), linear-gradient(rgba(124,58,237,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.055) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 40px 40px, 40px 40px',
        }}
      />

      <div className="relative mx-auto max-w-[1008px] flex flex-col gap-7">
        {/* Top-left (the end side in RTL): back to the home screen, on both views. */}
        <Link
          href="/"
          className="absolute left-0 top-0 inline-flex items-center gap-1.5 rounded-full border-[1.6px] border-[#E2E0EA] bg-white px-4 py-1.5 text-sm text-[#3D4250] transition-colors hover:border-[#8B5CF6] hover:text-[#5B21B6]"
        >
          <Home className="w-4 h-4" />
          מסך הבית
        </Link>
        {current ? (
          <ExamView
            session={current}
            questions={ALL_PAST_BAGRUYOT.filter((q) => sessionKeyOf(q) === current.key).sort(
              (a, b) => a.questionNumber - b.questionNumber,
            )}
            onBack={() => {
              setOpenSession(null);
              setExpanded(null);
            }}
            expandedQuestion={expanded}
            onToggleQuestion={(id) => setExpanded(expanded === id ? null : id)}
          />
        ) : (
          <>
            <header className="flex flex-col gap-1.5">
              <h1 className="m-0 text-[28px] sm:text-[32px] leading-10 font-bold">בגרויות קודמות</h1>
              {totalCount > 0 ? (
                <p className="m-0 text-base text-[#4F5566]">
                  {totalCount} שאלות רשמיות של משרד החינוך, {Math.min(...years)} עד {Math.max(...years)}, עם פתרון
                  מלא לכל סעיף.
                </p>
              ) : (
                <p className="m-0 text-base text-[#4F5566]">המאגר עדיין ריק, אנחנו בונים אותו משאלוני בגרות אמיתיים.</p>
              )}
            </header>

            {sessions.length > 0 && (
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="סינון לפי שאלון">
                {(['all', ...availablePapers()] as const).map((p) => {
                  const active = filterPaper === p;
                  return (
                    <button
                      key={p}
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setFilterPaper(p);
                        setShowAll(false);
                      }}
                      className={`rounded-full px-4 py-1.5 text-sm transition-colors border-[1.6px] ${
                        active
                          ? 'bg-[#F2ECFF] text-[#5B21B6] border-[#8B5CF6] font-medium'
                          : 'bg-white text-[#3D4250] border-[#E2E0EA] hover:border-[#C9C5D8]'
                      }`}
                    >
                      {p === 'all' ? 'הכל' : `שאלון ${p}`}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map((s) => (
                <ExamCard key={s.key} session={s} onOpen={() => setOpenSession(s.key)} />
              ))}
            </div>

            {hidden.length > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="self-start text-sm text-[#4F5566] hover:text-[#5B21B6] underline-offset-4 hover:underline"
              >
                עוד {hidden.length} בגרויות משנים {Math.min(...hidden.map((s) => s.year))} עד{' '}
                {Math.max(...hidden.map((s) => s.year))}
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ============================================================
// ExamCard — one past bagrut in the grid (design: M53Bagruyot)
// ============================================================

function ExamCard({ session, onOpen }: { session: Session; onOpen: () => void }) {
  const st = PAPER_STYLE[session.paper] ?? PAPER_STYLE['581'];
  return (
    <button
      onClick={onOpen}
      className="relative overflow-hidden text-right rounded-[20px] p-6 h-44 flex flex-col items-start gap-2 border transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED]"
      style={{
        background: `linear-gradient(155deg, ${st.bg} 0%, #FFFFFF 78%)`,
        borderColor: hexA(st.border, 0.45),
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 14px 30px -18px ${hexA(st.badge, 0.45)}`,
      }}
    >
      <PaperBadge paper={session.paper} />
      <span className="text-[28px] font-bold leading-tight tracking-[-0.01em]">{seasonLabel(session)}</span>
      <span className="text-sm text-[#4F5566]">
        {session.moed ? `${MOED_LABEL[session.moed]} · ` : ''}
        {questionsLabel(session.count)}
      </span>
      <PaperIcon kind={st.icon} color={st.badge} />
    </button>
  );
}

/** The corner line-art, one drawing per שאלון family, in the paper's own colour. */
function PaperIcon({ kind, color }: { kind: 'doc' | 'book' | 'cap'; color: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 160"
      className="absolute left-[18px] bottom-3.5 w-[84px] h-[84px] opacity-30"
      fill="none"
      stroke={color}
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === 'doc' && (
        <>
          <path d="M40 14h60l24 24v108H40Z" />
          <path d="M100 14v24h24" />
          <path d="M54 56h54M54 74h54M54 92h34" />
          <path d="M60 118l12 12 24-26" />
        </>
      )}
      {kind === 'book' && (
        <>
          <path d="M80 40C62 28 38 26 16 30v96c22-4 46-2 64 10 18-12 42-14 64-10V30c-22-4-46-2-64 10Z" />
          <path d="M80 40v96" />
          <path d="M30 52c14-2 28 0 38 6M30 72c14-2 28 0 38 6M92 58c10-6 24-8 38-6M92 78c10-6 24-8 38-6" />
        </>
      )}
      {kind === 'cap' && (
        <>
          <path d="M12 64L80 34l68 30-68 30Z" />
          <path d="M40 78v32c24 18 56 18 80 0V78" />
          <path d="M148 64v40" />
          <circle cx="148" cy="110" r="6" />
        </>
      )}
    </svg>
  );
}

// ============================================================
// ExamView — one bagrut opened from its card: questions 1–8 in paper order
// ============================================================

function ExamView({
  session,
  questions,
  onBack,
  expandedQuestion,
  onToggleQuestion,
}: {
  session: Session;
  questions: PastBagrutQuestion[];
  onBack: () => void;
  expandedQuestion: string | null;
  onToggleQuestion: (id: string) => void;
}) {
  const st = PAPER_STYLE[session.paper] ?? PAPER_STYLE['581'];
  return (
    <>
      <header className="flex flex-col items-start gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-[#4F5566] hover:text-[#5B21B6]"
        >
          <ArrowRight className="w-4 h-4" />
          כל הבגרויות
        </button>
        <PaperBadge paper={session.paper} />
        <h1 className="m-0 text-[28px] sm:text-[32px] leading-10 font-bold">
          {seasonLabel(session)}
          {session.moed ? ` · ${MOED_LABEL[session.moed]}` : ''}
        </h1>
        <p className="m-0 text-base text-[#4F5566]">{questionsLabel(questions.length)}, עם פתרון מלא לכל סעיף.</p>
      </header>

      <section
        className="rounded-[20px] overflow-hidden border divide-y divide-slate-900/[0.06]"
        style={{
          background: `linear-gradient(170deg, ${st.bg} 0%, #FFFFFF 22%)`,
          borderColor: hexA(st.border, 0.45),
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 14px 30px -20px ${hexA(st.badge, 0.4)}`,
        }}
      >
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            isOpen={expandedQuestion === q.id}
            onToggle={() => onToggleQuestion(q.id)}
          />
        ))}
      </section>
    </>
  );
}

function QuestionCard({
  question,
  isOpen,
  onToggle,
}: {
  question: PastBagrutQuestion;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <article className={isOpen ? 'bg-slate-900/[0.015]' : ''}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full text-right px-4 py-3 hover:bg-slate-900/[0.03] transition-colors"
      >
        {/* Inside a session block the שאלון/מועד/שנה are already in the header,
            so the row shows only what separates one question from the next. */}
        <div className="flex items-center gap-3">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
              isOpen
                ? 'bg-violet-600 text-white'
                : 'bg-slate-900/[0.05] text-slate-700 border border-slate-900/[0.08]'
            }`}
          >
            {question.questionNumber}
          </div>
          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
            <span className="bg-violet-500/15 border border-violet-500/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-violet-800">
              {question.topic}
            </span>
            <span className="text-[10px] text-slate-500">
              {question.parts.length} סעיפים • {question.totalPoints} נק׳
            </span>
          </div>
          <div className="flex-shrink-0 text-slate-500">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 pt-1">
          {/* The question exactly as it is printed in the official exam paper */}
          {question.imageSrc && (
            <ExamScan src={question.imageSrc} label={`שאלה ${question.questionNumber} כפי שהיא מופיעה בשאלון`} />
          )}

          {/* Full context */}
          <div>
            <div className="text-xs font-black tracking-widest text-violet-700 uppercase mb-1.5">נתון</div>
            <div className="chat-md text-sm text-slate-800 leading-relaxed">
              <MathText>{question.context}</MathText>
            </div>
            {/* Question-level diagrams (e.g. the graph of the studied function) */}
            {question.diagrams && question.diagrams.length > 0 && (
              <DiagramRenderer diagrams={question.diagrams} />
            )}
          </div>

          {/* Parts — interactive practice */}
          {question.parts.map((part) => (
            <PartPracticeCard key={part.label} part={part} />
          ))}

          {/* Source attribution */}
          <div className="text-[10px] text-slate-500">
            מקור פתרון:{' '}
            {question.solutionSource === 'official'
              ? 'מפתרון רשמי של משרד החינוך'
              : question.solutionSource === 'ai-generated'
                ? 'נוצר ע"י Claude ועבר בדיקה'
                : 'נכתב ונבדק על-ידי הצוות'}
          </div>
        </div>
      )}
    </article>
  );
}

// ============================================================
// ExamScan — the printed question, cropped straight off the exam page
// ============================================================
//
// The transcription below it is ours; this is the wording the examiner
// actually used. Wide Hebrew lines stay legible on a phone by keeping a
// minimum width and letting the frame scroll sideways.

function ExamScan({ src, label }: { src: string; label: string }) {
  return (
    <figure className="space-y-1.5">
      <figcaption className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-500 uppercase">
        <ScanLine className="w-3 h-3" />
        {label}
      </figcaption>
      <div className="overflow-x-auto rounded-xl border border-slate-900/[0.08] bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static crop, intrinsic size varies per question */}
        <img
          src={src}
          alt={label}
          loading="lazy"
          className="block w-full min-w-[520px] max-w-none"
        />
      </div>
    </figure>
  );
}

// ============================================================
// PartPracticeCard — per-part study card: the scan, graded hints, full solution
// ============================================================
//
// There is deliberately no answer box here. A bagrut part is solved on paper —
// typing an expression into a textarea that nobody grades was busywork.

function PartPracticeCard({ part }: { part: PastBagrutPart }) {
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionShown, setSolutionShown] = useState(false);
  const [selfReport, setSelfReport] = useState<'correct' | 'wrong' | null>(null);

  const hasHints = !!part.hints && part.hints.length > 0;
  const moreHintsAvailable = hasHints && hintsShown < (part.hints?.length ?? 0);

  return (
    <div className="surface-premium rounded-xl p-3 space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-black text-violet-800">סעיף {part.label}.</span>
        {part.points != null && <span className="text-[10px] text-slate-600">{part.points} נק׳</span>}
      </div>

      {/* The sub-question exactly as it is printed in the official exam paper */}
      {part.imageSrc && <ExamScan src={part.imageSrc} label={`סעיף ${part.label} בשאלון המקורי`} />}

      <div className="chat-md text-sm text-slate-800 leading-relaxed">
        <MathText>{part.prompt}</MathText>
      </div>

      {/* Action buttons — subtle tap feedback */}
      <div className="flex flex-wrap gap-2">
        {hasHints && moreHintsAvailable && !solutionShown && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              const next = hintsShown + 1;
              setHintsShown(next);
              sparkle();
              toast.info(`רמז ${next} מתוך ${part.hints?.length}`, {
                description: 'נסה לפתור עם הרמז לפני שתסתכל בפתרון',
                duration: 2500,
              });
            }}
            className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-800 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {hintsShown === 0 ? 'רמז' : `רמז נוסף (${hintsShown + 1}/${part.hints?.length})`}
          </motion.button>
        )}
        {!solutionShown && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              setSolutionShown(true);
              toast.success(`סעיף ${part.label} — פתרון מלא`, {
                description: 'עבור על הצעדים ובדוק שהבנת',
                duration: 2000,
              });
            }}
            className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-800 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            פתרתי על דף — הצג פתרון מלא
          </motion.button>
        )}
        {solutionShown && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              setSolutionShown(false);
              setHintsShown(0);
            }}
            className="inline-flex items-center gap-1.5 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 text-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors"
          >
            סגור פתרון ונסה שוב
          </motion.button>
        )}
      </div>

      {/* Self-assessment after revealing the solution (paper-solver path) */}
      {solutionShown && (
        <div className="pt-2 border-t border-slate-900/[0.06]">
          {selfReport === null ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelfReport('correct');
                  celebrateCorrect();
                  toast.success('כל הכבוד! פתרת נכון', { duration: 1800 });
                }}
                className="inline-flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-800 rounded-lg px-3 py-2 text-xs font-bold transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                פתרתי נכון
              </button>
              <button
                onClick={() => {
                  setSelfReport('wrong');
                  toast.info('סומן — כדאי לחזור על הסעיף', { duration: 1800 });
                }}
                className="inline-flex items-center justify-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-800 rounded-lg px-3 py-2 text-xs font-bold transition-colors"
              >
                טעיתי כאן
              </button>
            </div>
          ) : (
            <div
              className={`text-center text-xs font-bold ${
                selfReport === 'correct' ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {selfReport === 'correct' ? '✓ סימנת: פתרתי נכון' : 'סומן: טעיתי כאן'}
            </div>
          )}
        </div>
      )}

      {/* Hints display — each slides in from top */}
      <AnimatePresence initial={false}>
        {hintsShown > 0 && !solutionShown && (
          <motion.div
            key="hints"
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {part.hints?.slice(0, hintsShown).map((hint, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: i === hintsShown - 1 ? 0 : 0 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex gap-2 items-start"
              >
                <Lightbulb className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="chat-md text-sm text-amber-900 leading-relaxed flex-1">
                  <div className="text-[10px] font-black tracking-widest text-amber-700 uppercase mb-1">
                    רמז {i + 1}
                  </div>
                  <MathText inline>{hint}</MathText>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solution display — slides down with cascading steps */}
      <AnimatePresence initial={false}>
        {solutionShown && (
          <motion.div
            key="solution"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
            className="pl-3 border-r-2 border-emerald-500/30"
          >
            <div className="space-y-1.5">
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="text-[10px] font-black tracking-widest text-emerald-700 uppercase mb-1 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3" />
                פתרון מלא
              </motion.div>
              {/* Per-part diagrams — appear with the solution */}
              {part.diagrams && part.diagrams.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.08 }}
                  className="my-2"
                >
                  <DiagramRenderer diagrams={part.diagrams} />
                </motion.div>
              )}
              {/* Block MathText, like the ladder's QuestionPartCard: `inline` ignored
                  ```signtable/```probtree/```geo fences, markdown tables, `\n\n` line
                  breaks and $$display$$ maths, so every solution read as one packed
                  paragraph (Itay, 2026-09-14: "הכל דחוס וממש לא מובן"). */}
              <ol className="space-y-5">
                {part.solution.steps.map((step, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    // Cap the stagger: an uncapped 0.06s/step made a long solution
                    // take over a second to finish appearing, which reads as lag.
                    transition={{ duration: 0.25, delay: 0.1 + Math.min(i, 7) * 0.05, ease: 'easeOut' }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-[11px] font-black text-emerald-800">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0 chat-md text-sm text-slate-800 leading-relaxed pt-0.5">
                      <MathText>{step}</MathText>
                    </div>
                  </motion.li>
                ))}
              </ol>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.35,
                  delay: 0.1 + part.solution.steps.length * 0.06,
                  ease: 'easeOut',
                }}
                className="mt-2 bg-emerald-500/10 border border-emerald-500/40 rounded-lg p-2"
              >
                <div className="text-[10px] font-black tracking-widest text-emerald-700 uppercase">תשובה סופית</div>
                <div className="chat-md text-sm font-bold text-emerald-900 leading-relaxed mt-0.5">
                  <MathText inline>{part.solution.final_answer}</MathText>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
