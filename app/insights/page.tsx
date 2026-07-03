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
} from 'lucide-react';
import { getSubTopic } from '@/content/lessons';
import {
  totalStats,
  topicStats,
  weakestSubTopics,
  subjectsWithResults,
  type TopicStat,
  type SubTopicStat,
} from '@/lib/results';

const SUBJECT_NAMES: Record<string, string> = {
  math5: 'מתמטיקה 5 יח׳',
  math4: 'מתמטיקה 4 יח׳',
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

export default function InsightsPage() {
  const [data, setData] = useState<SubjectData[] | null>(null);

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
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-800 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-800 transition-colors">
            → חזרה הביתה
          </Link>
          <Link href="/quiz" className="text-sm text-indigo-700 hover:text-indigo-800 transition-colors">
            מבחן מהיר ⚡
          </Link>
        </div>

        <div className="text-center space-y-2 pt-2">
          <h1 className="font-display text-3xl sm:text-4xl font-black gradient-text">
            📈 התמונה שלי
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            כל שאלה שאתה עונה — במבחן המהיר ובתרגול המודרך — נצברת לתמונה אחת:
            איפה אתה חזק, ומה שווה לחזק לפני הבגרות.
          </p>
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
            <Sparkles className="w-10 h-10 mx-auto text-indigo-700" />
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

        {/* Per-subject sections */}
        {data?.map(({ subject, totals, topics, weakSubs }) => {
          const boostTarget = weakSubs[0];
          return (
            <motion.section
              key={subject}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs font-black tracking-widest text-indigo-700 uppercase">
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

              {/* Reinforcement CTA — the whole point of the page */}
              {boostTarget && (
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={`/practice/${subject}/${encodeURIComponent(boostTarget.topic)}/sub/${boostTarget.subTopicId}/practice`}
                    className="group flex items-center gap-4 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-3xl p-5 shadow-xl shadow-indigo-500/25 transition-colors"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-amber-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white">תרגול חיזוק — הכי כדאי עכשיו</div>
                      <div className="text-xs text-indigo-100/90 mt-0.5 truncate">
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
                        <span className="text-xs text-indigo-700 group-hover:text-indigo-800 font-bold">
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
                  <div className="flex items-center gap-2 text-xs font-black tracking-widest text-indigo-700 uppercase">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>דיוק לפי נושא — מהחלש לחזק</span>
                  </div>
                  {topics.map((t) => (
                    <div key={t.topic} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <Link
                          href={`/practice/${subject}/${encodeURIComponent(t.topic)}`}
                          className="font-bold text-slate-800 hover:text-indigo-700 transition-colors"
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
