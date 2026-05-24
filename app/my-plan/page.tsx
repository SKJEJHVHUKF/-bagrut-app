'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  Crown,
  CheckCircle,
  Sparkles,
  Trash2,
  RefreshCw,
  GraduationCap,
  Camera,
  BookOpen,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getPlan, daysUntilBagrut, clearPlan, type StudyPlan } from '@/lib/study-plan';
import { topicLockReason, isProUser, isAdmin, type UserLike } from '@/lib/access';
import { BagrutBadge } from '@/components/practice/BagrutBadge';

export default function MyPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [user, setUser] = useState<UserLike>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load plan + user in parallel
    const p = getPlan();
    setPlan(p);

    if (!p) {
      setLoading(false);
      // No plan — bounce to onboarding
      router.replace('/onboarding');
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user as UserLike);
      setLoading(false);
    });
  }, [router]);

  if (loading || !plan) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const days = daysUntilBagrut(plan);
  const completedCount = plan.topics.filter((t) => t.completion >= 80).length;
  const overallProgress = Math.round(
    plan.topics.reduce((sum, t) => sum + t.completion, 0) / plan.topics.length
  );
  const pro = isProUser(user);
  const admin = isAdmin(user);

  function resetPlan() {
    if (!confirm('האם אתה בטוח שברצונך למחוק את התוכנית ולהתחיל מחדש?')) return;
    clearPlan();
    router.push('/onboarding');
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-50 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <BackgroundOrbs />
      <TopBar />

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hero — countdown */}
        <section className="bg-gradient-to-br from-amber-500/15 to-orange-500/15 backdrop-blur-md border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center">
          <div className="text-xs font-black tracking-widest text-amber-300 mb-2 uppercase">
            הבגרות שלך
          </div>
          <div className="text-5xl sm:text-6xl font-black text-amber-100 mb-1">{days}</div>
          <div className="text-sm text-amber-200/80">
            ימים עד {formatHebrewDate(plan.bagrutDate)}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <Stat label="הושלמו" value={`${completedCount}/${plan.topics.length}`} accent="emerald" />
            <Stat label="התקדמות" value={`${overallProgress}%`} accent="purple" />
            <Stat
              label="מצב"
              value={pro ? (admin ? '👑 אדמין' : '✨ Pro') : '🆓 חינם'}
              accent="amber"
            />
          </div>
        </section>

        {/* Topics list */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-black text-white">תוכנית הלימוד</h2>
            <span className="text-xs text-slate-400">{plan.topics.length} נושאים</span>
          </div>

          <div className="space-y-2">
            {plan.topics.map((t, i) => {
              const reason = topicLockReason(user, plan, i);
              return (
                <TopicCard
                  key={`${t.subject}:${t.topic}`}
                  index={i}
                  topic={t}
                  lockReason={reason}
                />
              );
            })}
          </div>
        </section>

        {/* Photo scanner — Pro feature, but card is shown to everyone (the
            page itself paywalls free users). Visually distinguished from
            "חומרים" because it's interactive, not reference material. */}
        <section>
          <h2 className="text-lg font-black text-white mb-3">
            צלם שאלה
            {pro ? null : <span className="text-xs font-normal text-amber-300 mr-2">Pro</span>}
          </h2>
          <Link
            href="/scan"
            className="card-3d block bg-gradient-to-br from-purple-600/15 to-pink-600/15 border border-purple-500/40 hover:border-purple-500/70 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm sm:text-base text-white">צלמי שאלה — קבלי פתרון מ-AI</div>
                <div className="text-xs text-slate-400 mt-0.5">פתרון צעד-אחר-צעד, נשמר בספרייה לפי נושא</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-purple-300 flex-shrink-0" />
            </div>
          </Link>
          <Link
            href="/library"
            className="card-3d block bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-2xl p-4 mt-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-purple-200" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm sm:text-base text-white">הספרייה שלי</div>
                <div className="text-xs text-slate-400 mt-0.5">השאלות ששמרת, מקובצות לפי נושא</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>
          </Link>
        </section>

        {/* Resources */}
        <section>
          <h2 className="text-lg font-black text-white mb-3">חומרים</h2>
          <Link
            href="/formulas"
            className="card-3d block bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm sm:text-base text-white">דף נוסחאות</div>
                <div className="text-xs text-slate-400 mt-0.5">כל הנוסחאות של מתמטיקה 5 — מסודרות לפי נושא</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-amber-300 flex-shrink-0" />
            </div>
          </Link>
        </section>

        {/* Footer actions */}
        <section className="pt-4 space-y-2">
          {!pro && (
            <div className="bg-gradient-to-br from-purple-600/15 to-pink-600/15 border border-purple-500/40 rounded-2xl p-5 text-center space-y-3">
              <Crown className="w-8 h-8 mx-auto text-amber-300" />
              <div>
                <div className="text-base font-black text-white mb-1">שדרג ל-Pro</div>
                <div className="text-sm text-slate-300">
                  פתח את **כל** הנושאים בתוכנית שלך, מאגר שאלות בלתי מוגבל, וסימולציות בגרות מלאות.
                </div>
              </div>
              <button className="btn-3d w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-3 rounded-xl font-bold text-white text-sm">
                <Crown className="w-4 h-4" />
                <span>שדרג עכשיו — בקרוב</span>
              </button>
            </div>
          )}

          <button
            onClick={resetPlan}
            className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 inline-flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3 h-3" />
            <span>התחל תוכנית חדשה</span>
          </button>
        </section>
      </main>
    </div>
  );
}

