/**
 * measure-topic-cards.ts — what the authored Topic Cards are worth if the
 * compiler flag is switched on, and what they cost if the match is wrong.
 *
 *   npx tsx scripts/measure-topic-cards.ts
 *
 * FREE. Every layer it exercises is local; no API call happens anywhere below.
 *
 * ============================================================
 * WHAT IS BEING MEASURED, AND WHY IT IS NOT `measure-quiz-gap`
 * ============================================================
 * `measure-quiz-gap` calls `compileTutorResponse` DIRECTLY, so its number is
 * what a student gets when the layer runs. lib/tutor-flags.ts already carries
 * the warning about that: the layer sits behind `tutorFlag('compiler')`, which
 * is false for every student today, so a number measured past the flag is
 * right about the code and wrong about the product.
 *
 * This script measures through `runTutorChain`, the function both surfaces
 * actually call, with the flag in the two positions that matter:
 *
 *   OFF  NEXT_PUBLIC_TUTOR_COMPILER=off — the kill switch
 *   ON   the shipped default since the rollout was approved
 *
 * The DELTA between them is the whole payoff of turning it on. Anything the
 * chain already answers from a layer above the compiler is not a gain, and
 * counting it as one is how a rollout gets justified by work already done.
 *
 * ============================================================
 * TWO SCREENS, BECAUSE THE TOPIC COMES FROM THE SCREEN
 * ============================================================
 * `cardTopic = focus?.topic || screenTopic || resolveTopic(text)`. With no
 * screen and no focus the topic has to be recovered from the student's own
 * sentence, and most card aliases do not name their topic. So the same alias
 * is run twice more:
 *
 *   NO TOPIC     focus: null, screenTopic: ''   — /chat with no ?topic=
 *   OWN TOPIC    focus: null, screenTopic: <the card's topic>
 *
 * ============================================================
 * THE RISK HALF
 * ============================================================
 * Conventions taken from lib/tutor-faq.ts and lib/tutor-chain.ts, so the
 * numbers are comparable to the ones already in the tree: the per-question
 * bank measured 26.8% reach for 5.6% wrong answers and was REJECTED on those
 * numbers; the topic bank measured 49.6% for 1.0% from another unit, and the
 * general bank 48.4% for 0.0% from the wrong topic, and both shipped.
 *
 * "Wrong topic" here means: the compiler served a card, and the card's own
 * `topic` field is not the topic the alias was authored under.
 */

// ---- a localStorage, so planAnswer and tutorFlag do not throw ---------------
// Verbatim from scripts/test-tracking-sync.ts. Every runtime import below is
// dynamic and therefore evaluated AFTER this, so the shim is in place before
// any module reads `window`.
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  },
  dispatchEvent: () => true,
};

import type { TopicCard } from '../content/topic-cards/types';

// tsx compiles these scripts to CJS, where top-level await is a transform
// error. One async main, called at the bottom.
async function main(): Promise<void> {
const { runTutorChain, emptyChainState } = await import('../lib/tutor-chain');
const { renderTopicCard } = await import('../lib/topic-cards');

const BANKS: Array<{ topic: string; cards: TopicCard[] }> = [
  { topic: 'הסתברות', cards: (await import('../content/topic-cards/math5/probability')).default },
  { topic: 'סדרות', cards: (await import('../content/topic-cards/math5/sequences')).default },
];

// ⚠️ THE ENV VAR AND NOT THE localStorage KEY. `tutorFlag` reads
// `process.env.NEXT_PUBLIC_TUTOR_COMPILER` on every call (envDefault is not
// memoised), so flipping it between passes needs no re-import. It is also the
// switch under evaluation: the localStorage key is a per-browser override that
// no student holds.
function setFlag(on: boolean): void {
  // ⚠️ BOTH DIRECTIONS ARE SET EXPLICITLY. The OFF pass used to `delete` the
  // variable, which was "off" only while envDefault read `=== 'on'`. The
  // rollout flipped it to `!== 'off'`, so deleting now means ON and this
  // script quietly reported two identical passes labelled OFF and ON —
  // the same shape of wrong measurement that hid the dark cards in the first
  // place. Never infer a flag state from an absent variable.
  process.env.NEXT_PUBLIC_TUTOR_COMPILER = on ? 'on' : 'off';
}

/** Which card produced this text, if any. Exact, because renderTopicCard is
 *  deterministic — no scoring a rendered string back to a card. */
const byRendered = new Map<string, { topic: string; id: string }>();
for (const { topic, cards } of BANKS) {
  for (const c of cards) {
    if (c.approved) byRendered.set(renderTopicCard(c), { topic, id: c.id });
  }
}

type Ran = { answered: boolean; layer: string; topic: string; card: { topic: string; id: string } | null };

async function run(message: string, screenTopic: string): Promise<Ran> {
  const res = await runTutorChain({
    message,
    focus: null,
    screenTopic,
    state: emptyChainState(),
  });
  if (!res.answered) return { answered: false, layer: '-', topic: res.topic, card: null };
  return {
    answered: true,
    layer: res.layer,
    topic: res.topic,
    card: byRendered.get(res.text) ?? null,
  };
}

const pct = (n: number, d: number) => (d === 0 ? '  n/a' : `${((100 * n) / d).toFixed(1)}%`);
const pad = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - [...s].length));

