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
import MathUpLogo from '@/components/MathUpLogo';
import { PageHeader } from '@/components/PageHeader';
import {
  topicsByPaper,
  topicsForActivePaper,
  paperLabel,
  type BagrutPaper,
} from '@/content/bagrut-curriculum';
import { getPaper, setPaper } from '@/lib/study-plan';
import { BagrutBadge } from '@/components/practice/BagrutBadge';

// ===== SUBJECTS (mirror of /quiz subject map, trimmed to the fields we need here) =====
const SUBJECTS = {
  math5: {
    name: 'מתמטיקה 5 יח׳',
    emoji: '📐',
    topics: [
      { name: 'אלגברה', sub: 'משוואות, אי-שוויונים' },
      { name: 'פונקציות', sub: 'לינארית, ריבועית' },
      { name: 'פונקציה מעריכית', sub: '$e^x$, $a^x$, חקירה' },
      { name: 'גדילה ודעיכה', sub: 'מודל $N_0 e^{kt}$, חצי-חיים' },
      { name: 'פונקציית ln', sub: 'לוגריתם טבעי, חוקים, חקירה' },
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
      { name: 'פונקציה מעריכית', sub: '$e^x$, $a^x$, גדילה ודעיכה' },
      { name: 'פונקציית ln', sub: 'לוגריתם טבעי, חוקים, חקירה' },
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
  // פיזיקה, אנגלית, היסטוריה, תנ"ך וכימיה הוסרו — ראה ההערה ב-app/quiz/page.tsx.
} as const;

type SubjectKey = keyof typeof SUBJECTS;

function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/30 blur-[120px] animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/25 blur-[120px] animate-pulse"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />
    </div>
  );
}

function TopBar() {
  return (
    // md:hidden — AppHeader takes over from 768px up. Without this the page
    // draws a SECOND sticky bar, with a second MathUp logo and wordmark,
    // directly under the global one. On a phone there is no AppHeader, so this
    // bar is the only one and stays.
    <nav className="md:hidden sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <MathUpLogo size="md" />
          <div>
            <div className="text-base font-black font-display text-slate-800">
              MathUp
            </div>
            <div className="text-[10px] text-slate-600 -mt-0.5">תרגול מודרך</div>
          </div>
        </Link>
        <Link
          href="/quiz"
          className="group flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
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

  // The bagrut paper the student is focused on (581/582). null = never chosen
  // → show both papers. Read once after mount (localStorage).
  const [activePaper, setActivePaper] = useState<BagrutPaper | null>(null);
  useEffect(() => {
    setActivePaper(getPaper());
  }, []);

  function switchPaper() {
    if (!activePaper) return;
    const other: BagrutPaper = activePaper === '571' ? '572' : '571';
    setPaper(other);
    setActivePaper(other);
    setTopic(null);
  }

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
      className="min-h-screen text-slate-900 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <BackgroundOrbs />
      <TopBar />

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <PageHeader
          title="תרגול מודרך"
          description="סיכום לימודי בנושא + שאלת בגרות עם רמזים ופתרון. כמו מורה פרטי שיושב לידך."
        />

        {/* These three were full-width cards with icon tiles, subtitles and
            arrows — three identical-weight promos a student had to scroll past
            before reaching the topic picker, which is what they opened this
            page to use. They are links to OTHER modes, not the work of this
            screen, so they compress to one row and the picker moves up. */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { href: '/roadmap', label: 'מסלול הלמידה', hint: 'שלב אחר שלב' },
                    { href: '/thinking', label: 'סעיפי חשיבה', hint: 'Pro' },
          ].map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="surface-premium rounded-2xl px-3 py-2.5 text-center hover:border-violet-500/30 transition-colors"
            >
              <span className="block text-xs font-black text-slate-900 truncate">{m.label}</span>
              <span className="block text-[10px] text-slate-600 mt-0.5 truncate">{m.hint}</span>
            </Link>
          ))}
        </div>

        {/* Subject tabs */}
        <div className="mb-5">
          <div className="text-xs font-black tracking-widest text-violet-700 mb-2 uppercase">
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
                    ? 'flex-shrink-0 px-4 py-2 rounded-xl bg-violet-600 border border-violet-600 text-white font-bold text-sm transition-all'
                    : 'flex-shrink-0 px-4 py-2 rounded-xl bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 text-slate-700 font-bold text-sm transition-all'
                }
              >
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Topic grid — for math5 we group by bagrut paper (581/582) to
            match the official curriculum. Other subjects keep the flat
            layout. The order within each paper is pedagogical (foundations
            first), matching MATH5_CURRICULUM. */}
        {subject === 'math5' ? (
          <Math5TopicsByPaper
            selectedTopic={topic}
            onSelect={setTopic}
            viewedKeys={viewedKeys}
            activePaper={activePaper}
            onSwitchPaper={switchPaper}
          />
        ) : (
          <div className="mb-6">
            <div className="text-xs font-black tracking-widest text-violet-700 mb-2 uppercase">
              נושא
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 perspective-1500">
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
                        ? 'card-3d text-right px-4 py-3 rounded-2xl bg-gradient-to-l from-violet-600/30 to-violet-600/30 border border-violet-500/60'
                        : 'card-3d text-right px-4 py-3 rounded-2xl bg-slate-900/[0.03] hover:bg-slate-900/[0.04] border border-slate-900/10 hover:border-violet-500/40'
                    }
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-900">{t.name}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{t.sub}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {hasL && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-violet-500/20 border border-violet-500/40 text-violet-800">
                            <BookOpen className="w-2.5 h-2.5" />
                            סיכום
                          </span>
                        )}
                        {viewed && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-800">
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
        )}

        <button
          onClick={start}
          disabled={!topic || navigating}
          className="btn-3d group w-full inline-flex items-center justify-center gap-3 bg-gradient-to-l from-violet-600 to-violet-600 hover:from-violet-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-4 rounded-2xl font-bold text-white"
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

