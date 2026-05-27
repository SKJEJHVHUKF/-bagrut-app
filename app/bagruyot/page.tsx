'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  XCircle,
  AlertCircle,
  Sparkles,
  Archive,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isProUser } from '@/lib/access';
import { MathText } from '@/components/practice/MathText';
import {
  ALL_PAST_BAGRUYOT,
  availableYears,
  availableTopics,
  totalQuestions,
  type PastBagrutQuestion,
  type BagrutPaper,
  type PastBagrutPart,
} from '@/content/past-bagruyot';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'free' }
  | { status: 'pro' };

export default function BagruyotPage() {
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
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </main>
    );
  }

  if (auth.status === 'unauthenticated') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 max-w-md text-center space-y-4">
          <BookOpen className="w-12 h-12 text-emerald-400 mx-auto" />
          <h1 className="text-2xl font-black">מאגר בגרויות</h1>
          <p className="text-slate-300">יש להתחבר כדי לגשת למאגר.</p>
          <Link
            href={`/login?next=${encodeURIComponent('/bagruyot')}`}
            className="inline-flex items-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 px-6 py-3 rounded-2xl font-bold"
          >
            התחברות
          </Link>
        </div>
      </main>
    );
  }

  // ---------- Main UI (free + pro both allowed; AI check is Pro-only inside cards) ----------

  const years = availableYears();
  const topics = availableTopics();
  const totalCount = totalQuestions();
  const totalParts = ALL_PAST_BAGRUYOT.reduce((acc, q) => acc + q.parts.length, 0);
  const hasActiveFilter =
    filterYear !== 'all' || filterPaper !== 'all' || filterTopic !== 'all' || !!query;
  const isPro = auth.status === 'pro';

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      {/* ---------- Hero / Landing ---------- */}
      <header className="space-y-3 mb-6">
        <div className="text-xs font-black tracking-widest text-emerald-300 uppercase flex items-center gap-2">
          <Archive className="w-3.5 h-3.5" />
          <span>מאגר בגרויות</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black leading-tight">
          <span className="bg-gradient-to-l from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
            בגרויות אמיתיות, פתרונות מלאים
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
          שאלות מבגרויות עבר (משרד החינוך), מסודרות לפי שנה ושאלון. כל שאלה עם פתרון
          צעד-אחר-צעד, רמזים מדורגים — ואופציה לבדוק תשובה שלך מול AI.
        </p>
      </header>

      {/* ---------- Stats strip ---------- */}
      {totalCount > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <StatTile
            icon={<BookOpen className="w-4 h-4 text-emerald-300" />}
            value={totalCount}
            label="שאלות"
          />
          <StatTile
            icon={<Sparkles className="w-4 h-4 text-emerald-300" />}
            value={totalParts}
            label="תתי-סעיפים"
          />
          <StatTile
            icon={<Calendar className="w-4 h-4 text-emerald-300" />}
            value={years.length}
            label="שאלוני בגרות"
          />
        </div>
      )}

      {/* ---------- How it works (always visible — short) ---------- */}
      {totalCount > 0 && (
        <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 mb-6">
          <div className="text-xs font-black tracking-widest text-emerald-300 uppercase mb-3 flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5" /> איך משתמשים במאגר
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <HowStep n={1} title="בוחרים שאלה" desc="לפי שנה / שאלון / נושא" />
            <HowStep n={2} title="מנסים לפתור" desc="כל סעיף בנפרד, עם רמזים אם צריך" />
            <HowStep n={3} title="בודקים" desc={isPro ? 'AI משווה תשובה / פתרון מלא' : 'פתרון מלא (בדיקת AI ל-Pro)'} />
          </div>
        </div>
      )}

      {/* ---------- Empty repo state ---------- */}
      {totalCount === 0 && (
        <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="text-base font-black text-white">המאגר עדיין ריק — וזה במכוון</div>
          <p className="text-sm text-slate-200 leading-relaxed">
            המאגר הזה מיועד לשאלות מבגרויות <strong>אמיתיות</strong> בלבד, עם פתרונות מאומתים — כדי
            שכל שאלה שתחפש פה תהיה אותנטית 100%.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-emerald-200">איך עוזרים למלא אותו:</strong>
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-emerald-300 flex-shrink-0">1.</span>
              <span>
                תורד שאלוני בגרות עבר מאתר משרד החינוך (
                <code className="text-xs bg-white/5 px-1 rounded">meyda.education.gov.il</code>).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-300 flex-shrink-0">2.</span>
              <span>שלח לנו (טקסט או צילום) — נוסיף כל שאלה למאגר עם פתרון מאומת.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-300 flex-shrink-0">3.</span>
              <span>
                בינתיים, אפשר להשתמש ב-
                <Link href="/scan" className="text-emerald-200 underline">
                  צילום שאלה
                </Link>{' '}
                — AI יפתור כל שאלה שתעלה (פיצ׳ר Pro קיים).
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* ---------- Search + filters ---------- */}
      {totalCount > 0 && (
        <>
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש בנוסח השאלות..."
              className="w-full bg-white/[0.03] border border-white/10 focus:border-emerald-500/60 rounded-xl pr-10 pl-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <FilterSelect
              label="שנה"
              value={filterYear === 'all' ? 'all' : String(filterYear)}
              onChange={(v) => setFilterYear(v === 'all' ? 'all' : Number(v))}
              options={[
                { value: 'all', label: 'כל השנים' },
                ...years.map((y) => ({ value: String(y), label: String(y) })),
              ]}
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
              options={[
                { value: 'all', label: 'כל הנושאים' },
                ...topics.map((t) => ({ value: t, label: t })),
              ]}
            />
          </div>

          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="mb-4 inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200"
            >
              <X className="w-3 h-3" />
              נקה סינונים
            </button>
          )}

          {/* Results */}
          <div className="text-[10px] text-slate-500 mb-2">
            {filtered.length} מתוך {totalCount} שאלות
          </div>
          {filtered.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center text-slate-400">
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
                  isPro={isPro}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Bottom nav */}
      <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-sm">
        <Link href="/my-plan" className="text-slate-400 hover:text-slate-200">
          ← חזרה לתוכנית הלימוד
        </Link>
        {!isPro && (
          <Link
            href="/my-plan"
            className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200"
          >
            <Crown className="w-3.5 h-3.5" /> שדרוג ל-Pro
          </Link>
        )}
      </div>
    </main>
  );
}

