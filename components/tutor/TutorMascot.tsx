'use client';

/**
 * The private tutor's face — a character, not an icon.
 *
 * Itay picked the headset concept out of six. The reason it won: it is the
 * only one whose FORM says what the product does. A cute robot is a cute
 * robot; a robot wearing a headset with a mic boom is someone who showed up to
 * teach you. That also puts daylight between MathUp and the Duolingo owl it
 * was benchmarked against, instead of competing on the same square.
 *
 * WHY SVG AND NOT A RENDER / LOTTIE / three.js
 * A PNG render would blur on the 56px launcher and weigh more than the whole
 * bubble; three.js is ~150KB for one mascot on a Hobby plan. The depth here is
 * painted, not computed: one key light from the top-left, a cyan rim on the
 * lower-right edge, ambient occlusion where the ear cups meet the skull, and a
 * violet bounce off the ground. That reads as 3D at every size and costs
 * nothing.
 *
 * 🔴 NO SVG <filter> ANYWHERE, ON PURPOSE. Every glow is a radialGradient.
 * Filters rasterize at a fixed resolution inside a `transform: scale()` button
 * and blur badly on hover, and their filter region clips unless hand-sized.
 *
 * 🔴 EVERY COORDINATE IS A LITERAL. No Math.cos/sin, no computed geometry —
 * this renders on the server too, and Node and the browser disagree in the
 * last digit of a float, which is a hydration mismatch. Same rule as
 * lib/geo-figure.ts.
 *
 * ONE ARTWORK, TWO FRAMINGS: the whole character lives in one coordinate
 * space; `variant="bust"` is a viewBox crop of the same drawing, not a second
 * drawing. Edit the head once and both framings follow.
 *
 * HOW IT STAYS ALIVE
 * Six motion layers on deliberately co-prime periods (5s float, 5.4s blink,
 * 7.3s head sway, 9.7s eye glance, 6.1s/5s hands). Nothing divides evenly into
 * anything else, so the combined loop takes minutes to repeat and the eye
 * never catches the cycle. That is the whole trick — a single 2s bob is what
 * makes a mascot look like a GIF.
 */

import { useId } from 'react';

export type MascotExpression =
  /** default — soft smile, blinking, small idle drift */
  | 'idle'
  /** waiting on the model — brows down, eyes up, dots */
  | 'thinking'
  /** streaming an answer — mouth moves, free hand explains, mic tip lit */
  | 'talking'
  /** the student got it right — closed smiling eyes, both hands up, sparkles */
  | 'happy'
  /** listening — head tilt, one brow raised */
  | 'curious'
  /**
   * The student just got something wrong. Concerned and attentive, NEVER
   * disappointed: brows angle up at the inner ends (sympathy, not scolding),
   * the accent goes amber, and it leans in. A tutor that looks let down is a
   * tutor a 17-year-old stops opening.
   */
  | 'oops';

export type MascotVariant = 'bust' | 'full';

/** Head + headset + the top of the collar. For anything under ~72px. */
const BUST_VIEWBOX = '12 8 104 104';
/** The whole character, floating, with its ground shadow. */
const FULL_VIEWBOX = '0 -2 128 144';

/** Amber is the "let's look at this together" accent. Cyan is everything else. */
const ACCENT = { normal: '#67E8F9', alert: '#FBBF24' } as const;