// ============================================================
// 1. inventory
// ============================================================
console.log('\n=== INVENTORY ===\n');
console.log(pad('topic', 12) + pad('cards', 8) + pad('approved', 10) + pad('aliases', 9) + 'aliases/card');
let totCards = 0, totApproved = 0, totAliases = 0;
for (const { topic, cards } of BANKS) {
  const approved = cards.filter((c) => c.approved);
  const aliases = approved.reduce((n, c) => n + c.aliases.length, 0);
  totCards += cards.length; totApproved += approved.length; totAliases += aliases;
  console.log(
    pad(topic, 12) + pad(String(cards.length), 8) + pad(String(approved.length), 10) +
    pad(String(aliases), 9) + (approved.length ? (aliases / approved.length).toFixed(1) : '-'),
  );
}
console.log(pad('TOTAL', 12) + pad(String(totCards), 8) + pad(String(totApproved), 10) + pad(String(totAliases), 9));

// ============================================================
// 2. payoff — every approved alias, flag off vs flag on
// ============================================================
type Probe = { topic: string; cardId: string; alias: string };
const probes: Probe[] = BANKS.flatMap(({ topic, cards }) =>
  cards.filter((c) => c.approved).flatMap((c) => c.aliases.map((alias) => ({ topic, cardId: c.id, alias }))),
);

