'use client';

// SubTopicTile — one tile on a track-topic page (/roadmap/track/[paper]/[topic]).
//
// Three kinds, one frame:
//   ladder — opens the sub-topic's level ladder. Carries the same progress
//            language as the old timeline row it replaces: lock / play / check /
//            crown badge, "שלב n", rung dots, stars, a 🔁 review-due pill, and
//            a one-line status. Locked tiles are not links.
//   soon   — a syllabus item with no authored content yet: dashed, dimmed,
//            "בקרוב 🔒", not interactive. It still shows its bullets so the
//            student sees what the step will cover and where it sits.
//   link   — a screen that already exists (mixed bagrut practice, quick quiz).
//
// `bullets` ("מה לומדים") come from the owner's syllabus and may contain LaTeX,
// so every text field goes through <MathText inline> inside a `.chat-md` block
// (never on a flex container — see CLAUDE.md, MathText contract).

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

const MAX_BULLETS = 4;

function Bullets({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null;
  const shown = items.slice(0, MAX_BULLETS);
  const more = items.length - shown.length;
  return (
    <ul className="mt-2 space-y-1">
      {shown.map((b, i) => (
        <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-600">
          <span aria-hidden="true" className="mt-[5px] w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
          <div className="chat-md flex-1 min-w-0">
            <MathText inline>{b}</MathText>
          </div>
        </li>
      ))}
      {more > 0 && <li className="text-[10px] text-slate-400 pr-2.5">ועוד {more}…</li>}
    </ul>
  );
}

function StepLabel({ step, chip }: { step: number; chip?: { text: string; tone: 'violet' | 'slate' | 'amber' } }) {
  const toneCls =
    chip?.tone === 'violet'
      ? 'chip-primary'
      : chip?.tone === 'amber'
        ? 'bg-amber-500/10 text-amber-800 border border-amber-500/25'
        : 'bg-slate-900/[0.04] text-slate-600 border border-slate-900/10';
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase">שלב {step}</div>
      {chip && <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${toneCls}`}>{chip.text}</span>}
    </div>
  );
}

export function SubTopicTile(props: Props) {
  const { entry } = props;

  // ---------------------------------------------------------------- soon
  if (entry.kind === 'soon') {
    return (
      <div
        aria-disabled="true"
        className="h-full rounded-2xl border border-dashed border-slate-900/15 bg-white/40 p-4 opacity-70 text-right"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-900/[0.04] text-slate-500">
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <StepLabel step={entry.step} chip={{ text: '🔒 בקרוב', tone: 'slate' }} />
            <div className="text-sm font-black text-slate-700 chat-md">
              <MathText inline>{entry.tile.title}</MathText>
            </div>
            <Bullets items={entry.tile.bullets} />
          </div>
        </div>
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
      <Link href={tile.href} className="card-3d group block h-full text-right">
        <div className="relative h-full rounded-2xl border border-violet-500/25 bg-gradient-to-l from-violet-600/[0.07] to-cyan-700/[0.06] p-4 transition-all group-hover:border-violet-500/50">
          <div className="flex items-start gap-3">
            <div className="icon-3d w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-violet-500 to-violet-600 text-white text-xl">
              {tile.emoji ?? '🎓'}
            </div>
            <div className="flex-1 min-w-0">
              <StepLabel step={entry.step} chip={{ text: chipText, tone: 'violet' }} />
              <div className="text-sm font-black text-slate-900 chat-md">
                <MathText inline>{tile.title}</MathText>
              </div>
              <Bullets items={tile.bullets} />
            </div>
            <ArrowLeft className="w-4 h-4 text-violet-700 flex-shrink-0 mt-1 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>
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

  const statusLine = locked
    ? `🔒 נפתח אחרי שתסיים את "${props.prevTitle ?? 'השלב הקודם'}"`
    : mastered
      ? '👑 שליטה מלאה בכל הרמות'
      : done
        ? `✓ הליבה הושלמה · ${cleared}/${total} רמות`
        : inProgress
          ? `רמה ${Math.min(cleared + 1, total)} מתוך ${total} · ממשיכים לטפס`
          : tile.bullets?.length
            ? ''
            : node.tagline;

  const content = (
    <div className={`relative h-full rounded-2xl border p-4 transition-all ${accent}`}>
      <div className="flex items-start gap-3">
        <div
          className={`icon-3d w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${
            !locked && !done && !mastered ? 'ring-2 ring-violet-400/40 animate-pulse' : ''
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
        <div className="flex-1 min-w-0">
          <StepLabel step={entry.step} chip={tile.review ? { text: '↩ חזרה', tone: 'slate' } : undefined} />
          <div className="text-sm font-black text-slate-900 chat-md">
            <MathText inline>{node.title}</MathText>
          </div>
          {statusLine && (
            <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1 chat-md">
              <MathText inline>{statusLine}</MathText>
            </div>
          )}
          <Bullets items={tile.bullets} />
          {!locked && total > 0 && (
            <div className="flex items-center gap-2 mt-2.5">
              {/* rung dots */}
              <div className="flex items-center gap-0.5" aria-label={`${cleared} מתוך ${total} רמות`}>
                {Array.from({ length: total }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < cleared ? (mastered ? 'bg-amber-500' : 'bg-violet-500') : 'bg-slate-900/15'
                    }`}
                  />
                ))}
              </div>
              {summary && summary.stars > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  {summary.stars}
                </span>
              )}
              {reviewDue > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-500/10 border border-rose-500/25 rounded-full px-1.5">
                  🔁 {reviewDue}
                </span>
              )}
            </div>
          )}
        </div>
        {!locked && !done && !mastered && <PlayCircle className="w-4 h-4 text-violet-700 flex-shrink-0 mt-1" />}
      </div>
    </div>
  );

  if (locked || !props.href) return <div className="h-full text-right">{content}</div>;
  return (
    <Link href={props.href} className="card-3d group block h-full text-right">
      {content}
    </Link>
  );
}
