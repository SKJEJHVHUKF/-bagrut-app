'use client';

import { getTopicMapping, paperLabel, type TopicMapping } from '@/content/bagrut-curriculum';

type Variant = 'inline' | 'banner';

/**
 * BagrutBadge — surfaces bagrut metadata for a math5 topic.
 *
 * Two variants:
 *  - `inline` (default) — compact chip with paper + appearsIn. Used on
 *    topic cards in /my-plan and /practice picker.
 *  - `banner` — full-width header card with paper, weight, points,
 *    appearsIn, and exam-style description. Used at the top of a
 *    lesson page so the student instantly sees "this is how the
 *    bagrut tests this topic".
 *
 * Returns null if the topic isn't in the curriculum (e.g. math4 topics).
 */
export function BagrutBadge({
  topic,
  variant = 'inline',
}: {
  topic: string;
  variant?: Variant;
}) {
  const mapping = getTopicMapping(topic);
  if (!mapping) return null;

  if (variant === 'inline') {
    return <InlineBadge mapping={mapping} />;
  }
  return <BannerBadge mapping={mapping} />;
}

function InlineBadge({ mapping }: { mapping: TopicMapping }) {
  const paperColor =
    mapping.paper === '581'
      ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-800'
      : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-800';

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs">
      <span
        className={`inline-flex items-center gap-1 ${paperColor} border rounded-full px-2 py-0.5 font-bold`}
      >
        <span>{paperLabel(mapping.paper)}</span>
      </span>
      <span className="inline-flex items-center text-slate-600">
        {mapping.appearsIn} • {mapping.typicalPoints} נק׳
      </span>
    </div>
  );
}

function BannerBadge({ mapping }: { mapping: TopicMapping }) {
  // Stripe color reflects which paper the topic belongs to.
  const paperGradient =
    mapping.paper === '581'
      ? 'from-indigo-600/20 to-indigo-700/10 border-indigo-500/40'
      : 'from-indigo-600/20 to-indigo-700/10 border-indigo-500/40';

  const weightLabel =
    mapping.weight === 'core'
      ? '⭐ נושא ליבה'
      : mapping.weight === 'standard'
        ? '◆ נושא סטנדרטי'
        : mapping.weight === 'foundational'
          ? '🔧 יסודות (מקדים לחדו"א)'
          : mapping.weight === 'out-of-scope'
            ? '⚠️ מחוץ לסילבוס'
            : '◇ נושא אופציונלי';

  return (
    <section
      className={`bg-gradient-to-br ${paperGradient} border rounded-2xl p-4 sm:p-5`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="bg-slate-900/5 border border-slate-900/[0.12] rounded-full px-3 py-1 text-xs font-black text-slate-900">
          {paperLabel(mapping.paper)}
        </span>
        <span className="text-xs font-bold text-slate-800">{weightLabel}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3 text-center">
        <Stat label="נפיצות" value={mapping.appearsIn} />
        <Stat label="ניקוד אופייני" value={`${mapping.typicalPoints} נק׳`} />
        <Stat
          label="שאלון"
          value={mapping.paper}
          fullClassName="hidden sm:block"
        />
      </div>

      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
        <span className="font-bold text-slate-900">איך נבחן בבגרות: </span>
        {mapping.examStyle}
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  fullClassName,
}: {
  label: string;
  value: string;
  fullClassName?: string;
}) {
  return (
    <div
      className={`surface-premium rounded-xl px-2 py-2 ${fullClassName ?? ''}`}
    >
      <div className="text-[10px] text-slate-600 font-bold tracking-wide">
        {label}
      </div>
      <div className="text-xs sm:text-sm text-slate-900 font-black mt-0.5">{value}</div>
    </div>
  );
}