// ============================================================
// Small helpers
// ============================================================

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center gap-1">
      {icon}
      <div className="text-xl sm:text-2xl font-black text-white">{value}</div>
      <div className="text-[10px] text-slate-400 tracking-wider">{label}</div>
    </div>
  );
}

function HowStep({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-black flex items-center justify-center">
        {n}
      </div>
      <div>
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
    </div>
  );
}

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
      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">
        <Filter className="w-3 h-3 inline" /> {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/[0.03] border border-white/10 focus:border-emerald-500/60 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================
// QuestionCard
// ============================================================

function QuestionCard({
  question,
  isOpen,
  onToggle,
  isPro,
}: {
  question: PastBagrutQuestion;
  isOpen: boolean;
  onToggle: () => void;
  isPro: boolean;
}) {
  const seasonHeb = question.season === 'summer' ? 'קיץ' : 'חורף';
  return (
    <article className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full text-right p-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                שאלון {question.paper}
              </span>
              <span className="bg-teal-500/15 border border-teal-500/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-teal-200">
                {question.topic}
              </span>
              <span className="text-[10px] text-slate-400">
                {seasonHeb} {question.year} • שאלה {question.questionNumber} • {question.totalPoints} נק׳
              </span>
            </div>
            <div className="text-sm text-slate-200 line-clamp-2 chat-md leading-relaxed">
              <MathText inline>{question.context}</MathText>
            </div>
          </div>
          <div className="flex-shrink-0 text-slate-400">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
          {/* Full context */}
          <div>
            <div className="text-xs font-black tracking-widest text-emerald-300 uppercase mb-1.5">נתון</div>
            <div className="chat-md text-sm text-slate-100 leading-relaxed">
              <MathText>{question.context}</MathText>
            </div>
          </div>

          {/* Parts — each is an interactive practice card */}
          {question.parts.map((part) => (
            <PartPracticeCard
              key={part.label}
              part={part}
              questionContext={question.context}
              isPro={isPro}
            />
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
// PartPracticeCard — answer + hints + show solution + AI check
// ============================================================

type CheckState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'done';
      verdict: 'correct' | 'partial' | 'wrong';
      feedback: string;
      tip?: string;
    }
  | { status: 'error'; message: string };

function PartPracticeCard({
  part,
  questionContext,
  isPro,
}: {
  part: PastBagrutPart;
  questionContext: string;
  isPro: boolean;
}) {
  const [answer, setAnswer] = useState('');
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [check, setCheck] = useState<CheckState>({ status: 'idle' });

  const hints = part.hints ?? [];
  const hasMoreHints = revealedHints < hints.length;

  const revealNextHint = () => {
    setRevealedHints((n) => Math.min(n + 1, hints.length));
  };

  const handleCheck = async () => {
    if (!isPro) return;
    if (!answer.trim()) return;
    setCheck({ status: 'loading' });
    try {
      const res = await fetch('/api/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: part.prompt,
          correctAnswer: part.solution.final_answer,
          userAnswer: answer,
          context: questionContext,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setCheck({
          status: 'error',
          message: errBody?.error ?? `שגיאה ${res.status}`,
        });
        return;
      }
      const data = await res.json();
      setCheck({
        status: 'done',
        verdict: data.verdict,
        feedback: data.feedback ?? '',
        tip: data.tip,
      });
    } catch {
      setCheck({ status: 'error', message: 'שגיאת רשת' });
    }
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 sm:p-4 space-y-3">
      {/* Header */}
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-black text-emerald-200">סעיף {part.label}.</span>
        {part.points != null && <span className="text-[10px] text-slate-400">{part.points} נק׳</span>}
      </div>

      {/* Prompt */}
      <div className="chat-md text-sm text-slate-100 leading-relaxed">
        <MathText>{part.prompt}</MathText>
      </div>

      {/* Answer input */}
      <div>
        <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">
          התשובה שלך
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="כתוב כאן את התשובה — אפשר טקסט, נוסחה, או צעדים..."
          rows={2}
          className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-500/60 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none resize-y transition-colors"
          dir="auto"
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {hints.length > 0 && (
          <button
            onClick={revealNextHint}
            disabled={!hasMoreHints}
            className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/30 rounded-full px-3 py-1.5 text-xs font-bold text-amber-200 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {revealedHints === 0
              ? `רמז (${hints.length})`
              : hasMoreHints
                ? `רמז נוסף (${revealedHints}/${hints.length})`
                : `כל הרמזים הוצגו (${hints.length})`}
          </button>
        )}

        <button
          onClick={() => setShowSolution((s) => !s)}
          className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-full px-3 py-1.5 text-xs font-bold text-emerald-200 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          {showSolution ? 'הסתר פתרון' : 'הצג פתרון מלא'}
        </button>

        <button
          onClick={handleCheck}
          disabled={!isPro || !answer.trim() || check.status === 'loading'}
          className="inline-flex items-center gap-1.5 bg-gradient-to-l from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-full px-3 py-1.5 text-xs font-bold text-white transition-colors"
          title={!isPro ? 'בדיקת AI — פיצ׳ר Pro' : ''}
        >
          {check.status === 'loading' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> בודק...
            </>
          ) : (
            <>
              {!isPro && <Crown className="w-3.5 h-3.5" />}
              בדוק תשובה
            </>
          )}
        </button>
      </div>

      {/* Pro upsell line — gentle */}
      {!isPro && (
        <p className="text-[11px] text-slate-500 leading-relaxed">
          בדיקת תשובה אוטומטית ע"י AI היא פיצ׳ר{' '}
          <Link href="/my-plan" className="text-amber-300 hover:text-amber-200 underline">
            Pro
          </Link>
          . רמזים והפתרון המלא — חופשי לכולם.
        </p>
      )}

      {/* Hints — revealed progressively */}
      {revealedHints > 0 && (
        <div className="space-y-1.5">
          {hints.slice(0, revealedHints).map((hint, i) => (
            <div
              key={i}
              className="bg-amber-500/8 border border-amber-500/25 rounded-lg p-2.5 flex gap-2"
            >
              <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <div className="chat-md text-sm text-amber-50 leading-relaxed">
                <span className="text-amber-300 font-bold">רמז {i + 1}:</span>{' '}
                <span className="inline">
                  <MathText inline>{hint}</MathText>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Check result */}
      {check.status === 'done' && <CheckResult check={check} />}
      {check.status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-sm text-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{check.message}</span>
        </div>
      )}

      {/* Full solution */}
      {showSolution && (
        <div className="mt-2 pl-3 border-r-2 border-emerald-500/30 space-y-1.5">
          <div className="text-xs font-black tracking-widest text-emerald-300 uppercase mb-1.5">
            פתרון
          </div>
          {part.solution.steps.map((step, i) => (
            <div key={i} className="chat-md text-sm text-slate-200 leading-relaxed">
              <span className="text-emerald-400 font-bold">{i + 1}.</span>{' '}
              <span className="inline">
                <MathText inline>{step}</MathText>
              </span>
            </div>
          ))}
          <div className="mt-2 bg-emerald-500/10 border border-emerald-500/40 rounded-lg p-2">
            <div className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">
              תשובה סופית
            </div>
            <div className="chat-md text-sm font-bold text-emerald-50 leading-relaxed mt-0.5">
              <MathText inline>{part.solution.final_answer}</MathText>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckResult({
  check,
}: {
  check: Extract<CheckState, { status: 'done' }>;
}) {
  const styleByVerdict = {
    correct: {
      bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-50',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />,
      label: 'נכון',
      labelColor: 'text-emerald-300',
    },
    partial: {
      bg: 'bg-amber-500/10 border-amber-500/40 text-amber-50',
      icon: <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />,
      label: 'חלקי',
      labelColor: 'text-amber-300',
    },
    wrong: {
      bg: 'bg-red-500/10 border-red-500/40 text-red-50',
      icon: <XCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />,
      label: 'שגוי',
      labelColor: 'text-red-300',
    },
  }[check.verdict];

  return (
    <div className={`border rounded-lg p-3 flex gap-2.5 ${styleByVerdict.bg}`}>
      {styleByVerdict.icon}
      <div className="flex-1 space-y-1">
        <div className={`text-xs font-black tracking-widest uppercase ${styleByVerdict.labelColor}`}>
          {styleByVerdict.label}
        </div>
        <div className="chat-md text-sm leading-relaxed">
          <MathText inline>{check.feedback}</MathText>
        </div>
        {check.tip && (
          <div className="text-xs text-slate-300 italic pt-1">
            💡 <MathText inline>{check.tip}</MathText>
          </div>
        )}
      </div>
    </div>
  );
}
