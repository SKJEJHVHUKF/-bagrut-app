'use client';

/**
 * /teach — "למד את הבוט".
 *
 * A standalone study mode: pick a sub-topic, then TEACH it to a classmate who
 * doesn't understand. Explaining is the highest-yield way to learn, and a
 * student who can't explain something doesn't know it — a signal no
 * multiple-choice click can produce.
 *
 * Deliberately NOT in middleware's PROTECTED_PREFIXES. The page renders for
 * anonymous visitors (so its rendering can actually be verified in a browser
 * without a login — several screens in this app have gone unverified for
 * exactly that reason); /api/teach still returns 401, which the session turns
 * into a "sign in" card.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TeachSession } from '@/components/teach/TeachSession';
import { MathText } from '@/components/practice/MathText';
import { allLessonKeys, getSubTopics } from '@/content/lessons';
import { isTeachable } from '@/lib/teach/rubric';
import {
  curriculumIndex,
  getTopicMapping,
  isTopicInActivePaper,
  type BagrutPaper,
} from '@/content/bagrut-curriculum';
import { getPaper } from '@/lib/study-plan';

const SUBJECT = 'math5';

export default function TeachPage() {
  const [paper, setPaper] = useState<BagrutPaper | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);

  // Read after mount — localStorage isn't available during SSR, and reading it
  // in render would produce a hydration mismatch.
  //
  // The deep link (?topic=&sub=, used by the roadmap's "now teach it" card) is
  // read from window.location rather than useSearchParams() on purpose:
  // useSearchParams() forces this page into a Suspense boundary at build time,
  // and an effect is client-only anyway.
  useEffect(() => {
    setPaper(getPaper());

    const params = new URLSearchParams(window.location.search);
    const t = params.get('topic');
    const s = params.get('sub');
    // Only honour a link that points at material we can actually teach against.
    if (t && s && isTeachable(SUBJECT, t, s)) {
      setTopic(t);
      setSubId(s);
    } else if (t && getSubTopics(SUBJECT, t).length) {
      setTopic(t);
    }
  }, []);

  const topics = allLessonKeys()
    .filter((k) => k.subject === SUBJECT)
    .filter((k) => !paper || isTopicInActivePaper(k.topic, paper))
    .filter((k) => getSubTopics(SUBJECT, k.topic).some((s) => isTeachable(SUBJECT, k.topic, s.id)))
    .sort((a, b) => curriculumIndex(a.topic) - curriculumIndex(b.topic));

  const subTopics = topic
    ? getSubTopics(SUBJECT, topic).filter((s) => isTeachable(SUBJECT, topic, s.id))
    : [];

  function restart() {
    setSubId(null);
    setTopic(null);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-800 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/roadmap"
            className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            → חזרה למסלול
          </Link>
        </div>

        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-black gradient-text">
            🙋‍♀️ למד את הבוט
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            נועה היא תלמידה בכיתה שלך שלא הבינה את הנושא. <strong>אתה מלמד אותה.</strong>{' '}
            היא תשאל בדיוק את השאלות שיחשפו מה עוד לא ברור לך — ובסוף תראה מה כיסית ומה פספסת.
          </p>
        </div>

        {!topic ? (
          <div className="surface-premium rounded-3xl p-5 space-y-3">
            <div className="text-xs font-black tracking-widest text-indigo-700 uppercase">
              1 · בחר נושא
            </div>
            <div className="grid grid-cols-2 gap-2">
              {topics.map(({ topic: t }) => {
                const m = getTopicMapping(t);
                return (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className="flex items-center gap-2 text-right px-4 py-3 rounded-2xl bg-slate-900/[0.03] hover:bg-slate-900/[0.05] border border-slate-900/10 hover:border-indigo-500/40 transition-colors"
                  >
                    <span className="text-base flex-shrink-0">{m?.emoji ?? '📐'}</span>
                    <span className="font-bold text-sm text-slate-900">{t}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : !subId ? (
          <>
            <button
              onClick={() => setTopic(null)}
              className="text-sm text-indigo-700 hover:text-indigo-900 font-bold transition-colors"
            >
              ← בחר נושא אחר
            </button>
            <div className="surface-premium rounded-3xl p-5 space-y-3">
              <div className="text-xs font-black tracking-widest text-indigo-700 uppercase">
                2 · מה תלמד אותה?
              </div>
              <div className="space-y-2">
                {subTopics.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSubId(s.id)}
                    className="w-full flex items-start gap-3 text-right px-4 py-3 rounded-2xl bg-slate-900/[0.03] hover:bg-slate-900/[0.05] border border-slate-900/10 hover:border-indigo-500/40 transition-colors"
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{s.emoji ?? '📘'}</span>
                    {/* Titles and taglines carry LaTeX ("מציאת $z$ מתנאים",
                        "המרה בין $a + bi$ ל-…"), so they must go through
                        MathText or the student reads raw dollar signs.
                        `inline` keeps it to one <span> — valid inside a
                        <button>, and one flex item per the MathText contract. */}
                    <span className="min-w-0">
                      <span className="block font-bold text-sm text-slate-900 chat-md math-content">
                        <MathText inline>{s.title}</MathText>
                      </span>
                      <span className="block text-xs text-slate-600 leading-snug chat-md math-content">
                        <MathText inline>{s.tagline}</MathText>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setSubId(null)}
              className="text-sm text-indigo-700 hover:text-indigo-900 font-bold transition-colors"
            >
              ← בחר תת-נושא אחר
            </button>
            <TeachSession
              subject={SUBJECT}
              topic={topic}
              subTopicId={subId}
              onRestart={restart}
            />
          </>
        )}
      </div>
    </div>
  );
}
