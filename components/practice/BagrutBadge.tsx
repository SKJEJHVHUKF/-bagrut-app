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
      ? 'bg-purple-500/15 border-purple-500/30 text-purple-200'
      : 'bg-pink-500/15 border-pink-500/30 text-pink-200';

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs">
      <span
        className={`inline-flex items-center gap-1 ${paperColor} border rounded-full px-2 py-0.5 font-bold`}
      >
        <span>{paperLabel(mapping.paper)}</span>
      </span>
      <span className="inline-flex items-center text-slate-400">
        {mapping.appearsIn} • {mapping.typicalPoints} נק׳
      </span>
    </div>
  );
}

function BannerBadge({ mapping }: { mapping: TopicMapping }) {
  // Stripe color reflects which paper the topic belongs to.
  const paperGradient =
    mapping.paper === '581'
      ? 'from-purple-600/20 to-purple-700/10 border-purple-500/40'
      : 'from-pink-600/20 to-pink-700/10 border-pink-500/40';

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
        <span className="bg-white/10 border border-white/15 rounded-full px-3 py-1 text-xs font-black text-white">
          {paperLabel(mapping.paper)}
        </span>
        <span className="text-xs font-bold text-slate-200">{weightLabel}</span>
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

      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
        <span className="font-bold text-white">איך נבחן בבגרות: </span>
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
      className={`bg-white/[0.05] border border-white/10 rounded-xl px-2 py-2 ${fullClassName ?? ''}`}
    >
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        {label}
      </div>
      <div className="text-xs sm:text-sm text-white font-black mt-0.5">{value}</div>
    </div>
  );
}
