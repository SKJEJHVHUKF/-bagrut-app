'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { sparkle, celebrateCompletion } from '@/lib/confetti';
import {
  BookOpen,
  Loader2,
  Crown,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
  Lightbulb,
  Eye,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isProUser } from '@/lib/access';
import { MathText } from '@/components/practice/MathText';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import {
  ALL_PAST_BAGRUYOT,
  availableYears,
  availableTopics,
  totalQuestions,
  type PastBagrutQuestion,
  type PastBagrutPart,
  type BagrutPaper,
} from '@/content/past-bagruyot';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'free' }
  | { status: 'pro' };

export default function BagruyotArchivePage() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [filterPaper, setFilterPaper] = useState<BagrutPaper | 'all'>('all');
  const [filterTopic, setFilterTopic] = useState<string | 'all'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setAuth({ status: 'unauthenticated' });
        return;
      }
      setAuth({ status: isProUser(user) ? 'pro' : 'free' });
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_PAST_BAGRUYOT.filter((qn) => {
      if (filterYear !== 'all' && qn.year !== filterYear) return false;
      if (filterPaper !== 'all' && qn.paper !== filterPaper) return false;
      if (filterTopic !== 'all' && qn.topic !== filterTopic) return false;
      if (q) {
        const hay = [qn.context, qn.topic, ...qn.parts.map((p) => p.prompt)].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filterYear, filterPaper, filterTopic, query]);

  const clearFilters = () => {
    setFilterYear('all');
    setFilterPaper('all');
    setFilterTopic('all');
    setQuery('');
  };

  // ---------- Auth gates ----------

  if (auth.status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </main>
    );
  }

  if (auth.status === 'unauthenticated') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="surface-premium rounded-2xl p-8 max-w-md text-center space-y-4">
          <BookOpen className="w-12 h-12 text-indigo-600 mx-auto" />
          <h1 className="font-display text-2xl font-black">מאגר בגרויות</h1>
          <p className="text-slate-700">יש להתחבר כדי לגשת למאגר.</p>
          <Link
            href={`/login?next=${encodeURIComponent('/bagruyot/archive')}`}
            className="inline-flex items-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-600 px-6 py-3 rounded-2xl font-bold"
          >
            התחברות
          </Link>
        </div>
      </main>
    );
  }

  if (auth.status === 'free') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="surface-premium rounded-2xl p-8 max-w-md text-center space-y-4">
          <Crown className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="font-display text-2xl font-black">מאגר בגרויות — פיצ׳ר Pro</h1>
          <p className="text-slate-700 leading-relaxed">
            תרגול שאלות בגרות אמיתיות עם רמזים מדורגים ופתרונות מלאים. שדרג ל-Pro כדי לגשת.
          </p>
          <Link
            href="/my-plan"
            className="inline-flex items-center gap-2 bg-gradient-to-l from-amber-500 to-orange-500 px-6 py-3 rounded-2xl font-bold"
          >
            פרטים על Pro
          </Link>
        </div>
      </main>
    );
  }

  // ---------- Main UI (Pro) ----------

  const years = availableYears();
  const topics = availableTopics();
  const totalCount = totalQuestions();
  const hasActiveFilter = filterYear !== 'all' || filterPaper !== 'all' || filterTopic !== 'all' || !!query;

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <header className="space-y-2 mb-6">
        <Link
          href="/bagruyot"
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800"
        >
          <ArrowRight className="w-3 h-3" />
          חזרה לדף המאגר
        </Link>
        <div className="text-xs font-black tracking-widest text-indigo-700 uppercase flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>ארכיון בגרויות</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-black leading-tight">
          <span className="font-display text-slate-800">
            תרגל מהבגרויות
          </span>
        </h1>
        {totalCount > 0 ? (
          <p className="text-sm text-slate-600">
            {totalCount} שאלות מ-{years.length} שאלוני בגרות. מסונן ל-{filtered.length} שאלות.
          </p>
        ) : (
          <p className="text-sm text-slate-600">המאגר עדיין ריק — אנחנו בונים אותו משאלוני בגרות אמיתיים.</p>
        )}
      </header>

      {/* Empty repository — show big helpful card and skip filters */}
      {totalCount === 0 && (
        <div className="bg-gradient-to-br from-indigo-600/10 to-indigo-600/10 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="text-base font-black text-slate-900">המאגר עדיין ריק — וזה במכוון</div>
          <p className="text-sm text-slate-800 leading-relaxed">
            המאגר הזה מיועד לשאלות מבגרויות <strong>אמיתיות</strong> בלבד, עם פתרונות מאומתים — כדי שכל
            שאלה שתחפש פה תהיה אותנטית 100%.
          </p>
        </div>
      )}

      {/* Search — hide when repo empty */}
      {totalCount > 0 && (
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש בנוסח השאלות..."
            className="w-full surface-premium focus:border-indigo-500/60 rounded-xl pr-10 pl-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-colors"
          />
        </div>
      )}

      {/* Filters — hide when repo empty */}
      {totalCount > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <FilterSelect
              label="שנה"
              value={filterYear === 'all' ? 'all' : String(filterYear)}
              onChange={(v) => setFilterYear(v === 'all' ? 'all' : Number(v))}
              options={[{ value: 'all', label: 'כל השנים' }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
            />
            <FilterSelect
              label="שאלון"
              value={filterPaper}
              onChange={(v) => setFilterPaper(v as BagrutPaper | 'all')}
              options={[
                { value: 'all', label: 'כל השאלונים' },
                { value: '581', label: 'שאלון 581' },
                { value: '582', label: 'שאלון 582' },
              ]}
            />
            <FilterSelect
              label="נושא"
              value={filterTopic}
              onChange={setFilterTopic}
              options={[{ value: 'all', label: 'כל הנושאים' }, ...topics.map((t) => ({ value: t, label: t }))]}
            />
          </div>

          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="mb-4 inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800"
            >
              <X className="w-3 h-3" />
              נקה סינונים
            </button>
          )}

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="surface-premium rounded-2xl p-8 text-center text-slate-600">
              לא נמצאו שאלות לסינון הנוכחי. נסה לשנות פילטרים.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  isOpen={expanded === q.id}
                  onToggle={() => setExpanded(expanded === q.id ? null : q.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Bottom nav */}
      <div className="mt-8 pt-6 border-t border-slate-900/10">
        <Link href="/my-plan" className="text-sm text-slate-600 hover:text-slate-800">
          ← חזרה לתוכנית הלימוד
        </Link>
      </div>
    </main>
  );
}