// ============================================================
// Math5TopicsByPaper — bagrut-aligned topic grid.
// ============================================================
//
// Renders 581 first, then 582, with section headers and per-topic
// BagrutBadge chips. Order within each paper follows MATH5_CURRICULUM
// (foundation first, applications last).

function Math5TopicsByPaper({
  selectedTopic,
  onSelect,
  viewedKeys,
  activePaper,
  onSwitchPaper,
}: {
  selectedTopic: string | null;
  onSelect: (topic: string) => void;
  viewedKeys: Set<string>;
  activePaper: BagrutPaper | null;
  onSwitchPaper: () => void;
}) {
  // If the student chose a paper, show ONLY that paper (shared topics folded
  // in via topicsForActivePaper). Otherwise show both papers grouped.
  const single = activePaper !== null;
  const papers: BagrutPaper[] = single ? [activePaper] : ['571', '572'];
  return (
    <div className="mb-6 space-y-5">
      {single && (
        <div className="flex items-center justify-between rounded-2xl bg-violet-500/[0.07] border border-violet-500/20 px-4 py-2.5">
          <div className="text-xs font-black text-violet-800">
            מציג את נושאי {paperLabel(activePaper)}
          </div>
          <button
            onClick={onSwitchPaper}
            className="text-[11px] font-bold text-violet-700 hover:text-violet-900 underline underline-offset-2"
          >
            החלף ל{paperLabel(activePaper === '571' ? '572' : '571')}
          </button>
        </div>
      )}
      {papers.map((paper) => (
        <div key={paper}>
          {!single && (
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-black tracking-widest text-violet-700 uppercase">
                {paperLabel(paper)}
              </div>
              <div className="text-[10px] text-slate-500">
                {paper === '571' ? 'אלגברה ואנליזה אלגברית' : 'אנליזה טרנסצנדנטית • הסתברות'}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 perspective-1500">
            {(single ? topicsForActivePaper(paper) : topicsByPaper(paper)).map((t) => {
              const k = `math5:${t.key}`;
              const viewed = viewedKeys.has(k);
              const hasL = hasLesson('math5', t.key);
              const isSelected = selectedTopic === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onSelect(t.key)}
                  className={
                    isSelected
                      ? 'card-3d text-right px-4 py-3 rounded-2xl bg-gradient-to-l from-violet-600/30 to-violet-600/30 border border-violet-500/60'
                      : 'card-3d text-right px-4 py-3 rounded-2xl bg-slate-900/[0.03] hover:bg-slate-900/[0.04] border border-slate-900/10 hover:border-violet-500/40'
                  }
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <span className="text-base flex-shrink-0">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-900">{t.displayName}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {t.examStyle}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {hasL && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-violet-500/20 border border-violet-500/40 text-violet-800">
                          <BookOpen className="w-2.5 h-2.5" />
                          סיכום
                        </span>
                      )}
                      {viewed && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-800">
                          <Check className="w-2.5 h-2.5" />
                          נלמד
                        </span>
                      )}
                    </div>
                  </div>
                  <BagrutBadge topic={t.key} variant="inline" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
