'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { allLessonKeys } from '@/content/lessons';
import { createPlan, type ProficiencyLevel } from '@/lib/study-plan';
import { curriculumIndex } from '@/content/bagrut-curriculum';
import { BagrutBadge } from '@/components/practice/BagrutBadge';

// All math5 topics, sorted into the canonical bagrut curriculum order
// (שאלון 581 first, then 582 — see content/bagrut-curriculum.ts).
// This way the onboarding picker matches the order the student will
// encounter in their actual exam preparation.
const ALL_TOPICS = allLessonKeys()
  .filter((k) => k.subject === 'math5')
  .sort((a, b) => curriculumIndex(a.topic) - curriculumIndex(b.topic));

const LEVEL_LABELS: Record<ProficiencyLevel, string> = {
  weak: '🟢 חלש',
  mid: '🟡 בינוני',
  strong: '🔴 חזק',
};

type SelectedTopic = {
  subject: string;
  topic: string;
  level: ProficiencyLevel;
};

export default function OnboardingPage() {
  const router = useRouter();

  // 4-step flow: welcome → date → topics → summary
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [bagrutDate, setBagrutDate] = useState<string>(() => {
    // Default to ~30 June of the current school year
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    return `${year}-06-15`;
  });

  const [selected, setSelected] = useState<SelectedTopic[]>([]);

  function toggleTopic(subject: string, topic: string) {
    setSelected((prev) => {
      const exists = prev.find((t) => t.subject === subject && t.topic === topic);
      if (exists) {
        return prev.filter((t) => !(t.subject === subject && t.topic === topic));
      }
      return [...prev, { subject, topic, level: 'mid' }];
    });
  }

  function setLevel(subject: string, topic: string, level: ProficiencyLevel) {
    setSelected((prev) =>
      prev.map((t) => (t.subject === subject && t.topic === topic ? { ...t, level } : t))
    );
  }

  function moveTopic(idx: number, dir: -1 | 1) {
    setSelected((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function finish() {
    if (selected.length === 0) return;
    createPlan({
      bagrutDate,
      topics: selected.map(({ subject, topic, level }) => ({ subject, topic, level })),
    });
    router.push('/my-plan');
  }

  return (
    <div
      className="min-h-screen text-slate-50 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <BackgroundOrbs />
      <TopBar />

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={
                n === step
                  ? 'w-8 h-2 rounded-full bg-gradient-to-l from-indigo-500 to-indigo-500'
                  : n < step
                  ? 'w-2 h-2 rounded-full bg-indigo-500/60'
                  : 'w-2 h-2 rounded-full bg-slate-900/5'
              }
            />
          ))}
        </div>

        {step === 1 && (
          <WelcomeStep onNext={() => setStep(2)} />
        )}

        {step === 2 && (
          <DateStep
            value={bagrutDate}
            onChange={setBagrutDate}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <TopicsStep
            selected={selected}
            toggleTopic={toggleTopic}
            setLevel={setLevel}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <SummaryStep
            bagrutDate={bagrutDate}
            selected={selected}
            moveTopic={moveTopic}
            onBack={() => setStep(3)}
            onFinish={finish}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================
// Step 1: Welcome
// ============================================================

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
        <GraduationCap className="w-10 h-10 text-white" />
      </div>
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-black mb-3">
          <span className="font-display text-slate-800">
            ברוך הבא! בוא נכין לך תוכנית
          </span>
        </h1>
        <p className="text-slate-700 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
          תוכנית אישית לבגרות במתמטיקה — לפי תאריך הבחינה שלך, הנושאים שאתה רוצה לחזק, וזמן הלימוד שיש לך.
        </p>
      </div>

      <div className="surface-premium rounded-2xl p-5 text-right space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-indigo-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-800">
            <strong>סדר לימוד מסודר</strong> — נושא אחר נושא, מהקל לקשה.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-indigo-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-800">
            <strong>שלוש שלבים לכל נושא</strong> — קריאה → מבחן הבנה → תרגול בגרות.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-indigo-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-800">
            <strong>ספירה לאחור</strong> עד הבגרות — תמיד תדע איפה אתה.
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="btn-3d w-full inline-flex items-center justify-center gap-3 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-6 py-4 rounded-2xl font-bold text-white"
      >
        <Sparkles className="w-5 h-5" />
        <span>בוא נתחיל</span>
      </button>
    </div>
  );
}

// ============================================================
// Step 2: Bagrut date
// ============================================================

function DateStep({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const daysAway = Math.ceil(
    (new Date(value).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/40">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-black">
          <span className="font-display text-slate-800">
            מתי הבגרות שלך?
          </span>
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          נשתמש בתאריך הזה כדי לחלק לך את התוכנית בזמן.
        </p>
      </div>

      <div className="surface-premium rounded-2xl p-5 space-y-3">
        <label className="block text-xs font-black tracking-widest text-indigo-700 uppercase">
          תאריך הבגרות
        </label>
        <input
          type="date"
          value={value}
          min={today}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#FDFDFB]/80 border border-slate-900/10 focus:border-indigo-500/60 rounded-xl px-4 py-3 text-base text-slate-900 outline-none transition-colors"
        />
        {daysAway > 0 && (
          <div className="text-sm text-slate-700">
            ⏱️ <strong className="text-amber-700">{daysAway} ימים</strong> עד הבגרות שלך.
          </div>
        )}
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={daysAway <= 0} />
    </div>
  );
}

// ============================================================
// Step 3: Topics + level
// ============================================================

function TopicsStep({
  selected,
  toggleTopic,
  setLevel,
  onBack,
  onNext,
}: {
  selected: SelectedTopic[];
  toggleTopic: (subject: string, topic: string) => void;
  setLevel: (subject: string, topic: string, level: ProficiencyLevel) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl font-black">
          <span className="font-display text-slate-800">
            על אילו נושאים תרצה לעבוד?
          </span>
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          בחר נושאים, וסמן לכל אחד מה הרמה שלך עכשיו.
        </p>
      </div>

      <div className="space-y-2">
        {ALL_TOPICS.map(({ subject, topic }) => {
          const sel = selected.find((t) => t.subject === subject && t.topic === topic);
          const isSelected = !!sel;
          return (
            <div
              key={`${subject}:${topic}`}
              className={
                isSelected
                  ? 'bg-indigo-500/10 border-indigo-500/40 rounded-2xl p-3 border transition-all'
                  : 'bg-slate-900/[0.02] border-slate-900/10 rounded-2xl p-3 border transition-all'
              }
            >
              <button
                onClick={() => toggleTopic(subject, topic)}
                className="w-full flex items-center gap-3 text-right"
              >
                <div
                  className={
                    isSelected
                      ? 'w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-500 flex items-center justify-center flex-shrink-0'
                      : 'w-5 h-5 rounded-md border-2 border-slate-900/20 flex-shrink-0'
                  }
                >
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <div className="font-bold text-sm sm:text-base text-slate-900">{topic}</div>
                  <div className="mt-1">
                    <BagrutBadge topic={topic} variant="inline" />
                  </div>
                </div>
              </button>

              {isSelected && (
                <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-900/[0.06]">
                  <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                    הרמה שלי
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 flex-1">
                    {(['weak', 'mid', 'strong'] as ProficiencyLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setLevel(subject, topic, lvl)}
                        className={
                          sel.level === lvl
                            ? 'px-2 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 border border-indigo-600 text-white'
                            : 'px-2 py-1.5 rounded-lg text-xs font-bold bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 text-slate-700'
                        }
                      >
                        {LEVEL_LABELS[lvl]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={selected.length === 0}
        nextLabel={selected.length === 0 ? 'בחר לפחות נושא אחד' : 'המשך'}
      />
    </div>
  );
}

// ============================================================
// Step 4: Summary + reorder
// ============================================================

function SummaryStep({
  bagrutDate,
  selected,
  moveTopic,
  onBack,
  onFinish,
}: {
  bagrutDate: string;
  selected: SelectedTopic[];
  moveTopic: (idx: number, dir: -1 | 1) => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  const daysAway = Math.ceil(
    (new Date(bagrutDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl font-black">
          <span className="font-display text-slate-800">
            התוכנית שלך
          </span>
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          תוכל לסדר את הנושאים בסדר שמתאים לך. הנושא הראשון יהיה הפתוח להתחלה.
        </p>
      </div>

      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 text-center">
        <div className="text-xs font-black tracking-widest text-amber-700 mb-1 uppercase">
          ספירה לאחור
        </div>
        <div className="text-3xl sm:text-4xl font-black text-amber-800">{daysAway} ימים</div>
        <div className="text-xs text-amber-200/70 mt-1">עד הבגרות ב-{bagrutDate}</div>
      </div>

      <div className="space-y-2">
        {selected.map((t, i) => (
          <div
            key={`${t.subject}:${t.topic}`}
            className="surface-premium rounded-2xl p-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-500 flex items-center justify-center font-black text-white flex-shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-slate-900">{t.topic}</div>
              <div className="text-xs text-slate-600">{LEVEL_LABELS[t.level]}</div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveTopic(i, -1)}
                disabled={i === 0}
                className="p-1 rounded-md bg-slate-900/[0.03] hover:bg-slate-900/5 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700"
                aria-label="העלה למעלה"
              >
                <ChevronRight className="w-3 h-3 rotate-90" />
              </button>
              <button
                onClick={() => moveTopic(i, 1)}
                disabled={i === selected.length - 1}
                className="p-1 rounded-md bg-slate-900/[0.03] hover:bg-slate-900/5 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700"
                aria-label="הורד למטה"
              >
                <ChevronLeft className="w-3 h-3 rotate-90" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-2xl bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 font-bold text-slate-900 text-sm transition-all"
        >
          חזור
        </button>
        <button
          onClick={onFinish}
          className="btn-3d flex-1 inline-flex items-center justify-center gap-3 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-6 py-3 rounded-2xl font-bold text-white"
        >
          <Sparkles className="w-5 h-5" />
          <span>צור את התוכנית</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function NavButtons({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = 'המשך',
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onBack}
        className="px-5 py-3 rounded-2xl bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 font-bold text-slate-900 text-sm transition-all"
      >
        חזור
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="btn-3d flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-2xl font-bold text-white text-sm"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
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

function TopBar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-[#FDFDFB]/80 border-b border-slate-900/10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-500 to-amber-400 flex items-center justify-center shadow-xl shadow-indigo-500/50 ring-1 ring-slate-900/10">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
            </svg>
          </div>
          <div className="text-base font-black font-display text-slate-800">
            בגרות בכיס
          </div>
        </Link>
      </div>
    </nav>
  );
}