// ============================================================
// Helpers
// ============================================================

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10px] font-black tracking-widest text-slate-600 uppercase mb-1">
        <Filter className="w-3 h-3 inline" /> {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full surface-premium focus:border-indigo-500/60 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
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
  const seasonHeb = question.season === 'summer' ? 'קיץ' : 'חורף';
  const moedHeb =
    question.moed === 'a'
      ? 'מועד א\''
      : question.moed === 'b'
        ? 'מועד ב\''
        : question.moed === 'special'
          ? 'מועד מיוחד'
          : null;
  return (
    <article className="surface-premium rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full text-right p-4 hover:bg-slate-900/[0.02] transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="bg-indigo-500/15 border border-indigo-500/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                שאלון {question.paper}
              </span>
              <span className="bg-indigo-500/15 border border-indigo-500/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                {question.topic}
              </span>
              {moedHeb && (
                <span className="bg-amber-500/15 border border-amber-500/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  {moedHeb}
                </span>
              )}
              <span className="text-[10px] text-slate-600">
                {seasonHeb} {question.year} • שאלה {question.questionNumber} • {question.totalPoints} נק׳
              </span>
            </div>
            <div className="text-sm text-slate-800 line-clamp-2 chat-md leading-relaxed">
              <MathText inline>{question.context}</MathText>
            </div>
          </div>
          <div className="flex-shrink-0 text-slate-600">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-900/10 pt-4">
          {/* Full context */}
          <div>
            <div className="text-xs font-black tracking-widest text-indigo-700 uppercase mb-1.5">נתון</div>
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
// PartPracticeCard — per-part interactive practice (answer + hints + solution)
// ============================================================

function PartPracticeCard({ part }: { part: PastBagrutPart }) {
  const [answer, setAnswer] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionShown, setSolutionShown] = useState(false);

  const hasHints = !!part.hints && part.hints.length > 0;
  const moreHintsAvailable = hasHints && hintsShown < (part.hints?.length ?? 0);

  return (
    <div className="surface-premium rounded-xl p-3 space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-black text-indigo-800">סעיף {part.label}.</span>
        {part.points != null && <span className="text-[10px] text-slate-600">{part.points} נק׳</span>}
      </div>
      <div className="chat-md text-sm text-slate-800 leading-relaxed">
        <MathText>{part.prompt}</MathText>
      </div>

      {/* Answer textarea — collapses when solution shown */}
      <AnimatePresence initial={false}>
        {!solutionShown && (
          <motion.div
            key="answer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <label className="block text-[10px] font-black tracking-widest text-slate-600 uppercase mb-1.5">
              התשובה שלך
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={
                part.answer_type === 'proof'
                  ? 'כתוב כאן את ההוכחה שלך, צעד אחר צעד...'
                  : 'כתוב כאן את התשובה...'
              }
              rows={3}
              className="w-full bg-slate-900/[0.04] border border-slate-900/10 focus:border-indigo-500/60 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-colors resize-y"
              dir="auto"
            />
          </motion.div>
        )}
      </AnimatePresence>

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
            הצג פתרון
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
              {part.solution.steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 + i * 0.06, ease: 'easeOut' }}
                  className="chat-md text-sm text-slate-800 leading-relaxed"
                >
                  <span className="text-emerald-700 font-bold">{i + 1}.</span>{' '}
                  <span className="inline">
                    <MathText inline>{step}</MathText>
                  </span>
                </motion.div>
              ))}
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
