'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  ArrowLeft,
  Lightbulb,
  KeyRound,
  CheckCircle,
  RotateCcw,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  BookMarked,
} from 'lucide-react';

// Renders markdown + LaTeX. `inline` strips the wrapping <p>.
function MathText({ children, inline = false }: { children: string; inline?: boolean }) {
  const components = inline
    ? { p: ({ children }: { children?: ReactNode }) => <>{children}</> }
    : undefined;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}

// ===== SUBJECTS (mirror of /quiz subject map, trimmed to the fields we need here) =====
const SUBJECTS = {
  math5: {
    name: 'מתמטיקה 5 יח׳',
    emoji: '📐',
    topics: [
      { name: 'אלגברה', sub: 'משוואות, אי-שוויונים' },
      { name: 'פונקציות', sub: 'לינארית, ריבועית' },
      { name: 'מעריכית ולוגריתמית', sub: 'חזקות, לוגריתמים' },
      { name: 'טריגונומטריה', sub: 'זהויות, משוואות' },
      { name: 'חשבון דיפרנציאלי', sub: 'נגזרות, חקירה' },
      { name: 'חשבון אינטגרלי', sub: 'אינטגרלים, שטחים' },
      { name: 'סדרות', sub: 'חשבונית, הנדסית' },
      { name: 'גאומטריה אנליטית', sub: 'הישר והמעגל' },
      { name: 'וקטורים במרחב', sub: 'מכפלות, ישרים' },
      { name: 'מספרים מרוכבים', sub: 'דה-מואבר' },
      { name: 'הסתברות', sub: 'קומבינטוריקה, ברנולי' },
      { name: 'סטטיסטיקה', sub: 'התפלגות נורמלית' },
    ],
  },
  math4: {
    name: 'מתמטיקה 4 יח׳',
    emoji: '🔢',
    topics: [
      { name: 'אלגברה', sub: 'משוואות, אי-שוויונים' },
      { name: 'פונקציות', sub: 'פולינומיות, רציונליות' },
      { name: 'מעריכית ולוגריתמית', sub: 'חזקות, לוגריתמים' },
      { name: 'טריגונומטריה', sub: 'פתרון משולשים' },
      { name: 'חשבון דיפרנציאלי', sub: 'נגזרות, חקירה' },
      { name: 'חשבון אינטגרלי', sub: 'אינטגרלים' },
      { name: 'גאומטריה אוקלידית', sub: 'משולשים, מעגלים' },
      { name: 'גאומטריה אנליטית', sub: 'הישר והמעגל' },
      { name: 'סדרות', sub: 'חשבוניות, הנדסיות' },
      { name: 'הסתברות', sub: 'נוסחאות בסיסיות' },
      { name: 'סטטיסטיקה', sub: 'ממוצע, סטיית תקן' },
    ],
  },
  physics: {
    name: 'פיזיקה',
    emoji: '⚛️',
    topics: [
      { name: 'מכניקה', sub: 'כוחות, תנועה' },
      { name: 'חשמל', sub: 'מעגלים, שדות' },
      { name: 'גלים', sub: 'גלים, עדשות' },
      { name: 'תרמודינמיקה', sub: 'חוקי החום' },
      { name: 'קוונטים', sub: 'פוטון' },
      { name: 'כבידה', sub: 'כוח, מסלולים' },
    ],
  },
  english: {
    name: 'אנגלית',
    emoji: '🇬🇧',
    topics: [
      { name: 'Reading', sub: 'הבנת הנקרא' },
      { name: 'Grammar', sub: 'דקדוק' },
      { name: 'Vocabulary', sub: 'אוצר מילים' },
      { name: 'Writing', sub: 'כתיבה' },
    ],
  },
  history: {
    name: 'היסטוריה',
    emoji: '📜',
    topics: [
      { name: 'השואה', sub: 'מדיניות נאצית' },
      { name: 'מלחמת עולם א׳', sub: 'סיבות, מהלך' },
      { name: 'מלחמת עולם ב׳', sub: 'חזיתות' },
      { name: 'הקמת המדינה', sub: 'ציונות' },
      { name: 'המהפכה הצרפתית', sub: 'סיבות' },
    ],
  },
  bible: {
    name: 'תנ"ך',
    emoji: '📕',
    topics: [
      { name: 'בראשית', sub: 'בריאה, אבות' },
      { name: 'שמות', sub: 'יציאת מצרים' },
      { name: 'שמואל', sub: 'שאול ודוד' },
      { name: 'מלכים', sub: 'שלמה, פיצול' },
      { name: 'נביאים', sub: 'ישעיהו, ירמיהו' },
    ],
  },
  chem: {
    name: 'כימיה',
    emoji: '🧪',
    topics: [
      { name: 'מבנה האטום', sub: 'מודלים' },
      { name: 'כימיה אורגנית', sub: 'פחמימנים' },
      { name: 'שיווי משקל', sub: 'לה-שטליה' },
      { name: 'חומצות ובסיסים', sub: 'pH' },
      { name: 'אלקטרוכימיה', sub: 'תאים' },
    ],
  },
} as const;

