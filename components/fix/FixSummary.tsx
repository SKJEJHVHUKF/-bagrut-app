'use client';

// FixSummary — how a repair session ends. Three endings, never a dead end.
//
//   healed          the weakness closed; say what closed it, in numbers
//   too-many-misses three misses; hand it to the lesson and to tomorrow
//   out-of-supply   the ladder ran out before the streak did
//
// Every ending offers at least two ways forward. The failure branch is the one
// that matters: a student who has just missed three questions in a row is the
// single most likely person to close the tab, and the wrong copy here ("you
// failed") does more damage than the missed questions.

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, PartyPopper, RotateCcw, Wrench } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import type { PauseReason } from '@/lib/remediation/types';

export function FixSummary({
  healed,
  pauseReason,
  title,
  answered,
  correct,
  learnHref,
  nextWeakness,
}: {
  healed: boolean;
  pauseReason?: PauseReason;
  title: string;
  answered: number;
  correct: number;
  /** The guided lesson for this sub-topic — the honest fallback after misses. */
  learnHref: string;
  /** The next thing worth repairing, when one exists. */
  nextWeakness: { id: string; title: string } | null;
}) {
  // Hebrew sentences that interpolate numbers are built as STRINGS, not as JSX
  // text around `{expr}`. In an RTL source file the space you type next to an
  // expression does not reliably land where it looks like it lands — this
  // shipped as "פתרת 3 מתוך 3נכון" with a perfectly normal-looking space in the
  // source, and only a charCode dump showed the digit sitting directly against
  // the next letter. A template literal has no JSX whitespace rules to get
  // wrong.
  const healedLine = `פתרת ${correct} מתוך ${answered} נכון, בקושי עולה, והאחרונות היו ברצף. זה בדיוק מה שמפריד בין "הבנתי את ההסבר" לבין "אני יודע לעשות את זה".`;
  const outOfSupplyLine = `עברת על ${answered} שאלות (${correct} נכונות), ועוד לא יצא רצף שמוכיח שהנושא יושב. השלב הבא הוא לחזור להסבר עצמו, לא לעוד תרגיל מאותו סוג.`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="space-y-3"
    >
      <div className="surface-premium rounded-3xl p-7 text-center space-y-3">
        {healed ? (
          <>
            <PartyPopper className="w-11 h-11 mx-auto text-emerald-500" />
            <h2 className="font-display text-xl font-black text-slate-900">
              נסגר. הטעות הזאת תוקנה.
            </h2>
            <div className="text-base font-bold text-slate-800 chat-md math-content">
              <MathText inline>{title}</MathText>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{healedLine}</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              לא נציע לך את זה שוב בשבועיים הקרובים. אם זה יחזור — נדע, וניקח את זה מחדש.
            </p>
          </>
        ) : pauseReason === 'out-of-supply' ? (
          <>
            <BookOpen className="w-11 h-11 mx-auto text-violet-500" />
            <h2 className="font-display text-xl font-black text-slate-900">
              נגמרו התרגילים כאן — אבל זה עוד לא סגור
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">{outOfSupplyLine}</p>
          </>
        ) : (
          <>
            <RotateCcw className="w-11 h-11 mx-auto text-amber-500" />
            <h2 className="font-display text-xl font-black text-slate-900">
              זה לא ייסגר הערב — וזה בסדר גמור
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              נפלת כאן שלוש פעמים, ואין טעם להמשיך לירות באותו קיר. הדרך הנכונה עכשיו היא
              לחזור להסבר של השלב ולראות את זה נבנה מההתחלה.
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              השאלות שטעית בהן כבר נכנסו לחזרה של מחר, כך שזה יחזור אליך גם בלי שתזכור.
            </p>
          </>
        )}
      </div>

      <div className="space-y-2">
        {!healed && (
          <Link
            href={learnHref}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-cyan-700 to-violet-600 hover:from-cyan-700 hover:to-violet-500 px-5 py-3.5 rounded-2xl font-black text-white text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>חזרה להסבר של השלב</span>
          </Link>
        )}

        {nextWeakness && (
          <Link
            href={`/fix/${encodeURIComponent(nextWeakness.id)}`}
            className={
              healed
                ? 'w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-cyan-700 to-violet-600 hover:from-cyan-700 hover:to-violet-500 px-5 py-3.5 rounded-2xl font-black text-white text-sm transition-colors'
                : 'w-full inline-flex items-center justify-center gap-2 bg-slate-900/[0.04] hover:bg-slate-900/[0.07] border border-slate-900/10 px-5 py-3 rounded-2xl font-bold text-slate-700 text-sm transition-colors'
            }
          >
            <Wrench className="w-4 h-4" />
            <span>{`לתקן את הבא: ${nextWeakness.title}`}</span>
          </Link>
        )}

        <Link
          href="/roadmap/review"
          className="w-full inline-flex items-center justify-center gap-2 bg-slate-900/[0.04] hover:bg-slate-900/[0.07] border border-slate-900/10 px-5 py-3 rounded-2xl font-bold text-slate-700 text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>לחזרה היומית</span>
        </Link>

        <Link
          href="/roadmap"
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-slate-500 hover:text-slate-700 text-sm transition-colors"
        >
          <span>חזרה למפת הלמידה</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