for (const screen of ['', 'own'] as const) {
  const label = screen === '' ? 'NO TOPIC ON SCREEN (screenTopic: "")' : 'OWN TOPIC ON SCREEN (screenTopic: the card\'s topic)';
  console.log(`\n=== PAYOFF — ${label} ===\n`);

  const layersOff = new Map<string, number>();
  const layersOn = new Map<string, number>();
  const gained: Array<Probe & { layer: string; card: { topic: string; id: string } | null }> = [];
  let offHits = 0, onHits = 0, wrongTopic = 0, compilerNonCard = 0;

  for (const p of probes) {
    const st = screen === '' ? '' : p.topic;

    setFlag(false);
    const off = await run(p.alias, st);
    if (off.answered) { offHits++; layersOff.set(off.layer, (layersOff.get(off.layer) ?? 0) + 1); }

    setFlag(true);
    const on = await run(p.alias, st);
    if (on.answered) { onHits++; layersOn.set(on.layer, (layersOn.get(on.layer) ?? 0) + 1); }

    if (on.answered && !off.answered) gained.push({ ...p, layer: on.layer, card: on.card });
    if (on.layer === 'compiler') {
      if (!on.card) compilerNonCard++;
      else if (on.card.topic !== p.topic) wrongTopic++;
    }
  }

  console.log(`aliases probed        ${probes.length}`);
  console.log(`answered FREE, flag OFF   ${offHits}  (${pct(offHits, probes.length)})`);
  console.log(`answered FREE, flag ON    ${onHits}  (${pct(onHits, probes.length)})`);
  console.log(`DELTA                     +${onHits - offHits}  (+${pct(onHits - offHits, probes.length)})`);

  const show = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${pad(k, 22)}${v}`).join('\n') || '  (none)';
  console.log('\nwho answered, flag OFF:\n' + show(layersOff));
  console.log('\nwho answered, flag ON:\n' + show(layersOn));

  if (gained.length) {
    console.log('\nnewly answered (first 25):');
    for (const g of gained.slice(0, 25)) {
      const src = g.card ? `${g.card.topic}/${g.card.id}` : '(not a card)';
      const flag = g.card && g.card.topic !== g.topic ? '  ⚠️ WRONG TOPIC' : '';
      console.log(`  ${pad(g.layer, 14)}${pad(g.alias, 34)}→ ${src}${flag}`);
    }
    if (gained.length > 25) console.log(`  … and ${gained.length - 25} more`);
  }

  const compilerHits = layersOn.get('compiler') ?? 0;
  console.log(
    `\ncompiler served ${compilerHits} of ${probes.length} aliases; ` +
    `${wrongTopic} from the WRONG topic (${pct(wrongTopic, probes.length)} of all probes, ` +
    `${pct(wrongTopic, compilerHits)} of compiler hits); ${compilerNonCard} compiler hits were not a card at all.`,
  );
}

// ============================================================
// 3. risk — conversational fragments
// ============================================================
console.log('\n=== RISK — CONVERSATIONAL FRAGMENTS, FLAG ON ===\n');
const FRAGMENTS = ['החלק השני', 'תמשיך', 'לא ברור לי', 'אז מה', 'הבנתי את זה'];
setFlag(true);
console.log(pad('fragment', 16) + pad('screenTopic ""', 30) + 'screenTopic הסתברות');
for (const f of FRAGMENTS) {
  const bare = await run(f, '');
  const withTopic = await run(f, 'הסתברות');
  const fmt = (r: Ran) =>
    (r.answered ? r.layer : 'MODEL') + (r.card ? ` [${r.card.id}]` : '') + (r.layer === 'compiler' ? ' ⚠️' : '');
  console.log(pad(f, 16) + pad(fmt(bare), 30) + fmt(withTopic));
}

// ============================================================
// 4. risk — a question from the OTHER topic
// ============================================================
console.log('\n=== RISK — A QUESTION FROM ANOTHER TOPIC, FLAG ON ===\n');
const CROSS = [
  { msg: 'מה זה סדרה חשבונית', screen: 'הסתברות' },
  { msg: 'מה זה ההפרש בין איברים', screen: 'הסתברות' },
  { msg: 'מה זה בלי החזרה', screen: 'סדרות' },
  { msg: 'מה זה מאורעות זרים', screen: 'סדרות' },
  { msg: 'מה זה נגזרת', screen: 'הסתברות' },
  { msg: 'מה זה אינטגרל', screen: 'סדרות' },
];
for (const c of CROSS) {
  const r = await run(c.msg, c.screen);
  const src = r.card ? `${r.card.topic}/${r.card.id}` : '';
  console.log(
    pad(c.msg, 26) + pad(`on «${c.screen}»`, 16) +
    (r.answered ? r.layer : 'MODEL') + (src ? `  → ${src}` : '') + (r.layer === 'compiler' && r.card ? '  ⚠️ a card from the screen\'s topic' : ''),
  );
}

// ============================================================
// 5. risk — every alias fired at the OTHER topic's screen
// ============================================================
// Whatever the compiler serves here is wrong BY CONSTRUCTION: matchTopicCard
// only ever loads the screen's topic, so a hit is a card about a subject the
// student did not ask about. This is the number that decides the rollout.
console.log('\n=== RISK — EVERY ALIAS ON THE WRONG SCREEN, FLAG ON ===\n');
let crossProbes = 0, crossServed = 0, crossCompilerOther = 0;
const crossExamples: string[] = [];
for (const p of probes) {
  const other = BANKS.find((b) => b.topic !== p.topic)?.topic ?? '';
  if (!other) continue;
  crossProbes++;
  const r = await run(p.alias, other);
  if (r.layer !== 'compiler') continue;
  // A compiler hit with no card is still the compiler speaking on the wrong
  // screen — counted separately rather than dropped, because a hit that is not
  // a card is not automatically safe.
  if (!r.card) { crossCompilerOther++; continue; }
  crossServed++;
  if (crossExamples.length < 12) crossExamples.push(`  ${pad(p.alias, 34)}on «${other}» → ${r.card.id}`);
}
console.log(`${crossServed} of ${crossProbes} aliases (${pct(crossServed, crossProbes)}) got a CARD from the screen's topic when they asked about the other one.`);
console.log(`${crossCompilerOther} more (${pct(crossCompilerOther, crossProbes)}) got some other compiler answer on that wrong screen.`);
if (crossExamples.length) console.log(crossExamples.join('\n'));

// ============================================================
// 6. the menu's own items, sent back
// ============================================================
// lib/topic-overview.ts claims "a dead end becomes a fork with free branches":
// every item it lists is `card.aliases[0]` with a leading "מה זה" stripped, so a
// student who picks one should land on that card. Whether they DO is a
// measurement, not a claim — and it is the one the flag decides.
console.log('\n=== THE MENU\'S OWN ITEMS, SENT BACK ===\n');
const menuLabel = (a: string) => a.replace(/^\s*(?:מה\s*זה|מה\s*זו)\s*/, '').trim();
for (const { topic, cards } of BANKS) {
  const items = cards.filter((c) => c.approved && c.aliases?.length).map((c) => menuLabel(c.aliases[0])).filter(Boolean);
  let offAny = 0, offCard = 0, onAny = 0, onCard = 0;
  for (const it of items) {
    setFlag(false);
    const off = await run(it, topic);
    if (off.answered) offAny++;
    if (off.card) offCard++;
    setFlag(true);
    const on = await run(it, topic);
    if (on.answered) onAny++;
    if (on.card) onCard++;
  }
  console.log(
    `${pad(topic, 12)}${items.length} menu items — answered free: ${offAny} OFF / ${onAny} ON;  ` +
    `landed on their CARD: ${offCard} OFF / ${onCard} ON`,
  );
}

console.log('');
}

main();
