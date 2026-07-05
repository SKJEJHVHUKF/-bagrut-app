'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  Crown,
  CheckCircle,
  Sparkles,
  Trash2,
  Home,
  GraduationCap,
  Camera,
  BookOpen,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getPlan, daysUntilBagrut, clearPlan, type StudyPlan } from '@/lib/study-plan';
import { topicLockReason, isProUser, isAdmin, type UserLike } from '@/lib/access';
import { BagrutBadge } from '@/components/practice/BagrutBadge';
import { fadeUp, staggerContainer, scaleIn, inViewProps } from '@/lib/animations';

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
      <div className="min-h-screen text-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
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
      className="min-h-screen text-slate-900 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <BackgroundOrbs />
      <TopBar />

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hero — countdown */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="bg-gradient-to-br from-amber-500/15 to-orange-500/15 backdrop-blur-md border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center"
        >
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-amber-700 mb-2 uppercase"
          >
            הבגרות שלך
          </motion.div>
          <motion.div
            variants={scaleIn}
            className="text-5xl sm:text-6xl font-black text-amber-800 mb-1"
          >
            {days}
          </motion.div>
          <motion.div variants={fadeUp} className="text-sm text-amber-800">
            ימים עד {formatHebrewDate(plan.bagrutDate)}
          </motion.div>

          <motion.div variants={staggerContainer} className="mt-6 grid grid-cols-3 gap-3 text-center">
            <motion.div variants={scaleIn}>
              <Stat label="הושלמו" value={`${completedCount}/${plan.topics.length}`} accent="emerald" />
            </motion.div>
            <motion.div variants={scaleIn}>
              <Stat label="התקדמות" value={`${overallProgress}%`} accent="purple" />
            </motion.div>
            <motion.div variants={scaleIn}>
              <Stat
                label="מצב"
                value={pro ? (admin ? '👑 אדמין' : '✨ Pro') : '🆓 חינם'}
                accent="amber"
              />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Topics list */}
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.div variants={fadeUp} className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-lg font-black text-slate-900">תוכנית הלימוד</h2>
            <span className="text-xs text-slate-600">{plan.topics.length} נושאים</span>
          </motion.div>

          <motion.div variants={staggerContainer} className="space-y-2">
            {plan.topics.map((t, i) => {
              const reason = topicLockReason(user, plan, i);
              return (
                <motion.div
                  key={`${t.subject}:${t.topic}`}
                  variants={fadeUp}
                  whileHover={{ x: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <TopicCard index={i} topic={t} lockReason={reason} />
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Photo scanner — Pro feature, but card is shown to everyone (the
            page itself paywalls free users). Visually distinguished from
            "חומרים" because it's interactive, not reference material. */}
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.h2 variants={fadeUp} className="text-lg font-black text-slate-900 mb-3">
            צלם שאלה
            {pro ? null : <span className="text-xs font-normal text-amber-700 mr-2">Pro</span>}
          </motion.h2>
          <motion.div variants={fadeUp} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
            <Link
              href="/scan"
              className="card-3d block bg-gradient-to-br from-indigo-600/15 to-indigo-600/15 border border-indigo-500/40 hover:border-indigo-500/70 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm sm:text-base text-slate-900">צלמי שאלה — קבלי פתרון מ-AI</div>
                  <div className="text-xs text-slate-600 mt-0.5">פתרון צעד-אחר-צעד, נשמר בספרייה לפי נושא</div>
                </div>
                <ArrowLeft className="w-4 h-4 text-indigo-700 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="mt-2">
            <Link
              href="/library"
              className="card-3d block bg-slate-900/[0.03] hover:bg-slate-900/[0.05] border border-slate-900/10 hover:border-slate-900/15 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-indigo-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm sm:text-base text-slate-900">הספרייה שלי</div>
                  <div className="text-xs text-slate-600 mt-0.5">השאלות ששמרת, מקובצות לפי נושא</div>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="mt-2">
            <Link
              href="/bagruyot"
              className="card-3d block bg-gradient-to-br from-emerald-600/15 to-teal-600/15 border border-emerald-500/40 hover:border-emerald-500/70 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm sm:text-base text-slate-900">
                    מאגר בגרויות {!pro && <span className="text-xs font-normal text-amber-700 mr-2">Pro</span>}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">שאלות מבגרויות עבר + פתרונות מלאים, ללא AI</div>
                </div>
                <ArrowLeft className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        </motion.section>

        {/* Resources */}
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.h2 variants={fadeUp} className="text-lg font-black text-slate-900 mb-3">חומרים</motion.h2>
          <motion.div variants={fadeUp} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
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
                  <div className="font-bold text-sm sm:text-base text-slate-900">דף נוסחאות</div>
                  <div className="text-xs text-slate-600 mt-0.5">כל הנוסחאות של מתמטיקה 5 — מסודרות לפי נושא</div>
                </div>
                <ArrowLeft className="w-4 h-4 text-amber-700 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        </motion.section>

        {/* Footer actions */}
        <section className="pt-4 space-y-2">
          {!pro && (
            <Link
              href="/pricing"
              className="block bg-gradient-to-br from-indigo-600/15 to-indigo-600/15 border border-indigo-500/40 rounded-2xl p-5 text-center space-y-3"
            >
              <Crown className="w-8 h-8 mx-auto text-amber-700" />
              <div>
                <div className="text-base font-black text-slate-900 mb-1">שדרג ל-Pro</div>
                <div className="text-sm text-slate-700">
                  הקורס המתקדם ברמת בגרות, מאגר הבגרויות המלא, סימולציות ועזרת-AI ללא הגבלה. הלימוד עצמו תמיד חינם.
                </div>
              </div>
              <span className="btn-3d w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-3 rounded-xl font-bold text-white text-sm">
                <Crown className="w-4 h-4" />
                <span>לפרטים ולמסלולים</span>
              </span>
            </Link>
          )}

          <button
            onClick={resetPlan}
            className="w-full text-xs text-slate-500 hover:text-slate-700 transition-colors py-2 inline-flex items-center justify-center gap-2"
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
  lockReason: 'open' | 'locked-progress';
}) {
  const accessible = lockReason === 'open';
  const href = accessible
    ? `/practice/${topic.subject}/${encodeURIComponent(topic.topic)}`
    : undefined;

  const card = (
    <div
      className={
        accessible
          ? 'card-3d bg-slate-900/[0.03] hover:bg-slate-900/[0.04] border-slate-900/10 hover:border-indigo-500/40 rounded-2xl p-4 border transition-all block'
          : 'bg-slate-900/[0.02] border-slate-900/[0.06] rounded-2xl p-4 border opacity-70'
      }
    >
      <div className="flex items-center gap-3">
        <div
          className={
            accessible
              ? 'w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-500 flex items-center justify-center font-black text-white flex-shrink-0'
              : 'w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center font-black text-slate-500 flex-shrink-0'
          }
        >
          {topic.completion >= 80 ? <CheckCircle className="w-5 h-5" /> : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm sm:text-base text-slate-900">{topic.topic}</div>
          <div className="mt-0.5">
            <BagrutBadge topic={topic.topic} variant="inline" />
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 h-1.5 bg-slate-900/5 rounded-full overflow-hidden max-w-[120px]">
              <div
                className="h-full bg-gradient-to-l from-indigo-500 to-indigo-500 transition-all"
                style={{ width: `${topic.completion}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-600 font-bold">{topic.completion}%</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          {lockReason === 'locked-progress' && (
            <div className="flex items-center gap-1 text-slate-500" title="יפתח כשתסיים את הנושאים הקודמים">
              <Lock className="w-4 h-4" />
            </div>
          )}
          {accessible && (
            <ArrowLeft className="w-4 h-4 text-indigo-700" />
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
    emerald: 'text-emerald-700',
    purple: 'text-indigo-700',
    amber: 'text-amber-700',
  };
  return (
    <div>
      <div className={`text-base sm:text-lg font-black ${colors[accent]}`}>{value}</div>
      <div className="text-[10px] text-slate-600 tracking-wide mt-0.5">{label}</div>
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
          <div>
            <div className="text-base font-black font-display text-slate-800">
              בגרות בכיס
            </div>
            <div className="text-[10px] text-slate-600 -mt-0.5">התוכנית שלי</div>
          </div>
        </Link>
        <Link
          href="/"
          className="group flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-indigo-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          title="חזרה לדף הבית"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">דף הבית</span>
        </Link>
      </div>
    </nav>
  );
}
