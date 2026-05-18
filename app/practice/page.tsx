'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  BookOpen,
  Check,
} from 'lucide-react';
import { hasLesson } from '@/content/lessons';
import { getAllProgress } from '@/lib/progress';

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

export default function PracticePage() {
  const router = useRouter();
  const [subject, setSubject] = useState<SubjectKey>('math5');
  const [topic, setTopic] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  // Read localStorage once after mount. We don't subscribe to changes —
  // the badges refresh next time the user lands on the picker, which is
  // good enough for "did I already open this lesson?".
  const [viewedKeys, setViewedKeys] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const all = getAllProgress();
      const set = new Set<string>();
      for (const k of Object.keys(all)) {
        if (all[k]?.viewedAt) set.add(k);
      }
      setViewedKeys(set);
    } catch {
      // ignore — progress is best-effort
    }
  }, []);

  const subjectInfo = SUBJECTS[subject];

  function start() {
    if (!topic) return;
    setNavigating(true);
    const encoded = encodeURIComponent(topic);
    const href = hasLesson(subject, topic)
      ? `/practice/${subject}/${encoded}`
      : `/practice/${subject}/${encoded}/exercise?mode=quick`;
    router.push(href);
  }

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
            סיכום לימודי בנושא + שאלת בגרות עם רמזים ופתרון. כמו מורה פרטי שיושב לידך.
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
        <div className="mb-6">
          <div className="text-xs font-black tracking-widest text-purple-300 mb-2 uppercase">
            נושא
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subjectInfo.topics.map((t) => {
              const k = `${subject}:${t.name}`;
              const viewed = viewedKeys.has(k);
              const hasL = hasLesson(subject, t.name);
              return (
                <button
                  key={t.name}
                  onClick={() => setTopic(t.name)}
                  className={
                    topic === t.name
                      ? 'text-right px-4 py-3 rounded-2xl bg-gradient-to-l from-purple-600/30 to-pink-600/30 border border-purple-500/60 transition-all'
                      : 'text-right px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-purple-500/40 transition-all'
                  }
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white">{t.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{t.sub}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {hasL && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-200">
                          <BookOpen className="w-2.5 h-2.5" />
                          סיכום
                        </span>
                      )}
                      {viewed && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-200">
                          <Check className="w-2.5 h-2.5" />
                          נלמד
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={start}
          disabled={!topic || navigating}
          className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-purple-500/40 transition-all"
        >
          {navigating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>
                {topic && hasLesson(subject, topic) ? 'התחל ללמוד' : 'התחל לתרגל'}
              </span>
            </>
          )}
        </button>

        <p className="mt-3 text-[11px] text-slate-500 text-center">
          לנושאים מסומנים ב-📖 תקבל סיכום לימודי לפני התרגול.
        </p>
      </main>
    </div>
  );
}
