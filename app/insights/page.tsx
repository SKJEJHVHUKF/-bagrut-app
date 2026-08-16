'use client';

// "התמונה שלי" — the personal strengths/weaknesses dashboard.
//
// Aggregates every answered question (quick quiz + sub-topic drills, recorded
// via lib/results.ts) into per-topic and per-sub-topic accuracy, surfaces the
// weakest spots, and offers one-click reinforcement practice that jumps
// straight into the weakest sub-topic's existing practice module.
//
// All data is client-side (localStorage) — the page renders after mount to
// avoid a hydration mismatch.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Flame,
  ArrowRight,
  BarChart3,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { getSubTopic } from '@/content/lessons';
import { createClient } from '@/lib/supabase/client';
import { isProUser } from '@/lib/access';
import {
  totalStats,
  topicStats,
  weakestSubTopics,
  subjectsWithResults,
  currentStreak,
  todayCount,
  lastNDays,
  getDailyGoal,
  setDailyGoal,
  weeklyDelta,
  MIN_PER_WEEK_WINDOW,
  type TopicStat,
  type SubTopicStat,
  type DayActivity,
  type WeeklyDelta,
} from '@/lib/results';
import { topCategory, type CategoryStat } from '@/lib/mistakes';
import {
  predictOverall,
  topImpactTopics,
  type OverallPrediction,
  type TopicImpact,
} from '@/lib/prediction';
import { getTopWeakness, healedCountSince, type Weakness } from '@/lib/remediation';
import ShareCardButton from '@/components/ShareCardButton';

const SUBJECT_NAMES: Record<string, string> = {
  math5: 'מתמטיקה 5 יח׳',
  math4: 'מתמטיקה 4 יח׳',
  // חמשת המקצועות האחרים הוסרו מהמוצר. הרשומות נשארות כאן בלבד כדי שתלמיד
  // עם תוצאות ישנות יראה שם מקצוע ולא מפתח גולמי — הן לא יוצרות מסלול חדש.
  physics: 'פיזיקה',
  english: 'אנגלית',
  history: 'היסטוריה',
  bible: 'תנ"ך',
  chem: 'כימיה',
};

type SubjectData = {
  subject: string;
  totals: { attempts: number; correct: number; accuracy: number };
  topics: TopicStat[];
  weakSubs: SubTopicStat[];
};

function subTopicTitle(subject: string, topic: string, subId: string): string {
  return getSubTopic(subject, topic, subId)?.title ?? subId;
}

function pctColor(p: number): string {
  if (p >= 0.7) return 'text-emerald-700';
  if (p >= 0.4) return 'text-amber-700';
  return 'text-rose-700';
}

function barColor(p: number): string {
  if (p >= 0.7) return 'bg-gradient-to-l from-emerald-500 to-teal-500';
  if (p >= 0.4) return 'bg-gradient-to-l from-amber-500 to-orange-500';
  return 'bg-gradient-to-l from-rose-500 to-red-500';
}

type Habit = {
  streak: number;
  today: number;
  goal: number;
  days: DayActivity[];
};

