'use client';

// "מחברת הטעויות" — the personal error notebook + profile.
//
// Aggregates every wrong answer the student logged (via lib/mistakes.ts) into
// an error-category profile ("הטעות מספר 1 שלך: תחום הגדרה"), a per-topic
// breakdown, a "practice my mistakes" review, and a deletable list. All data
// is client-side (localStorage), so the page renders after mount. Consistent
// with the free /insights dashboard — categorization by AI is the Pro part.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  NotebookPen,
  Target,
  Trash2,
  ArrowRight,
  Sparkles,
  Crown,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isProUser } from '@/lib/access';
import { MathText } from '@/components/practice/MathText';
import {
  getMistakes,
  mistakesByCategory,
  topCategory,
  mistakesByTopic,
  mistakesForPractice,
  clearMistake,
  clearAllMistakes,
  type MistakeRecord,
  type CategoryStat,
  type TopicMistakeStat,
} from '@/lib/mistakes';

export default function ErrorsPage() {
  const [mistakes, setMistakes] = useState<MistakeRecord[] | null>(null);
  const [cats, setCats] = useState<CategoryStat[]>([]);
  const [topics, setTopics] = useState<TopicMistakeStat[]>([]);
  const [top, setTop] = useState<CategoryStat | null>(null);
  const [pro, setPro] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  function refresh() {
    setMistakes(getMistakes());
    setCats(mistakesByCategory());
    setTopics(mistakesByTopic());
    setTop(topCategory());
  }

  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setPro(isProUser(data.user)));
  }, []);

  const reviewList = mistakes ? mistakesForPractice(12) : [];
  const maxCat = cats.length ? cats[0].count : 1;

  function remove(id: string) {
    clearMistake(id);
    refresh();
  }
  function removeAll() {
    if (typeof window !== 'undefined' && window.confirm('למחוק את כל הטעויות מהמחברת?')) {
      clearAllMistakes();
      refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-800 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-800 transition-colors">
            → חזרה הביתה
          </Link>
          <Link href="/insights" className="text-sm text-indigo-700 hover:text-indigo-800 transition-colors">
            📈 התמונה שלי
          </Link>
        </div>

        <div className="text-center space-y-2 pt-2">
          <h1 className="font-display text-3xl sm:text-4xl font-black gradient-text">
            📓 מחברת הטעויות שלי
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            כל טעות שאתה מסמן נאספת לכאן. כך תראה את הדפוסים החוזרים — ותתקן אותם
            לפני הבגרות, במקום לחזור עליהם שוב ושוב.
          </p>
        </div>

        {/* Loading */}
        {mistakes === null && (
          <div className="text-center text-slate-500 py-16 text-sm">טוען…</div>
        )}

        {/* Empty state */}
        {mistakes !== null && mistakes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-premium rounded-3xl p-8 text-center space-y-4"
          >
            <Sparkles className="w-10 h-10 mx-auto text-indigo-700" />
            <h2 className="text-xl font-black text-slate-900">עדיין אין טעויות רשומות</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              כשתטעה בתרגול או במבחן ותסמן את סוג הטעות — היא תופיע כאן, ותוכל
              לזהות בדיוק על מה כדאי לחזור.
            </p>
            <Link
              href="/practice"
              className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-white"
            >
              <span>🎯 התחל לתרגל</span>
            </Link>
          </motion.div>
        )}

        {mistakes !== null && mistakes.length > 0 && (
          <>
            {/* Top-mistake callout — the marquee insight */}
            {top && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-premium rounded-3xl p-6 space-y-2"
              >
                <div className="text-xs font-black tracking-widest text-rose-700 uppercase flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  <span>הטעות מספר 1 שלך</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{top.category}</div>
                <p className="text-sm text-slate-600">
                  {Math.round(top.pct * 100)}% מהטעויות שלך ({top.count} מתוך {mistakes.length}) הן
                  מסוג <strong>{top.category}</strong>. שים לב אליה במיוחד בתרגול הבא.
                </p>
              </motion.div>
            )}

            {/* Practice my mistakes */}
            {reviewList.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => setReviewing((v) => !v)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-3.5 rounded-2xl font-bold text-white shadow-xl shadow-indigo-500/25 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>תרגל את הטעויות שלי ({reviewList.length})</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${reviewing ? 'rotate-180' : ''}`} />
                </button>

                {reviewing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    {reviewList.map((m) => (
                      <ReviewCard key={m.id} mistake={m} />
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* Category profile — bars */}
            {cats.length > 0 && (
              <div className="surface-premium rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black tracking-widest text-indigo-700 uppercase">
                  <NotebookPen className="w-3.5 h-3.5" />
                  <span>פרופיל הטעויות שלך</span>
                </div>
                {cats.map((c) => (
                  <div key={c.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-800">{c.category}</span>
                      <span className="font-black text-slate-700">
                        {c.count}
                        <span className="text-[11px] text-slate-500 font-bold mr-1.5">
                          ({Math.round(c.pct * 100)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-900/[0.03] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.count / maxCat) * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-l from-rose-500 to-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Per-topic breakdown */}
            {topics.length > 0 && (
              <div className="surface-premium rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black tracking-widest text-indigo-700 uppercase">
                  <Target className="w-3.5 h-3.5" />
                  <span>טעויות לפי נושא</span>
                </div>
                {topics.map((t) => (
                  <Link
                    key={t.topic}
                    href={`/practice/math5/${encodeURIComponent(t.topic)}`}
                    className="flex items-center justify-between gap-3 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 rounded-xl px-4 py-3 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{t.topic || '—'}</div>
                      {t.topCategory && (
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          בעיקר: {t.topCategory}
                          {t.topCategoryPct >= 0.4 && ` (${Math.round(t.topCategoryPct * 100)}%)`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-black text-rose-700">{t.count}</span>
                      <span className="text-xs text-indigo-700 group-hover:text-indigo-800 font-bold">
                        תרגל ←
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Recent list */}
            <div className="surface-premium rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black tracking-widest text-slate-600 uppercase">
                  הטעויות האחרונות ({mistakes.length})
                </div>
                <button
                  onClick={removeAll}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  נקה הכל
                </button>
              </div>
              {mistakes.slice(0, 30).map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 bg-slate-900/[0.02] border border-slate-900/[0.07] rounded-xl px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-white bg-rose-500/90 rounded px-1.5 py-0.5">
                        {m.category}
                      </span>
                      {m.topic && <span className="text-[11px] text-slate-500">{m.topic}</span>}
                    </div>
                    {m.questionText && (
                      <div className="text-xs text-slate-700 chat-md line-clamp-2">
                        <MathText inline>{m.questionText}</MathText>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(m.id)}
                    aria-label="מחק"
                    className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-rose-500/10 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Pro upsell (same spirit as /insights) */}
            {!pro && (
              <Link
                href="/pricing"
                className="flex items-center gap-3 bg-gradient-to-l from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 group"
              >
                <Crown className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-black text-slate-900">
                    רוצה שהמורה יסווג לך את הטעויות אוטומטית?
                  </span>
                  <span className="block text-[11px] text-slate-600">
                    ב-Pro, &quot;למה טעיתי?&quot; מזהה את סוג הטעות בשבילך — בלי לתייג ידנית
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-amber-600 rotate-180 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            )}

            <p className="text-center text-[11px] text-slate-500 leading-relaxed pt-2">
              הנתונים נשמרים במכשיר הזה. סמן את סוג הטעות אחרי כל שאלה שגויה כדי
              שהפרופיל יהיה מדויק.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// A single mistake, reviewable: question shown, correct answer behind a reveal,
// plus a link to re-practice its sub-topic / topic.
function ReviewCard({ mistake }: { mistake: MistakeRecord }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const practiceHref = mistake.subTopicId
    ? `/practice/${mistake.subject}/${encodeURIComponent(mistake.topic)}/sub/${mistake.subTopicId}/practice`
    : `/practice/${mistake.subject}/${encodeURIComponent(mistake.topic)}`;

  return (
    <div className="bg-white border border-slate-900/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-white bg-rose-500/90 rounded px-1.5 py-0.5">
          {mistake.category}
        </span>
        {mistake.topic && <span className="text-[11px] text-slate-500">{mistake.topic}</span>}
      </div>
      {mistake.questionText && (
        <div className="text-sm text-slate-800 chat-md leading-relaxed">
          <MathText>{mistake.questionText}</MathText>
        </div>
      )}
      {showAnswer ? (
        mistake.correctAnswer ? (
          <div className="result-box rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black tracking-widest text-emerald-700 uppercase mb-1">
              התשובה הנכונה
            </div>
            <div className="text-sm font-bold text-emerald-900 chat-md">
              <MathText inline>{mistake.correctAnswer}</MathText>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">אין תשובה שמורה — פתח את הנושא לתרגול.</div>
        )
      ) : (
        <button
          onClick={() => setShowAnswer(true)}
          className="text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
        >
          הצג תשובה נכונה ▼
        </button>
      )}
      <Link
        href={practiceHref}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
      >
        <span>תרגל את הנושא הזה</span>
        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
      </Link>
    </div>
  );
}
