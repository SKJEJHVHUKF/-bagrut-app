'use client';

// SubTopicTile — one tile on a track-topic page (/roadmap/track/[paper]/[topic]).
//
// Three kinds, ONE frame. Every tile is the same shape and — inside a grid
// with `auto-rows-fr` — the same size (owner's request: "כל המלבנים באותם
// גדלים"): a flex column with a fixed header row (badge · step · chip), a
// title clamped to two lines, a bullets area clamped to three, and a footer
// row pinned to the bottom (progress dots / stars / status). Content that
// does not fit is clamped, never allowed to change the tile's height.
//
//   ladder — opens the sub-topic's level ladder. Same progress language as
//            the old timeline row: lock / play / check / crown badge, "שלב n",
//            rung dots, stars, a 🔁 review-due pill, a one-line status.
//            Locked tiles are not links.
//   soon   — a syllabus item with no authored content yet: dashed, dimmed,
//            "בקרוב", not interactive; still shows its bullets so the student
//            sees what the step will cover and where it sits.
//   link   — a screen that already exists (mixed bagrut practice, quick quiz).
//
// `bullets` ("מה לומדים") come from the owner's syllabus and may contain LaTeX,
// so every text field goes through <MathText inline> inside a `.chat-md` block
// (never on a flex container — see CLAUDE.md, MathText contract).

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Crown, Lock, PlayCircle, Star } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import type { TrackEntry } from '@/lib/track';
import type { NodeLevelSummary } from '@/lib/roadmap-progress';
import type { StepStatus } from '@/types/roadmap';

type Props = {
  entry: TrackEntry;
  /** ladder only */
  status?: StepStatus;
  summary?: NodeLevelSummary | null;
  levelCount?: number;
  prevTitle?: string;
  reviewDue?: number;
  /** ladder only — the ladder URL (with ?ctx=) computed by the page. */
  href?: string;
};

const MAX_BULLETS = 3;

/* ---------- shared pieces ------------------------------------------------ */