export default function InsightsPage() {
  const [data, setData] = useState<SubjectData[] | null>(null);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [prediction, setPrediction] = useState<OverallPrediction | null>(null);
  const [impact, setImpact] = useState<TopicImpact[]>([]);
  const [pro, setPro] = useState(true); // assume pro until known → no upsell flash
  /** subject → the top repairable weakness (absent when evidence is thin). */
  const [fixTargets, setFixTargets] = useState<Record<string, Weakness>>({});
  const [week, setWeek] = useState<WeeklyDelta | null>(null);
  const [healedThisWeek, setHealedThisWeek] = useState(0);
  const [topMistake, setTopMistake] = useState<CategoryStat | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setPro(isProUser(data.user)));
  }, []);

  function refreshHabit() {
    setHabit({
      streak: currentStreak(),
      today: todayCount(),
      goal: getDailyGoal(),
      days: lastNDays(14),
    });
    setWeek(weeklyDelta());
    setHealedThisWeek(healedCountSince(Date.now() - 7 * 24 * 60 * 60 * 1000));
    setTopMistake(topCategory());
  }

  useEffect(() => {
    const subjects = subjectsWithResults();
    // math5 is the flagship — always first when present.
    subjects.sort((a, b) => (a === 'math5' ? -1 : b === 'math5' ? 1 : 0));
    setData(
      subjects.map((subject) => ({
        subject,
        totals: totalStats(subject),
        topics: topicStats(subject),
        weakSubs: weakestSubTopics(subject, { minAttempts: 3, limit: 4 }),
      }))
    );
    const targets: Record<string, Weakness> = {};
    for (const subject of subjects) {
      const w = getTopWeakness(subject);
      if (w) targets[subject] = w;
    }
    setFixTargets(targets);
    refreshHabit();
    setPrediction(predictOverall('math5'));
    setImpact(topImpactTopics('math5', 3));
  }, []);

  function bumpGoal(delta: number) {
    setDailyGoal(getDailyGoal() + delta);
    refreshHabit();
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-800 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-800 transition-colors">
            → חזרה הביתה
          </Link>
          <Link href="/quiz" className="text-sm text-violet-700 hover:text-violet-800 transition-colors">
            מבחן מהיר ⚡
          </Link>
        </div>

        <div className="space-y-2 pt-2">
          <PageHeader
            title="התמונה שלי"
            description="כל שאלה שאתה עונה — במבחן המהיר ובתרגול המודרך — נצברת לתמונה אחת: איפה אתה חזק, ומה שווה לחזק לפני הבגרות."
          />
          <Link
            href="/errors"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900 transition-colors"
          >
            📓 מחברת הטעויות שלי ←
          </Link>
        </div>

        {/* Loading (first client render) */}
        {data === null && (
          <div className="text-center text-slate-500 py-16 text-sm">טוען…</div>
        )}

        {/* Empty state */}
        {data !== null && data.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-premium rounded-3xl p-8 text-center space-y-4"
          >
            <Sparkles className="w-10 h-10 mx-auto text-violet-700" />
            <h2 className="text-xl font-black text-slate-900">עדיין אין נתונים</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              ענה על כמה שאלות — מבחן מהיר אחד מספיק — והעמוד הזה יתחיל להראות
              לך בדיוק איפה אתה עומד בכל נושא.
            </p>
            <Link
              href="/quiz"
              className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-white"
            >
              <span>🎯 התחל מבחן מעורב</span>
            </Link>
          </motion.div>
        )}

        {/* Grade prediction hero — the flagship number */}
        {prediction && data !== null && data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-premium rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-black tracking-widest text-violet-700 uppercase flex items-center gap-2">
                <Target className="w-3.5 h-3.5" />
                <span>אם תיגש היום — הציון החזוי שלך</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-900/[0.04] border border-slate-900/10 rounded-full px-2 py-0.5">
                הערכה — לא הבטחה
              </span>
            </div>

            <div className="flex items-end justify-center gap-3">
              <div className="text-6xl font-black gradient-text leading-none">{prediction.score}</div>
              <div className="text-xs text-slate-500 font-bold pb-1.5">
                טווח {prediction.low}–{prediction.high}
              </div>
            </div>
            <div className="text-center text-[11px] text-slate-500">
              מבוסס על {prediction.totalAttempts} תשובות
              {prediction.totalAttempts < 30 && ' — ענה על עוד שאלות כדי לדייק את ההערכה'}
            </div>

            {/* Per-paper mini rows */}
            <div className="grid grid-cols-2 gap-2">
              {prediction.papers.map((p) => (
                <div key={p.paper} className="bg-slate-900/[0.03] border border-slate-900/[0.08] rounded-xl px-3 py-2 text-center">
                  <div className="text-[10px] font-bold text-slate-500">שאלון {p.paper}</div>
                  <div className={`text-lg font-black ${pctColor(p.score / 100)}`}>{p.score}</div>
                </div>
              ))}
            </div>

            {/* Where improvement pays the most */}
            {impact.length > 0 && (
              <div className="pt-1">
                <div className="text-[11px] font-black text-slate-600 mb-2">
                  💡 הכי משתלם לשפר עכשיו:
                </div>
                <div className="flex flex-wrap gap-2">
                  {impact.map((t) => (
                    <Link
                      key={t.topic}
                      href={`/practice/math5/${encodeURIComponent(t.topic)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/25 text-violet-800 rounded-full px-3 py-1.5 transition-colors"
                    >
                      <span>{t.emoji}</span>
                      <span>{t.topic}</span>
                      <span className="text-[10px] text-violet-600">+{t.gainPer10} נק׳ לכל 10% שיפור</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Upsell — the killer spot: they're staring at their grade. */}
            {!pro && (
              <Link
                href="/pricing"
                className="mt-1 flex items-center gap-3 bg-gradient-to-l from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 group"
              >
                <span className="text-xl flex-shrink-0">👑</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-black text-slate-900">רוצה להעלות את הציון?</span>
                  <span className="block text-[11px] text-slate-600">
                    הקורס המתקדם, מאגר הבגרויות והסימולציות — ב-Pro
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-amber-600 rotate-180 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            )}
          </motion.div>
        )}

        {/* ===== The action, directly under the number =====
            The sharpest thing this page offers — a named repair — used to sit
            around line 460, below the habit strip and INSIDE the per-subject
            loop. A student read their predicted grade, then scrolled past a
            streak counter, a daily-goal control and a fourteen-day activity
            grid before being told what to actually do about it.
            Same rule as /roadmap: the answer goes next to the number. */}
        {fixTargets['math5'] && data !== null && data.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              href={`/fix/${encodeURIComponent(fixTargets['math5'].id)}`}
              className="group flex items-center gap-4 bg-gradient-to-l from-cyan-700 to-violet-600 hover:from-cyan-700 hover:to-violet-500 rounded-3xl p-5 shadow-lg shadow-violet-500/25 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                <Wrench aria-hidden="true" className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-white">
                <div className="text-[10px] font-black tracking-widest uppercase text-white/70">
                  הכי משתלם לתקן עכשיו
                </div>
                <div className="text-sm font-black leading-tight mt-0.5 truncate">
                  {fixTargets['math5'].title}
                </div>
                <div className="text-[11px] text-white/80 mt-0.5 truncate">
                  {fixTargets['math5'].detail}
                </div>
              </div>
              <ArrowRight
                aria-hidden="true"
                className="w-5 h-5 text-white rotate-180 group-hover:-translate-x-1 transition-transform flex-shrink-0"
              />
            </Link>
          </motion.div>
        )}

        {/* Habit strip — streak, daily goal, last-14-days activity */}
        {habit && data !== null && data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2"
          >
            {/* Streak — this is exactly what the gold accent is reserved for */}
            <div className="surface-premium rounded-2xl p-4 flex items-center gap-3">
              <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center">
                <Flame className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-black text-slate-900 leading-none">
                  {habit.streak}
                  <span className="text-xs font-bold text-slate-500 mr-1">ימים</span>
                </div>
                <div className="text-[11px] text-slate-600 font-bold mt-1">
                  {habit.streak >= 2 ? 'רצף למידה — שמור עליו! 🔥' : 'רצף למידה — יום ביום'}
                </div>
                {habit.streak >= 3 && (
                  <div className="mt-2">
                    <ShareCardButton
                      card={{
                        headline: 'רצף למידה בוער',
                        bigStat: String(habit.streak),
                        statLabel: 'ימים ברצף של תרגול',
                      }}
                      label="שתף את הרצף"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Daily goal ring */}
            <div className="surface-premium rounded-2xl p-4 flex items-center gap-3">
              <div className="relative flex-shrink-0 w-12 h-12">
                <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="5" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(1, habit.today / habit.goal) * 125.7} 125.7`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-violet-800">
                  {Math.min(100, Math.round((habit.today / habit.goal) * 100))}%
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-black text-slate-900">
                  {habit.today}/{habit.goal} היום
                </div>
                <div className="text-[11px] text-slate-600 font-bold mt-0.5 flex items-center gap-1.5">
                  <span>יעד יומי</span>
                  <button onClick={() => bumpGoal(-5)} className="w-4 h-4 rounded bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 text-[10px] font-black leading-none">−</button>
                  <button onClick={() => bumpGoal(5)} className="w-4 h-4 rounded bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 text-[10px] font-black leading-none">+</button>
                </div>
              </div>
            </div>

            {/* 14-day mini-chart */}
            <div className="surface-premium rounded-2xl p-4">
              <div className="text-[11px] text-slate-600 font-bold mb-2">14 הימים האחרונים</div>
              <div className="flex items-end gap-1 h-9" dir="ltr">
                {(() => {
                  const max = Math.max(1, ...habit.days.map((d) => d.attempts));
                  return habit.days.map((d) => (
                    <div
                      key={d.date}
                      title={`${d.date}: ${d.attempts} שאלות`}
                      className={`flex-1 rounded-sm ${d.attempts > 0 ? 'bg-violet-500/70' : 'bg-slate-900/[0.06]'}`}
                      style={{ height: `${Math.max(8, (d.attempts / max) * 100)}%` }}
                    />
                  ));
                })()}
              </div>
            </div>

            {/* This week — the one thing this page could not answer before:
                "am I actually getting better?". Accuracy alone can't say it;
                a week-on-week comparison can, but only with enough volume in
                BOTH windows, so the honest empty state is a first-class case
                here rather than a fallback. */}
            <div className="surface-premium rounded-2xl p-4 space-y-2.5">
              <div className="text-[11px] text-slate-600 font-bold">השבוע שלך</div>

              {week?.enough ? (
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-black leading-none ${
                      week.deltaPoints > 0
                        ? 'text-emerald-700'
                        : week.deltaPoints < 0
                          ? 'text-rose-700'
                          : 'text-slate-700'
                    }`}
                  >
                    {week.deltaPoints > 0 ? '+' : ''}
                    {week.deltaPoints}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {`נקודות דיוק מול שבוע שעבר (${Math.round(week.lastWeek.accuracy * 100)}% → ${Math.round(week.thisWeek.accuracy * 100)}%)`}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-600 leading-relaxed">
                  {`עוד אין מספיק נתונים להשוואה שבועית — צריך לפחות ${MIN_PER_WEEK_WINDOW} שאלות בכל שבוע. השבוע ענית ${week?.thisWeek.attempts ?? 0}, ובשבוע שעבר ${week?.lastWeek.attempts ?? 0}.`}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-0.5">
                {healedThisWeek > 0 && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1">
                    {`🛠️ ${healedThisWeek} חולשות שתיקנת`}
                  </span>
                )}
                {topMistake && (
                  <Link
                    href="/errors"
                    className="text-[11px] font-bold text-rose-800 bg-rose-500/10 border border-rose-500/30 rounded-full px-2.5 py-1 hover:bg-rose-500/20 transition-colors"
                  >
                    {`הטעות מס' 1 שלך: ${topMistake.category}`}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Per-subject sections */}
        {data?.map(({ subject, totals, topics, weakSubs }) => {
          const boostTarget = weakSubs[0];
          // A named repair, when the evidence supports one. It outranks the
          // reinforcement CTA below — which is why that card's headline changes
          // when this is showing. Two "most worthwhile now" cards on one screen
          // hand the arbitration to the student.
          const fixTarget = fixTargets[subject] ?? null;
          return (
            <motion.section
              key={subject}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs font-black tracking-widest text-violet-700 uppercase">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{SUBJECT_NAMES[subject] ?? subject}</span>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-3 gap-2">
                <div className="surface-premium rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-slate-900">{totals.attempts}</div>
                  <div className="text-[11px] text-slate-600 font-bold mt-1">שאלות נענו</div>
                </div>
                <div className="surface-premium rounded-2xl p-4 text-center">
                  <div className={`text-2xl font-black ${pctColor(totals.accuracy)}`}>
                    {Math.round(totals.accuracy * 100)}%
                  </div>
                  <div className="text-[11px] text-slate-600 font-bold mt-1">דיוק כולל</div>
                </div>
                <div className="surface-premium rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-emerald-700">{totals.correct}</div>
                  <div className="text-[11px] text-slate-600 font-bold mt-1">תשובות נכונות</div>
                </div>
              </div>

              {/* Repair CTA. math5 is skipped here because it is already the
                  headline action at the top of the page — rendering it twice
                  is the duplication this reorder exists to remove. Other
                  subjects still get theirs in their own section. */}
              {fixTarget && subject !== 'math5' && (
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={`/fix/${encodeURIComponent(fixTarget.id)}`}
                    className="group flex items-center gap-4 bg-gradient-to-l from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 rounded-3xl p-5 shadow-xl shadow-rose-500/25 transition-colors"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white">מסלול תיקון — הכי כדאי עכשיו</div>
                      <div className="text-xs text-rose-50/90 mt-0.5 truncate">
                        {`${fixTarget.title} · ${fixTarget.detail}`}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white rotate-180 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
                  </Link>
                </motion.div>
              )}

              {/* Reinforcement CTA — broad practice on the weakest sub-topic */}
              {boostTarget && (
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={`/practice/${subject}/${encodeURIComponent(boostTarget.topic)}/sub/${boostTarget.subTopicId}/practice`}
                    className="group flex items-center gap-4 bg-gradient-to-l from-cyan-700 to-violet-600 hover:from-cyan-700 hover:to-violet-500 rounded-3xl p-5 shadow-xl shadow-violet-500/25 transition-colors"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-amber-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white">
                        {fixTarget ? 'תרגול חיזוק — רחב יותר' : 'תרגול חיזוק — הכי כדאי עכשיו'}
                      </div>
                      <div className="text-xs text-violet-100/90 mt-0.5 truncate">
                        {boostTarget.topic} · {subTopicTitle(subject, boostTarget.topic, boostTarget.subTopicId)} ·{' '}
                        {Math.round(boostTarget.accuracy * 100)}% דיוק
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-900 rotate-180 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
                  </Link>
                </motion.div>
              )}

              {/* Weakest sub-topics */}
              {weakSubs.length > 0 && (
                <div className="surface-premium rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black tracking-widest text-rose-700 uppercase">
                    <Target className="w-3.5 h-3.5" />
                    <span>מה שווה לחזק</span>
                  </div>
                  {weakSubs.map((s) => (
                    <Link
                      key={`${s.topic}|${s.subTopicId}`}
                      href={`/practice/${subject}/${encodeURIComponent(s.topic)}/sub/${s.subTopicId}/practice`}
                      className="flex items-center justify-between gap-3 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 rounded-xl px-4 py-3 transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {subTopicTitle(subject, s.topic, s.subTopicId)}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {s.topic} · {s.correct}/{s.attempts} נכונות
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-sm font-black ${pctColor(s.accuracy)}`}>
                          {Math.round(s.accuracy * 100)}%
                        </span>
                        <span className="text-xs text-violet-700 group-hover:text-violet-800 font-bold">
                          תרגל ←
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Per-topic accuracy bars */}
              {topics.length > 0 && (
                <div className="surface-premium rounded-3xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black tracking-widest text-violet-700 uppercase">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>דיוק לפי נושא — מהחלש לחזק</span>
                  </div>
                  {topics.map((t) => (
                    <div key={t.topic} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <Link
                          href={`/practice/${subject}/${encodeURIComponent(t.topic)}`}
                          className="font-bold text-slate-800 hover:text-violet-700 transition-colors"
                        >
                          {t.topic}
                        </Link>
                        <span className={`font-black ${pctColor(t.accuracy)}`}>
                          {Math.round(t.accuracy * 100)}%
                          <span className="text-[11px] text-slate-500 font-bold mr-1.5">
                            ({t.attempts} שאלות)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-900/[0.03] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(t.accuracy * 100)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${barColor(t.accuracy)}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          );
        })}

        {/* Footnote */}
        {data !== null && data.length > 0 && (
          <p className="text-center text-[11px] text-slate-500 leading-relaxed pt-2">
            הנתונים נשמרים במכשיר הזה. נספרת רק התשובה הראשונה לכל שאלה — ניסיונות
            חוזרים הם למידה, לא מדידה.
          </p>
        )}
      </div>
    </div>
  );
}