// ============================================================
// Topic card
// ============================================================

function TopicCard({
  index,
  topic,
  lockReason,
}: {
  index: number;
  topic: { subject: string; topic: string; completion: number; level: string };
  lockReason: 'open' | 'pro-required' | 'locked-progress';
}) {
  const accessible = lockReason === 'open';
  const href = accessible
    ? `/practice/${topic.subject}/${encodeURIComponent(topic.topic)}`
    : undefined;

  const card = (
    <div
      className={
        accessible
          ? 'card-3d bg-white/5 hover:bg-white/[0.07] border-white/10 hover:border-purple-500/40 rounded-2xl p-4 border transition-all block'
          : 'bg-white/[0.02] border-white/5 rounded-2xl p-4 border opacity-70'
      }
    >
      <div className="flex items-center gap-3">
        <div
          className={
            accessible
              ? 'w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-black text-white flex-shrink-0'
              : 'w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-slate-500 flex-shrink-0'
          }
        >
          {topic.completion >= 80 ? <CheckCircle className="w-5 h-5" /> : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm sm:text-base text-white">{topic.topic}</div>
          <div className="mt-0.5">
            <BagrutBadge topic={topic.topic} variant="inline" />
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
              <div
                className="h-full bg-gradient-to-l from-purple-500 to-pink-500 transition-all"
                style={{ width: `${topic.completion}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-bold">{topic.completion}%</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          {lockReason === 'pro-required' && (
            <div className="px-2 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-300" />
              <span className="text-[10px] font-black text-amber-200">PRO</span>
            </div>
          )}
          {lockReason === 'locked-progress' && (
            <Lock className="w-4 h-4 text-slate-500" />
          )}
          {accessible && (
            <ArrowLeft className="w-4 h-4 text-purple-300" />
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}

// ============================================================
// Helpers
// ============================================================

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'emerald' | 'purple' | 'amber';
}) {
  const colors = {
    emerald: 'text-emerald-300',
    purple: 'text-purple-300',
    amber: 'text-amber-300',
  };
  return (
    <div>
      <div className={`text-base sm:text-lg font-black ${colors[accent]}`}>{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function formatHebrewDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
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
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-xl shadow-purple-500/50 ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="text-base font-black bg-gradient-to-l from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
              בגרות בכיס
            </div>
            <div className="text-[10px] text-slate-400 -mt-0.5">התוכנית שלי</div>
          </div>
        </Link>
        <Link
          href="/practice"
          className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">תרגול חופשי</span>
        </Link>
      </div>
    </nav>
  );
}