type SubjectKey = keyof typeof SUBJECTS;
type Difficulty = 'easier' | 'normal' | 'harder';

type Exercise = {
  problem: string;
  concept: string;
  hints: string[];
  solution: { steps: string[] };
  final_answer: string;
  remember: string;
};

function BagrutLogo() {
  return (
    <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-xl shadow-purple-500/50 ring-1 ring-white/20">
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white drop-shadow-md">
        <path
          d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export default function PracticePage() {
  const [subject, setSubject] = useState<SubjectKey>('math5');
  const [topic, setTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);

  // How many of the 3 hints have been revealed
  const [hintsShown, setHintsShown] = useState(0);
  // How many of the solution steps have been revealed; -1 means not yet started
  const [stepsShown, setStepsShown] = useState(-1);
  // Show the concept callout?
  const [conceptOpen, setConceptOpen] = useState(false);

  const subjectInfo = SUBJECTS[subject];

  async function loadExercise(opts?: { sameTopic?: boolean; difficulty?: Difficulty }) {
    if (!topic) return;
    setLoading(true);
    setError(null);
    setExercise(null);
    setHintsShown(0);
    setStepsShown(-1);
    setConceptOpen(false);

    const d = opts?.difficulty ?? difficulty;
    setDifficulty(d);

    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, difficulty: d }),
      });
      if (!res.ok) {
        let msg = '';
        try {
          const j = await res.json();
          msg = j?.error ?? '';
        } catch {
          msg = await res.text().catch(() => '');
        }
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as Exercise;
      setExercise(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // ===== PICKER (no exercise loaded yet) =====
  if (!exercise) {
    return (
      <div
        className="min-h-screen bg-slate-950 text-slate-50 relative overflow-x-hidden"
        style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
      >
        <BackgroundOrbs />
        <TopBar />

        <main className="relative z-10 max-w-2xl mx-auto px-4 py-8">
          <div className="mb-7">
            <h1 className="text-3xl sm:text-4xl font-black mb-2">
              <span className="bg-gradient-to-l from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                תרגול מודרך 🎯
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              תרגיל אחד מעמיק. רמזים פרוגרסיביים. פתרון צעד-אחר-צעד. כמו מורה פרטי שיושב לידך.
            </p>
          </div>

          {/* Subject tabs */}
          <div className="mb-5">
            <div className="text-xs font-black tracking-widest text-purple-300 mb-2 uppercase">
              מקצוע
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(Object.entries(SUBJECTS) as [SubjectKey, typeof SUBJECTS[SubjectKey]][]).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSubject(key);
                    setTopic(null);
                  }}
                  className={
                    subject === key
                      ? 'flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-l from-purple-600/40 to-pink-600/40 border border-purple-500/60 text-white font-bold text-sm transition-all'
                      : 'flex-shrink-0 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-sm transition-all'
                  }
                >
                  {s.emoji} {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Topic grid */}
          <div className="mb-5">
            <div className="text-xs font-black tracking-widest text-purple-300 mb-2 uppercase">
              נושא
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subjectInfo.topics.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setTopic(t.name)}
                  className={
                    topic === t.name
                      ? 'text-right px-4 py-3 rounded-2xl bg-gradient-to-l from-purple-600/30 to-pink-600/30 border border-purple-500/60 transition-all'
                      : 'text-right px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-purple-500/40 transition-all'
                  }
                >
                  <div className="font-bold text-sm text-white">{t.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="mb-6">
            <div className="text-xs font-black tracking-widest text-purple-300 mb-2 uppercase">
              רמת קושי
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['easier', 'קל', '🟢'],
                ['normal', 'בינוני', '🟡'],
                ['harder', 'מאתגר', '🔴'],
              ] as [Difficulty, string, string][]).map(([key, label, dot]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  className={
                    difficulty === key
                      ? 'px-3 py-2.5 rounded-xl bg-gradient-to-l from-purple-600/30 to-pink-600/30 border border-purple-500/60 font-bold text-sm transition-all'
                      : 'px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-sm transition-all'
                  }
                >
                  {dot} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={() => loadExercise()}
            disabled={!topic || loading}
            className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-purple-500/40 transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>תן לי תרגיל</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ===== EXERCISE VIEW =====
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-50 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <BackgroundOrbs />
      <TopBar />

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header: subject + topic */}
        <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-200 font-bold">
            {subjectInfo.emoji} {subjectInfo.name}
          </span>
          <span className="text-slate-500">•</span>
          <span>{topic}</span>
          <span className="text-slate-500">•</span>
          <span>
            {difficulty === 'easier' ? '🟢 קל' : difficulty === 'normal' ? '🟡 בינוני' : '🔴 מאתגר'}
          </span>
        </div>

        {/* The problem itself */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 mb-4 chat-md">
          <div className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase flex items-center gap-2">
            <Target className="w-3.5 h-3.5" />
            <span>השאלה</span>
          </div>
          <div className="text-base sm:text-lg font-medium leading-relaxed text-white">
            <MathText>{exercise.problem}</MathText>
          </div>
        </div>

        {/* Concept callout (collapsed by default — student should try first) */}
        <details
          open={conceptOpen}
          onToggle={(e) => setConceptOpen((e.target as HTMLDetailsElement).open)}
          className="mb-4 bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden"
        >
          <summary className="cursor-pointer px-4 py-3 flex items-center gap-2 text-sm text-slate-300 hover:bg-white/5 list-none">
            <BookMarked className="w-4 h-4 text-purple-300" />
            <span className="flex-1 font-bold">איזה כלל זה בודק?</span>
            {conceptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </summary>
          <div className="px-4 pb-4 chat-md text-sm text-slate-200">
            <MathText>{exercise.concept}</MathText>
          </div>
        </details>

        {/* Hints — progressively revealed */}
        {hintsShown > 0 && (
          <div className="space-y-2 mb-4">
            {exercise.hints.slice(0, hintsShown).map((h, i) => (
              <div
                key={i}
                className="bg-amber-500/5 border border-amber-500/30 rounded-2xl px-4 py-3 chat-md"
              >
                <div className="text-[11px] font-black tracking-widest text-amber-300 mb-1.5 uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>רמז {i + 1}</span>
                </div>
                <div className="text-sm text-amber-50/95">
                  <MathText>{h}</MathText>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hint button */}
        {hintsShown < exercise.hints.length && stepsShown < 0 && (
          <button
            onClick={() => setHintsShown((n) => Math.min(n + 1, exercise.hints.length))}
            className="w-full mb-3 inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-5 py-3 rounded-2xl font-bold text-amber-100 transition-all"
          >
            <Lightbulb className="w-5 h-5" />
            <span>
              💡 {hintsShown === 0 ? 'אני תקוע — תן לי רמז' : `רמז נוסף (${hintsShown + 1}/${exercise.hints.length})`}
            </span>
          </button>
        )}

        {/* Solution steps — progressively revealed */}
        {stepsShown >= 0 && (
          <div className="mb-4 bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-2xl p-4 sm:p-5">
            <div className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5" />
              <span>פתרון</span>
            </div>
            <ol className="space-y-3">
              {exercise.solution.steps.slice(0, stepsShown + 1).map((step, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-xs font-black text-purple-100">
                    {i + 1}
                  </div>
                  <div className="flex-1 chat-md text-sm text-slate-100 pt-0.5">
                    <MathText>{step}</MathText>
                  </div>
                </li>
              ))}
            </ol>

            {stepsShown < exercise.solution.steps.length - 1 ? (
              <button
                onClick={() => setStepsShown((n) => n + 1)}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 px-4 py-2.5 rounded-xl font-bold text-purple-100 text-sm transition-all"
              >
                <span>הצעד הבא ({stepsShown + 2}/{exercise.solution.steps.length})</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <>
                {/* Final answer + remember tip — shown only after all steps */}
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-4 py-3">
                  <div className="text-[11px] font-black tracking-widest text-emerald-300 mb-1.5 uppercase flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>תשובה סופית</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-emerald-50 chat-md">
                    <MathText inline>{exercise.final_answer}</MathText>
                  </div>
                </div>
                <div className="mt-3 bg-amber-500/8 border border-amber-500/30 rounded-xl px-4 py-3">
                  <div className="text-[11px] font-black tracking-widest text-amber-300 mb-1.5 uppercase">
                    💡 לזכור
                  </div>
                  <div className="text-sm text-amber-50/95 chat-md">
                    <MathText>{exercise.remember}</MathText>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Show full solution button */}
        {stepsShown < 0 && (
          <button
            onClick={() => setStepsShown(0)}
            className="w-full mb-3 inline-flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-purple-500/30 transition-all"
          >
            <KeyRound className="w-5 h-5" />
            <span>🔑 הראה לי את הפתרון</span>
          </button>
        )}

        {/* Next-exercise actions — visible once full solution is on screen */}
        {stepsShown === exercise.solution.steps.length - 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6">
            <button
              onClick={() => loadExercise({ difficulty })}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-3 rounded-2xl font-bold text-white shadow-lg shadow-purple-500/30 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>הבנתי — עוד תרגיל</span>
            </button>
            <button
              onClick={() => loadExercise({ difficulty: 'easier' })}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 px-4 py-3 rounded-2xl font-bold text-emerald-200 text-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>דומה אבל קל יותר</span>
            </button>
            <button
              onClick={() => loadExercise({ difficulty: 'harder' })}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/40 px-4 py-3 rounded-2xl font-bold text-rose-200 text-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>אתגר אותי יותר</span>
            </button>
          </div>
        )}

        {/* Always-available "back to picker" link */}
        <button
          onClick={() => setExercise(null)}
          className="mt-6 w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← בחר נושא אחר
        </button>

        {error && (
          <div className="mt-4 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

// ===== sub-components =====

function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/30 blur-[120px] animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/25 blur-[120px] animate-pulse"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />
    </div>
  );
}

function TopBar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-slate-950/60 border-b border-white/10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <BagrutLogo />
          <div>
            <div className="text-base font-black bg-gradient-to-l from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
              בגרות בכיס
            </div>
            <div className="text-[10px] text-slate-400 -mt-0.5">תרגול מודרך</div>
          </div>
        </Link>
        <Link
          href="/quiz"
          className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
        >
          <span>למבחן</span>
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>
    </nav>
  );
}
