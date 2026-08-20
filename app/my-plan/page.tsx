'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import {
  ArrowLeft,
  Crown,
  CheckCircle,
  Sparkles,
  Trash2,
  Home,
  GraduationCap,
  Camera,
  BookOpen,
  Sigma,
} from 'lucide-react';
import MathUpLogo from '@/components/MathUpLogo';
import { createClient } from '@/lib/supabase/client';
import {
  getPlan,
  daysUntilBagrut,
  clearPlan,
  getPaper,
  setTarget,
  TARGET_LABEL,
  type StudyPlan,
  type TargetGrade,
} from '@/lib/study-plan';
import { buildDailyPlan, DEFAULT_MINUTES_PER_DAY, type DailyPlan } from '@/lib/daily-plan';
import { predictOverall, topImpactTopics } from '@/lib/prediction';
import { getWeaknesses } from '@/lib/remediation';
import { dueCount } from '@/lib/review';
import { getResumePoint } from '@/lib/roadmap-resume';
import { computePacing } from '@/lib/pacing';
import { DEFAULT_PAPER } from '@/constants/roadmapData';
import { getTrack } from '@/content/tracks';
import { trackLevelsBySub, trackMainTopics } from '@/lib/track';
import { isProUser, isAdmin, type UserLike } from '@/lib/access';
import { BagrutBadge } from '@/components/practice/BagrutBadge';
import { fadeUp, staggerContainer, inViewProps } from '@/lib/animations';

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
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
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
        {/* The page opened straight into the countdown with no title at all —
            a student landing here had no statement of what the screen is. */}
        <PageHeader
          title="התוכנית שלי"
          description="מה ללמוד היום, ולמה דווקא את זה — נגזר מהתאריך שקבעת ומההתקדמות שלך."
        />

        {/* The goal, and today's work toward it. This is the only part of the
            page that changes daily; everything below it is navigation — which
            is exactly why it is now FIRST. It used to sit under a full-bleed
            amber countdown panel with a 60px number and three stat tiles, so
            the one thing a student came here to act on was below the fold and
            the thing above it was a fact they could not do anything about. */}
        <TodaySection plan={plan} onTargetSet={() => setPlan(getPlan())} />

        {/* Countdown + totals, as one quiet strip. Same demotion as the
            progress panel on /roadmap: still here, no longer shouting. */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="surface-premium rounded-2xl p-4 flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          <motion.div variants={fadeUp} className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-800 leading-none">{days}</span>
            <span className="text-xs text-slate-600">
              ימים עד {formatHebrewDate(plan.bagrutDate)}
            </span>
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-center gap-4 text-xs text-slate-600 mr-auto">
            <span>
              <span className="font-black text-slate-900">
                {completedCount}/{plan.topics.length}
              </span>{' '}
              הושלמו
            </span>
            <span>
              <span className="font-black text-slate-900">{overallProgress}%</span> התקדמות
            </span>
            <span>{pro ? (admin ? 'אדמין' : 'Pro') : 'חינם'}</span>
          </motion.div>
        </motion.section>

        {/* Topics list */}
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.div variants={fadeUp} className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-lg font-black text-ink">תוכנית הלימוד</h2>
            <span className="text-xs text-slate-600">{plan.topics.length} נושאים</span>
          </motion.div>

          <motion.div variants={staggerContainer} className="space-y-2">
            {plan.topics.map((t, i) => (
              <motion.div
                key={`${t.subject}:${t.topic}`}
                variants={fadeUp}
                whileHover={{ x: -3 }}
                transition={{ duration: 0.2 }}
              >
                <TopicCard index={i} topic={t} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Photo scanner — Pro feature, but card is shown to everyone (the
            page itself paywalls free users). Visually distinguished from
            "חומרים" because it's interactive, not reference material. */}
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.h2 variants={fadeUp} className="font-display text-lg font-black text-ink mb-3">
            צלם שאלה
            {pro ? null : <span className="text-xs font-normal text-amber-700 mr-2">Pro</span>}
          </motion.h2>
          <motion.div variants={fadeUp} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
            <Link
              href="/scan"
              className="card-3d block bg-white/70 border border-violet-500/30 hover:border-violet-500/60 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/25 flex-shrink-0">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm sm:text-base text-ink">צלם שאלה — קבל פתרון מ-AI</div>
                  <div className="text-xs text-slate-600 mt-0.5">פתרון צעד-אחר-צעד, נשמר בספרייה לפי נושא</div>
                </div>
                <ArrowLeft className="w-4 h-4 text-violet-700 flex-shrink-0" />
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
                  <BookOpen className="w-5 h-5 text-violet-800" />
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25 flex-shrink-0">
                  <Sigma className="w-5 h-5 text-white" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm sm:text-base text-ink">דף נוסחאות</div>
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
              className="block surface-premium border border-violet-500/25 rounded-2xl p-5 text-center space-y-3"
            >
              <Crown className="w-8 h-8 mx-auto text-amber-700" />
              <div>
                <div className="text-base font-black text-ink mb-1">שדרג ל-Pro</div>
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

// Every topic is open — the plan's order is a recommendation, not a lock
// (owner, 2026-08-18: nothing in the learning path is locked).
function TopicCard({
  index,
  topic,
}: {
  index: number;
  topic: { subject: string; topic: string; completion: number; level: string };
}) {
  const href = `/practice/${topic.subject}/${encodeURIComponent(topic.topic)}`;

  const card = (
    <div className="card-3d bg-white/70 hover:bg-white border-slate-900/[0.06] hover:border-violet-500/40 rounded-2xl p-4 border transition-all block">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 tabular-nums ${
            topic.completion >= 80
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
              : 'bg-slate-900/[0.04] text-slate-500'
          }`}
        >
          {topic.completion >= 80 ? <CheckCircle className="w-5 h-5" /> : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm sm:text-base text-ink">{topic.topic}</div>
          <div className="mt-0.5">
            <BagrutBadge topic={topic.topic} variant="inline" />
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 h-1.5 bg-slate-900/5 rounded-full overflow-hidden max-w-[120px]">
              <div
                className="h-full bg-gradient-to-l from-cyan-700 to-violet-600 transition-all"
                style={{ width: `${topic.completion}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-600 font-bold">{topic.completion}%</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-violet-700" />
        </div>
      </div>
    </div>
  );

  return <Link href={href}>{card}</Link>;
}

// ============================================================
// Helpers
// ============================================================

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
        className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-400/[0.07] blur-[120px] animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-400/[0.06] blur-[120px] animate-pulse"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />
    </div>
  );
}

function TopBar() {
  return (
    <nav className="md:hidden sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <MathUpLogo size="md" />
          <div>
            <div className="text-base font-black font-display text-ink">MathUp</div>
            <div className="text-[10px] text-slate-600 -mt-0.5">התוכנית שלי</div>
          </div>
        </Link>
        <Link
          href="/"
          className="group flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          title="חזרה לדף הבית"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">דף הבית</span>
        </Link>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Today — the goal, and the work that closes the gap to it.
// ---------------------------------------------------------------------------

const TARGETS: TargetGrade[] = ['pass', '80', '90', 'boost'];

function TodaySection({ plan, onTargetSet }: { plan: StudyPlan; onTargetSet: () => void }) {
  const [daily, setDaily] = useState<DailyPlan | null>(null);

  // Everything here reads localStorage and static content, so it runs after
  // mount. Rebuilt whenever the target changes — that is the whole point of the
  // control below.
  useEffect(() => {
    const paper = getPaper() ?? DEFAULT_PAPER;
    // The study track (content/tracks) — the same tree /roadmap walks, so the
    // "next step" here and on the track page agree.
    const tree = getTrack(paper);
    const mainTopics = trackMainTopics(tree);
    const levelsBySub = trackLevelsBySub(tree);
    const resume = getResumePoint(mainTopics, levelsBySub);
    setDaily(
      buildDailyPlan({
        target: plan.targetGrade ?? null,
        minutesPerDay: plan.minutesPerDay ?? null,
        prediction: predictOverall('math5'),
        // ALL topics, not the top 5: the list is used for two different jobs.
        // Picking the best lever only needs the head, but looking up "how many
        // points is the topic I'm weak in worth" needs the whole table — with a
        // limit of 5 that lookup missed whenever the weakness ranked 6th or
        // lower, and the task silently fell back to generic wording.
        impact: topImpactTopics('math5', 100),
        weaknesses: getWeaknesses('math5'),
        dueCount: dueCount(),
        resume: resume ? { href: resume.href, title: resume.title } : null,
        pacing: computePacing(mainTopics, levelsBySub, plan),
      }),
    );
  }, [plan]);

  return (
    <motion.section {...inViewProps} variants={staggerContainer} className="space-y-3">
      <h2 className="font-display text-lg font-black text-ink">היעד שלי</h2>

      {/* The goal picker. Lives here rather than in onboarding so students who
          already have a plan get it in the same place new ones do — no
          migration prompt, no second flow to maintain. */}
      <div className="surface-premium rounded-3xl p-5 space-y-3">
        <div className="text-[11px] font-black tracking-widest text-violet-700 uppercase">
          מה המטרה שלך בבגרות?
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TARGETS.map((t) => {
            const active = plan.targetGrade === t;
            return (
              <button
                key={t}
                onClick={() => {
                  setTarget(t);
                  onTargetSet();
                }}
                className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                  active
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-slate-900/[0.03] border-slate-900/10 text-slate-700 hover:bg-slate-900/[0.06]'
                }`}
              >
                {TARGET_LABEL[t]}
              </button>
            );
          })}
        </div>

        {daily?.goal.headline && (
          <p className="text-sm text-slate-700 leading-relaxed pt-1">{daily.goal.headline}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-600">כמה זמן ביום?</span>
          {[15, 30, 60].map((m) => (
            <button
              key={m}
              onClick={() => {
                setTarget(plan.targetGrade ?? 'boost', m);
                onTargetSet();
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors ${
                (plan.minutesPerDay ?? DEFAULT_MINUTES_PER_DAY) === m
                  ? 'bg-ink border-ink text-white'
                  : 'bg-slate-900/[0.03] border-slate-900/10 text-slate-700 hover:bg-slate-900/[0.06]'
              }`}
            >
              {`${m} דק׳`}
            </button>
          ))}
        </div>
      </div>

      {/* Today's tasks, in priority order, each saying why it is on the list. */}
      {daily && daily.tasks.length > 0 && (
        <div className="surface-premium rounded-3xl p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] font-black tracking-widest text-violet-700 uppercase">
              המשימות של היום
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              {`כ-${daily.totalMinutes} דק׳`}
            </span>
          </div>

          {daily.tasks.map((task, i) => (
            <Link
              key={task.href}
              href={task.href}
              className="flex items-start gap-3 rounded-2xl border border-slate-900/10 bg-slate-900/[0.02] hover:bg-slate-900/[0.05] px-3.5 py-3 transition-colors"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-400/30 flex items-center justify-center text-[11px] font-black text-violet-800">
                {i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-black text-slate-900 leading-tight">
                  {task.title}
                </span>
                <span className="block text-[11px] text-slate-600 leading-snug mt-0.5">
                  {task.why}
                </span>
              </span>
              <ArrowLeft className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            </Link>
          ))}

          {daily.deferred > 0 && (
            <p className="text-[11px] text-slate-500">
              {daily.deferred === 1
                ? 'עוד משימה אחת מחכה — היא תיכנס כשיתפנה זמן.'
                : `עוד ${daily.deferred} משימות מחכות — הן ייכנסו כשיתפנה זמן.`}
            </p>
          )}
        </div>
      )}
    </motion.section>
  );
}
