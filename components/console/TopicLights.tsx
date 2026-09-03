'use client';

/**
 * TopicLights — the class's topics as three words.
 *
 * הכיתה שולטת / על הגבול / ללמד שוב. A dot, an icon, the topic, the word — and
 * on a "ללמד שוב" row, the button that sends the whole class a short practice
 * in it, plus the names of who is stuck, because "סדרות: ללמד שוב" is a lesson
 * and "תקועים: שיר, רן" is who to look at while giving it.
 *
 * The words come from lib/class-board topicSummary(): "ללמד שוב" is exactly
 * the board's reteach zone, never a second opinion. A topic without enough
 * students to judge is not labelled — it is named in one footnote.
 */

import { motion } from 'framer-motion';
import { BookOpen, Target } from 'lucide-react';
import { topicSummary, type TopicState } from '@/lib/class-board';
import { fadeUp, inViewProps } from '@/lib/animations';
import { TopicIcon } from '@/components/roadmap/TopicIcon';
import { useClass } from '@/components/console/ClassContext';
import { TOPIC_WORD, EMPTY, BTN, thinTopics, stuckUnder } from '@/components/console/copy';
import { SectionHead, Btn } from '@/components/console/ui';

const LOOK: Record<TopicState, { dot: string; text: string }> = {
  strong: { dot: 'bg-emerald-500', text: 'text-emerald-800' },
  borderline: { dot: 'bg-amber-400', text: 'text-amber-800' },
  reteach: { dot: 'bg-orange-500', text: 'text-orange-800' },
};

export default function TopicLights() {
  const { board, isDemo, openFocus } = useClass();
  const rows = topicSummary(board);
  const thin = board.topics.filter((t) => !rows.some((r) => r.topic === t));

  return (
    <motion.section variants={fadeUp} {...inViewProps}>
      <SectionHead icon={BookOpen} title="הנושאים" hint="מילה אחת לכל נושא" />
      {rows.length === 0 ? (
        <p className="surface-premium rounded-2xl px-5 py-6 text-sm text-slate-600">{EMPTY.topics}</p>
      ) : (
        <ul className="surface-premium divide-y divide-slate-900/[0.06] rounded-2xl">
          {rows.map((r) => (
            <li key={r.topic} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${LOOK[r.state].dot}`} aria-hidden />
              <TopicIcon id={r.topic} className="h-4 w-4 shrink-0 text-violet-600" />
              <span className="font-display text-base font-black text-ink">{r.topic}</span>
              <span className={`text-sm font-bold ${LOOK[r.state].text}`}>{TOPIC_WORD[r.state]}</span>
              {r.state === 'reteach' && !isDemo && (
                <Btn kind="primary" className="ms-auto" onClick={() => openFocus('class', r.topic)}>
                  <Target className="h-4 w-4" aria-hidden />
                  {BTN.sendClass}
                </Btn>
              )}
              {r.stuckStudents.length > 0 && (
                <span className="basis-full text-xs text-slate-500">{stuckUnder(r.stuckStudents)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {thin.length > 0 && <p className="mt-2 text-xs text-slate-500">{thinTopics(thin)}</p>}
    </motion.section>
  );
}