function Bullets({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null;
  const shown = items.slice(0, MAX_BULLETS);
  const more = items.length - shown.length;
  return (
    <ul className="mt-2 space-y-1">
      {shown.map((b, i) => (
        <li key={i} className="flex items-start gap-1.5 text-xs leading-snug text-slate-600">
          <span aria-hidden="true" className="mt-[7px] w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
          <div className="chat-md flex-1 min-w-0 line-clamp-1">
            <MathText inline>{b}</MathText>
          </div>
        </li>
      ))}
      {more > 0 && <li className="text-[11px] text-slate-400 pr-2.5">ועוד {more}…</li>}
    </ul>
  );
}

function Chip({ text, tone }: { text: string; tone: 'violet' | 'slate' | 'amber' | 'emerald' }) {
  const cls =
    tone === 'violet'
      ? 'chip-primary'
      : tone === 'amber'
        ? 'bg-amber-500/10 text-amber-800 border border-amber-500/25'
        : tone === 'emerald'
          ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/25'
          : 'bg-slate-900/[0.04] text-slate-600 border border-slate-900/10';
  return <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap ${cls}`}>{text}</span>;
}

/** The uniform frame: header (badge · step · chip) → title → bullets → footer. */
function Frame({
  badge,
  step,
  chip,
  title,
  titleClass = 'text-slate-900',
  bullets,
  footer,
  trailing,
  className,
}: {
  badge: ReactNode;
  step: number;
  chip?: ReactNode;
  title: string;
  titleClass?: string;
  bullets?: string[];
  footer: ReactNode;
  trailing?: ReactNode;
  className: string;
}) {
  return (
    <div className={`relative flex h-full min-h-[11.5rem] flex-col rounded-2xl border p-4 text-right transition-all ${className}`}>
      <div className="flex items-start gap-3">
        {badge}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase">שלב {step}</div>
            {chip}
          </div>
          <div className={`text-[15px] font-black leading-snug mt-0.5 line-clamp-2 chat-md ${titleClass}`}>
            <MathText inline>{title}</MathText>
          </div>
        </div>
        {trailing}
      </div>
      <div className="flex-1">
        <Bullets items={bullets} />
      </div>
      <div className="mt-3 pt-2.5 border-t border-slate-900/[0.06] min-h-[1.75rem] flex items-center gap-2 text-[11px] text-slate-600">
        {footer}
      </div>
    </div>
  );
}

/* ---------- the tile ----------------------------------------------------- */

export function SubTopicTile(props: Props) {
  const { entry } = props;

  // ---------------------------------------------------------------- soon
  if (entry.kind === 'soon') {
    return (
      <div aria-disabled="true" className="h-full">
        <Frame
          className="border-dashed border-slate-900/15 bg-white/40 opacity-75"
          badge={
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-900/[0.04] text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
          }
          step={entry.step}
          chip={<Chip text="🔒 בקרוב" tone="slate" />}
          title={entry.tile.title}
          titleClass="text-slate-700"
          bullets={entry.tile.bullets}
          footer={<span className="text-slate-500">התוכן לשלב הזה בכתיבה — הסדר כבר במקום</span>}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------- link
  if (entry.kind === 'link') {
    const { tile } = entry;
    const chipText = tile.href.startsWith('/quiz')
      ? 'בוחן מהיר'
      : tile.href.includes('mode=bagrut')
        ? 'תרגול בגרות'
        : 'מסך תרגול';
    return (
      <Link href={tile.href} className="card-3d group block h-full">
        <Frame
          className="border-violet-500/25 bg-gradient-to-l from-violet-600/[0.07] to-cyan-700/[0.06] group-hover:border-violet-500/50"
          badge={
            <div className="icon-3d w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-violet-500 to-violet-600 text-white text-xl">
              {tile.emoji ?? '🎓'}
            </div>
          }
          step={entry.step}
          chip={<Chip text={chipText} tone="violet" />}
          title={tile.title}
          bullets={tile.bullets}
          footer={
            <span className="inline-flex items-center gap-1 font-bold text-violet-700">
              פתיחה
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </span>
          }
        />
      </Link>
    );
  }

  // ---------------------------------------------------------------- ladder
  const { node, tile } = entry;
  const status: StepStatus = props.status ?? 'LOCKED';
  const summary = props.summary ?? null;
  const mastered = !!summary?.mastered;
  const done = status === 'COMPLETED';
  const locked = status === 'LOCKED';
  const cleared = summary?.clearedCount ?? 0;
  const total = summary?.totalLevels ?? props.levelCount ?? 0;
  const inProgress = !locked && !done && cleared > 0;
  const reviewDue = props.reviewDue ?? 0;

  const accent = mastered
    ? 'border-amber-400/50 bg-amber-100/70'
    : done
      ? 'border-emerald-500/35 bg-emerald-100/60'
      : locked
        ? 'border-slate-900/[0.06] bg-white/40 opacity-60'
        : 'border-violet-500/35 bg-[var(--primary-container)]/70 group-hover:border-violet-500/60';

  const iconBg = mastered
    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
    : done
      ? 'bg-emerald-500/25 text-emerald-800'
      : locked
        ? 'bg-slate-900/[0.03] text-slate-500'
        : 'bg-gradient-to-br from-violet-500 to-violet-600 text-white';

  const statusText = locked
    ? `🔒 נפתח אחרי "${props.prevTitle ?? 'השלב הקודם'}"`
    : mastered
      ? '👑 שליטה מלאה בכל הרמות'
      : done
        ? `✓ הליבה הושלמה · ${cleared}/${total} רמות`
        : inProgress
          ? `רמה ${Math.min(cleared + 1, total)} מתוך ${total} · ממשיכים`
          : total > 0
            ? `${total} רמות — מלומדים ועד בגרות`
            : '';

  const chip = tile.review ? (
    <Chip text="↩ חזרה" tone="slate" />
  ) : mastered ? (
    <Chip text="שליטה" tone="amber" />
  ) : done ? (
    <Chip text="הושלם" tone="emerald" />
  ) : inProgress ? (
    <Chip text="בתהליך" tone="violet" />
  ) : undefined;

  const footer = (
    <>
      {!locked && total > 0 && (
        <span className="flex items-center gap-0.5 flex-shrink-0" aria-label={`${cleared} מתוך ${total} רמות`}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i < cleared ? (mastered ? 'bg-amber-500' : 'bg-violet-500') : 'bg-slate-900/15'}`}
            />
          ))}
        </span>
      )}
      {summary && summary.stars > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 flex-shrink-0">
          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
          {summary.stars}
        </span>
      )}
      {reviewDue > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-500/10 border border-rose-500/25 rounded-full px-1.5 flex-shrink-0">
          🔁 {reviewDue}
        </span>
      )}
      <span className="chat-md flex-1 min-w-0 line-clamp-1 text-slate-600">
        <MathText inline>{statusText}</MathText>
      </span>
    </>
  );

  const frame = (
    <Frame
      className={accent}
      badge={
        <div
          className={`icon-3d w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${
            !locked && !done && !mastered ? 'ring-2 ring-violet-400/40' : ''
          }`}
        >
          {mastered ? (
            <Crown className="w-5 h-5" />
          ) : done ? (
            <CheckCircle className="w-5 h-5" />
          ) : locked ? (
            <Lock className="w-4 h-4" />
          ) : (
            <span className="text-xl">{node.emoji ?? '📘'}</span>
          )}
        </div>
      }
      step={entry.step}
      chip={chip}
      title={node.title}
      bullets={tile.bullets?.length ? tile.bullets : [node.tagline]}
      footer={footer}
      trailing={
        !locked && !done && !mastered ? (
          <PlayCircle className="w-4 h-4 text-violet-700 flex-shrink-0 mt-1" />
        ) : undefined
      }
    />
  );

  if (locked || !props.href) return <div className="h-full">{frame}</div>;
  return (
    <Link href={props.href} className="card-3d group block h-full">
      {frame}
    </Link>
  );
}