export default function TutorMascot({
  variant = 'bust',
  expression = 'idle',
  animate = true,
  compact,
  className = '',
  label,
}: {
  variant?: MascotVariant;
  expression?: MascotExpression;
  /** Set false to freeze it (a static thumbnail, a print view). */
  animate?: boolean;
  /**
   * Drop the mic boom and the band highlight. At 40px and under they stop
   * being detail and start being noise — verified in the raster, not guessed.
   * Defaults to on for the bust framing only when you ask for it.
   */
  compact?: boolean;
  /** Sizing lives here — `w-10 h-10`, `w-24 h-24`. */
  className?: string;
  /** Give it an accessible name, or leave it out and it is decorative. */
  label?: string;
}) {
  // Two mascots on one page (launcher + panel header) would otherwise share
  // gradient ids and the second would paint with the first's defs. The strip
  // is not cosmetic: React's useId returns ':r0:' / '«r0»' depending on the
  // version, and both forms break `url(#…)` references in some engines.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const g = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${g(name)})`;

  const full = variant === 'full';
  const anim = (cls: string) => (animate ? cls : '');
  const alert = expression === 'oops';
  const accent = alert ? ACCENT.alert : ACCENT.normal;

  // A tilt sells "leaning in" more cheaply than redrawing the face. It pivots
  // at the collar so the head leans on the neck instead of sliding sideways.
  const tilt = expression === 'curious' ? -5 : alert ? -6.5 : 0;

  // Hands are posed, not just placed: raised in celebration, one held up
  // mid-explanation, tucked in while it waits.
  const hands =
    expression === 'happy'
      ? { l: [25, 104], r: [103, 104] }
      : alert
        ? { l: [29, 114], r: [99, 100] }
        : { l: [27, 116], r: [101, 106] };

  return (
    <svg
      viewBox={full ? FULL_VIEWBOX : BUST_VIEWBOX}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      // Glows reach past the viewBox on purpose; without this they get a hard
      // square edge on the launcher.
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Shell: key light top-left falling into a violet-grey terminator.
            The four stops are what make a flat rect read as a volume. */}
        <linearGradient id={g('shell')} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="42%" stopColor="#F1EFFE" />
          <stop offset="74%" stopColor="#DAD5F6" />
          <stop offset="100%" stopColor="#B7B0E6" />
        </linearGradient>
        <linearGradient id={g('shellDark')} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#DAD5F6" />
          <stop offset="100%" stopColor="#9E97D8" />
        </linearGradient>

        {/* Specular highlight — the wet look on the crown. */}
        <radialGradient id={g('gloss')}>
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="58%" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        {/* Violet light bouncing back up off the ground. */}
        <radialGradient id={g('bounce')}>
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </radialGradient>

        {/* Ambient occlusion — the dark seam where two volumes meet. */}
        <radialGradient id={g('ao')}>
          <stop offset="0%" stopColor="#1E1B4B" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
        </radialGradient>

        {/* The face screen: smoked glass, darker at the bottom. */}
        <linearGradient id={g('visor')} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0%" stopColor="#2E2870" />
          <stop offset="45%" stopColor="#1A1650" />
          <stop offset="100%" stopColor="#0C0A2E" />
        </linearGradient>
        <linearGradient id={g('visorGloss')} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={g('visorEdge')} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.5" />
        </linearGradient>
        <clipPath id={g('visorClip')}>
          <rect x="39" y="34" width="50" height="36" rx="16" />
        </clipPath>

        {/* Every lit element shares one ramp, so the highlights all read as
            coming from the same source. The alert ramp is the same shape in
            amber — swapping hue only, never the lighting. */}
        <radialGradient id={g('eye')}>
          <stop offset="0%" stopColor={alert ? '#FFFBEB' : '#F0FEFF'} />
          <stop offset="35%" stopColor={alert ? '#FDE68A' : '#A5F3FC'} />
          <stop offset="72%" stopColor={alert ? '#FBBF24' : '#22D3EE'} />
          <stop offset="100%" stopColor={alert ? '#F59E0B' : '#06B6D4'} />
        </radialGradient>
        <radialGradient id={g('eyeGlow')}>
          <stop offset="0%" stopColor={alert ? '#FBBF24' : '#22D3EE'} stopOpacity="0.55" />
          <stop offset="100%" stopColor={alert ? '#FBBF24' : '#22D3EE'} stopOpacity="0" />
        </radialGradient>

        {/* Headset and collar — the only places brand violet appears as mass. */}
        <linearGradient id={g('pod')} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>

        <radialGradient id={g('coreGlow')}>
          <stop offset="0%" stopColor={alert ? '#FBBF24' : '#22D3EE'} stopOpacity="0.5" />
          <stop offset="100%" stopColor={alert ? '#FBBF24' : '#22D3EE'} stopOpacity="0" />
        </radialGradient>

        {/* Rim light: cyan spilling around the shadow edge. Fading at both ends
            is what keeps it from looking like a drawn outline. */}
        <linearGradient id={g('rim')} x1="1" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
          <stop offset="45%" stopColor="#67E8F9" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={g('ground')}>
          <stop offset="0%" stopColor="#1E1B4B" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The ground shadow stays put while the body floats above it — that
          separation is the entire reason the float reads as hovering. */}
      {full && <ellipse cx="64" cy="136" rx="28" ry="5" fill={url('ground')} />}

      <g className={anim(expression === 'happy' ? 'mascot-cheer' : 'mascot-float')}>
        {full && (
          <>
            {/* ── hands ── mitts, no jointed arm: an elbow at this size is a
                grey smudge. They tuck a few px BEHIND the torso rather than
                floating clear of it — a gap reads as two eggs parked next to
                the robot. Filled with the darker ramp because they sit further
                from the key light than the chest does. */}
            <Hand
              cx={hands.l[0]}
              cy={hands.l[1]}
              fill={url('shellDark')}
              className={anim('mascot-hand-l')}
            />
            <Hand
              cx={hands.r[0]}
              cy={hands.r[1]}
              fill={url('shellDark')}
              // The free hand is the one that explains. During a reply it
              // sweeps; the rest of the time it just breathes.
              className={anim(expression === 'talking' ? 'mascot-gesture' : 'mascot-hand-r')}
            />

            {/* ── body ── narrower than the skull and dropped clear of the
                chin, so the shoulders read instead of hiding under the jaw. */}
            <rect
              x="36"
              y="92"
              width="56"
              height="38"
              rx="19"
              fill={url('shell')}
              stroke="#8B84C9"
              strokeWidth="0.8"
              strokeOpacity="0.3"
            />
            <ellipse cx="52" cy="101" rx="14" ry="6" transform="rotate(-14 52 101)" fill={url('gloss')} />
            <path
              d="M 91.5 104 L 91.5 111 A 19 19 0 0 1 72.5 130"
              fill="none"
              stroke={url('rim')}
              strokeWidth="2.6"
              strokeLinecap="round"
            />

            {/* chest core — the MathUp chevron, lit from inside */}
            <rect x="50" y="100" width="28" height="22" rx="11" fill={url('visor')} />
            <circle cx="64" cy="111" r="14" fill={url('coreGlow')} className={anim('mascot-pulse')} />
            <circle cx="64" cy="111" r="7" fill={url('eye')} />
            <path
              d="M 60.5 113 L 64 108.5 L 67.5 113"
              fill="none"
              stroke="#0C0A2E"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
            />

            {/* Violet collar. Without a coloured joint the pearl head and the
                pearl torso merge into one blob at small sizes. */}
            <ellipse cx="64" cy="92" rx="16" ry="5.5" fill={url('pod')} />
            <ellipse cx="64" cy="90.5" rx="16" ry="4" fill={url('ao')} />
          </>
        )}

        <g
          transform={tilt ? `rotate(${tilt} 64 94)` : undefined}
          className={anim(tilt ? '' : 'mascot-sway')}
        >
          {/* ── neck ── */}
          <rect x="56" y="82" width="16" height="12" rx="6" fill="#3B3480" />
          <rect x="56" y="82" width="16" height="4.5" rx="2.2" fill="#0C0A2E" opacity="0.45" />

          {/* ── skull ── a squircle, not a circle: rx ≠ ry gives it a jaw. */}
          <rect
            x="30"
            y="20"
            width="68"
            height="68"
            rx="25"
            ry="24"
            fill={url('shell')}
            stroke="#8B84C9"
            strokeWidth="0.8"
            strokeOpacity="0.35"
          />
          <ellipse cx="53" cy="34" rx="18" ry="9" transform="rotate(-16 53 34)" fill={url('gloss')} />
          <ellipse cx="64" cy="86" rx="23" ry="8" fill={url('bounce')} />
          {/* The arc is the rect's own bottom-right corner (same rx/ry), so the
              rim sits exactly on the silhouette instead of near it. */}
          <path
            d="M 98 56 L 98 64 A 25 24 0 0 1 73 88"
            fill="none"
            stroke={url('rim')}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* occlusion where the ear cups tuck under the skull */}
          <ellipse cx="34" cy="60" rx="6" ry="9" fill={url('ao')} />
          <ellipse cx="94" cy="60" rx="6" ry="9" fill={url('ao')} />

          {/* ── face screen ── */}
          <rect x="39" y="34" width="50" height="36" rx="16" fill={url('visor')} />
          <g clipPath={url('visorClip')}>
            <ellipse cx="55" cy="36" rx="24" ry="10" transform="rotate(-7 55 36)" fill={url('visorGloss')} />
            <ellipse cx="64" cy="73" rx="23" ry="7" fill={accent} opacity="0.14" />
          </g>
          <rect
            x="39"
            y="34"
            width="50"
            height="36"
            rx="16"
            fill="none"
            stroke={url('visorEdge')}
            strokeWidth="1.2"
          />

          <Brows expression={expression} accent={accent} />
          <Eyes expression={expression} eye={url('eye')} glow={url('eyeGlow')} animate={animate} />
          <Mouth expression={expression} accent={accent} animate={animate} />

          {/* ── the headset ── an exact semicircle on (64,58) r=40, so the
              band's apex clears the crown by 2px and its ends land dead centre
              on the ear cups. Drawn after the skull so it sits ON the head. */}
          <path
            d="M 24 58 A 40 40 0 0 1 104 58"
            fill="none"
            stroke={url('pod')}
            strokeWidth="7"
            strokeLinecap="round"
          />
          {!compact && (
            <path
              d="M 27 52 A 37 37 0 0 1 101 52"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeOpacity="0.4"
              strokeLinecap="round"
            />
          )}
          <EarCup cx={24} pod={url('pod')} visor={url('visor')} eye={url('eye')} accent={accent} alert={alert} animate={animate} />
          <EarCup cx={104} pod={url('pod')} visor={url('visor')} eye={url('eye')} accent={accent} alert={alert} animate={animate} />

          {/* ── mic boom ── the single detail that turns "a robot" into "a
              robot doing a job". First thing dropped when compact. */}
          {!compact && (
            <g className={anim(expression === 'talking' ? 'mascot-pulse' : '')}>
              <path
                d="M 25 70 Q 27 82 42 79"
                fill="none"
                stroke="#6D28D9"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <rect
                x="40.5"
                y="75.5"
                width="9"
                height="5.5"
                rx="2.75"
                transform="rotate(-8 45 78.5)"
                fill={url('eye')}
              />
            </g>
          )}

          {/* Thinking dots trail off the top corner — the only cue that says
              "I went to the model" without a spinner. */}
          {expression === 'thinking' && (
            <g fill="#22D3EE">
              <circle cx="96" cy="24" r="2" className={anim('mascot-think')} style={{ animationDelay: '0ms' }} />
              <circle cx="103" cy="17" r="2.4" className={anim('mascot-think')} style={{ animationDelay: '180ms' }} />
              <circle cx="110" cy="11" r="2.8" className={anim('mascot-think')} style={{ animationDelay: '360ms' }} />
            </g>
          )}

          {expression === 'happy' && (
            <>
              <Sparkle cx={24} cy={36} r={5} className={anim('mascot-sparkle')} delay="220ms" />
              <Sparkle cx={106} cy={30} r={6.5} className={anim('mascot-sparkle')} delay="0ms" />
            </>
          )}

          {/* The one thing that has to be unmissable at 56px on the launcher:
              something went wrong and it noticed. */}
          {alert && (
            <g className={anim('mascot-alert')}>
              <circle cx="104" cy="24" r="11" fill={url('coreGlow')} />
              <circle cx="104" cy="24" r="7.5" fill="#FBBF24" />
              <path
                d="M 104 20 L 104 25"
                stroke="#0C0A2E"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.8"
              />
              <circle cx="104" cy="28" r="1.3" fill="#0C0A2E" opacity="0.8" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

function Hand({ cx, cy, fill, className }: { cx: number; cy: number; fill: string; className: string }) {
  // No inline transform-origin: the animation classes set `transform-box:
  // fill-box`, which makes `transform-origin: center` mean this hand's own
  // centre. An absolute origin here would then be measured from the hand's
  // bounding box instead of the viewBox and fling it off-screen.
  return (
    <g className={className}>
      <circle cx={cx} cy={cy} r="9" fill={fill} stroke="#8B84C9" strokeWidth="0.8" strokeOpacity="0.35" />
      <circle cx={cx - 3} cy={cy - 3.5} r="3" fill="#FFFFFF" opacity="0.5" />
    </g>
  );
}

/** Headphone cup. Violet mass, lit centre — it looks awake from behind. */
function EarCup({
  cx,
  pod,
  visor,
  eye,
  accent,
  alert,
  animate,
}: {
  cx: number;
  pod: string;
  visor: string;
  eye: string;
  accent: string;
  alert: boolean;
  animate: boolean;
}) {
  return (
    <g>
      <circle cx={cx} cy="60" r="11" fill={pod} />
      <circle cx={cx} cy="60" r="7.5" fill={visor} />
      <circle
        cx={cx}
        cy="60"
        r="8.4"
        fill="none"
        stroke={accent}
        strokeWidth="1.3"
        opacity="0.85"
        className={animate && alert ? 'mascot-pulse' : ''}
      />
      <circle cx={cx} cy="60" r="2.8" fill={eye} />
      <circle cx={cx - 3.5} cy="56.5" r="2.4" fill="#FFFFFF" opacity="0.4" />
    </g>
  );
}

/**
 * Brows. The cheapest expressiveness in the whole component and the reason
 * this reads as a character rather than a face-shaped screen: a 3px bar
 * rotated 10° is the difference between "concerned" and "concentrating".
 *
 * Sign convention, because it is easy to get backwards and ship a robot that
 * looks angry at a student who made a mistake: SVG rotates clockwise, so a
 * NEGATIVE angle lifts a bar's right end. Inner ends up = sympathy. Inner ends
 * down = a frown. The left eye's inner end is its right end, and vice versa.
 */
function Brows({ expression, accent }: { expression: MascotExpression; accent: string }) {
  const set: Partial<Record<MascotExpression, [number, number, number, number]>> = {
    // [left angle, left y, right angle, right y]
    oops: [-11, 38.5, 11, 38.5], // inner ends up — worried WITH you
    thinking: [9, 39.5, -9, 39.5], // inner ends down — concentrating
    curious: [0, 36, 7, 39.5], // one raised — quizzical
  };
  const v = set[expression];
  if (!v) return null;
  const [la, ly, ra, ry] = v;
  const bar = (cx: number, angle: number, y: number) => (
    <rect
      x={cx - 6.5}
      y={y}
      width="13"
      height="2.6"
      rx="1.3"
      fill={accent}
      opacity="0.9"
      transform={`rotate(${angle} ${cx} ${y + 1.3})`}
    />
  );
  return (
    <>
      {bar(54, la, ly)}
      {bar(74, ra, ry)}
    </>
  );
}

/** The eyes carry the performance. Everything else is lighting. */
function Eyes({
  expression,
  eye,
  glow,
  animate,
}: {
  expression: MascotExpression;
  eye: string;
  glow: string;
  animate: boolean;
}) {
  // Screen-left is the student's right. In a Hebrew RTL app the tutor looks
  // toward the text it is reading, which is screen-right.
  const shift = expression === 'thinking' ? 2.5 : 0;
  const rise = expression === 'thinking' ? -1.5 : 0;

  const one = (cx: number, wide: boolean) => {
    if (expression === 'happy') {
      // A ∩ arc — a closed, smiling eye. Two of them beat any mouth.
      return (
        <path
          key={cx}
          d={`M ${cx - 7.5} 54 Q ${cx} 44.5 ${cx + 7.5} 54`}
          fill="none"
          stroke={eye}
          strokeWidth="4.2"
          strokeLinecap="round"
        />
      );
    }
    // A thinking eye narrows; it does not close. Below ~12 it stops reading as
    // "working on it" and starts reading as asleep — checked in the raster.
    const h = expression === 'thinking' ? 12.5 : expression === 'oops' ? 13 : wide ? 17 : 15;
    const y = 51 + rise - h / 2;
    return (
      <g key={cx}>
        <rect x={cx + shift - 6.5} y={y} width="13" height={h} rx="6.5" fill={eye} />
        <circle cx={cx + shift - 2} cy={y + 3.5} r="2" fill="#FFFFFF" opacity="0.85" />
      </g>
    );
  };

  return (
    <>
      {/* The glow lives outside the blinking group — a closed eye should still
          light the visor around it, and blinking a radial gradient down to
          zero height looks like a fault, not a blink. */}
      <circle cx={54 + shift} cy={51 + rise} r="11" fill={glow} />
      <circle cx={74 + shift} cy={51 + rise} r="11" fill={glow} />
      <g className={animate && expression !== 'happy' ? 'mascot-glance' : ''}>
        <g className={animate && expression !== 'happy' ? 'mascot-blink' : ''}>
          {one(54, expression === 'curious')}
          {one(74, false)}
        </g>
      </g>
    </>
  );
}

function Mouth({
  expression,
  accent,
  animate,
}: {
  expression: MascotExpression;
  accent: string;
  animate: boolean;
}) {
  // 'happy' says everything through the eyes; a mouth there is one signal too
  // many and tips the character into cartoon.
  if (expression === 'happy') return null;

  const d =
    expression === 'thinking'
      ? 'M 58.5 64 L 69.5 64'
      : expression === 'oops'
        ? // A small flat-then-lifted line: "hm — ok, let's look."
          'M 57.5 64.5 Q 62 62.5 64.5 64.5 Q 67 66.5 70.5 63.5'
        : expression === 'curious'
          ? 'M 58 63 Q 64 67 70 62.5'
          : 'M 57.5 62.5 Q 64 67.5 70.5 62.5';

  return (
    <path
      d={d}
      fill="none"
      stroke={accent}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.9"
      className={animate && expression === 'talking' ? 'mascot-talk' : ''}
    />
  );
}

/** Four-point star. Two of them, twinkling out of phase, are the whole
    celebration — confetti at 56px is a smear. */
function Sparkle({
  cx,
  cy,
  r,
  className,
  delay,
}: {
  cx: number;
  cy: number;
  r: number;
  className: string;
  delay: string;
}) {
  return (
    <path
      d={`M ${cx} ${cy - r} Q ${cx + r * 0.22} ${cy - r * 0.22} ${cx + r} ${cy}
          Q ${cx + r * 0.22} ${cy + r * 0.22} ${cx} ${cy + r}
          Q ${cx - r * 0.22} ${cy + r * 0.22} ${cx - r} ${cy}
          Q ${cx - r * 0.22} ${cy - r * 0.22} ${cx} ${cy - r} Z`}
      fill="#FDE68A"
      className={className}
      style={{ animationDelay: delay }}
    />
  );
}
