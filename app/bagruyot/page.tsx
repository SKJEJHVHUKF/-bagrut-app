'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Loader2, Crown, ChevronDown, ChevronUp, Search, Filter, X } from 'lucide-react';
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
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </main>
    );
  }

  if (auth.status === 'unauthenticated') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 max-w-md text-center space-y-4">
          <BookOpen className="w-12 h-12 text-purple-400 mx-auto" />
          <h1 className="text-2xl font-black">מאגר בגרויות</h1>
          <p className="text-slate-300">יש להתחבר כדי לגשת למאגר.</p>
          <Link
            href={`/login?next=${encodeURIComponent('/bagruyot')}`}
            className="inline-flex items-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 px-6 py-3 rounded-2xl font-bold"
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
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 max-w-md text-center space-y-4">
          <Crown className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="text-2xl font-black">מאגר בגרויות — פיצ׳ר Pro</h1>
          <p className="text-slate-300 leading-relaxed">
            מאגר שאלות בגרות עם פתרונות מלאים, מסודרות לפי שנה ושאלון. שדרג ל-Pro כדי לגשת.
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
        <div className="text-xs font-black tracking-widest text-purple-300 uppercase flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>מאגר בגרויות</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black leading-tight">
          <span className="bg-gradient-to-l from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            שאלות בגרות + פתרונות
          </span>
        </h1>
        {totalCount > 0 ? (
          <p className="text-sm text-slate-400">
            {totalCount} שאלות מ-{years.length} שאלוני בגרות. מסונן ל-{filtered.length} שאלות.
          </p>
        ) : (
          <p className="text-sm text-slate-400">המאגר עדיין ריק — אנחנו בונים אותו משאלוני בגרות אמיתיים.</p>
        )}
      </header>

      {/* Empty repository — show big helpful card and skip filters */}
      {totalCount === 0 && (
        <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="text-base font-black text-white">המאגר עדיין ריק — וזה במכוון</div>
          <p className="text-sm text-slate-200 leading-relaxed">
            המאגר הזה מיועד לשאלות מבגרויות <strong>אמיתיות</strong> בלבד, עם פתרונות מאומתים — כדי שכל
            שאלה שתחפש פה תהיה אותנטית 100%.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-purple-200">איך עוזרים למלא אותו:</strong>
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-purple-300 flex-shrink-0">1.</span>
              <span>תורד שאלוני בגרות עבר מאתר משרד החינוך (<code className="text-xs bg-white/5 px-1 rounded">meyda.education.gov.il</code>).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-300 flex-shrink-0">2.</span>
              <span>שלח לנו (טקסט או צילום) — נוסיף כל שאלה למאגר עם פתרון מאומת.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-300 flex-shrink-0">3.</span>
              <span>בינתיים, אפשר להשתמש ב-<Link href="/scan" className="text-purple-200 underline">צילום שאלה</Link> — AI יפתור כל שאלה שתעלה (פיצ׳ר Pro קיים).</span>
            </li>
          </ul>
        </div>
      )}

      {/* Search — hide when repo empty */}
      {totalCount > 0 && (
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש בנוסח השאלות..."
            className="w-full bg-white/[0.03] border border-white/10 focus:border-purple-500/60 rounded-xl pr-10 pl-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
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
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200"
        >
          <X className="w-3 h-3" />
          נקה סינונים
        </button>
      )}

      {/* Results */}
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
            />
          ))}
        </div>
      )}
        </>
      )}

      {/* Bottom nav */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <Link href="/my-plan" className="text-sm text-slate-400 hover:text-slate-200">
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
      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">
        <Filter className="w-3 h-3 inline" /> {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/[0.03] border border-white/10 focus:border-purple-500/60 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors"
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
  return (
    <article className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full text-right p-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="bg-purple-500/15 border border-purple-500/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-purple-200">
                שאלון {question.paper}
              </span>
              <span className="bg-pink-500/15 border border-pink-500/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-pink-200">
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
            <div className="text-xs font-black tracking-widest text-purple-300 uppercase mb-1.5">נתון</div>
            <div className="chat-md text-sm text-slate-100 leading-relaxed">
              <MathText>{question.context}</MathText>
            </div>
          </div>

          {/* Parts */}
          {question.parts.map((part) => (
            <div key={part.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-3 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-black text-purple-200">סעיף {part.label}.</span>
                {part.points != null && (
                  <span className="text-[10px] text-slate-400">{part.points} נק׳</span>
                )}
              </div>
              <div className="chat-md text-sm text-slate-100 leading-relaxed">
                <MathText>{part.prompt}</MathText>
              </div>
              {/* Solution */}
              <details className="group">
                <summary className="cursor-pointer text-xs font-bold text-emerald-300 hover:text-emerald-200">
                  ▸ פתרון מלא
                </summary>
                <div className="mt-2 pl-3 border-r-2 border-emerald-500/30 space-y-1.5">
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
              </details>
            </div>
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
