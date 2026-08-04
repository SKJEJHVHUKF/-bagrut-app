/**
 * verify-ghost.ts — integrity gate for the Ghost Replay content.
 *
 *   npx tsx scripts/verify-ghost.ts            (errors fail, warnings print)
 *   npx tsx scripts/verify-ghost.ts --strict   (warnings fail too)
 *
 * WHAT THIS PROVES, AND WHAT IT DOES NOT
 * It proves the walkthrough is STRUCTURALLY SOUND: every step is reachable,
 * every fork has exactly one right answer, every wrong option has somewhere to
 * go, and every `mistakeCategory` names a misconception that actually exists in
 * content/cognition.
 *
 * The check that matters most is `branch-on-correct-option`. A branch attached
 * to the RIGHT answer would tell a student who reasoned correctly that their
 * road breaks — the worst thing this feature could possibly do, and invisible
 * to a human proof-reader once a file has twenty options in it.
 *
 * It cannot tell you the mathematics is right or that a distractor is a
 * mistake a real student makes. That came from deriving the problem by hand,
 * twice, and it is the only way to re-check it.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ghostEntries } from '../content/ghost-replay';
import type { GhostReplay, TopicGhostReplays } from '../content/ghost-replay/types';
import { getCognitionMap } from '../content/cognition';
import { getQuestions, getSubTopic, getSubTopics } from '../content/lessons';
import { seededOrder } from '../lib/shuffle';

const STRICT = process.argv.includes('--strict');

/** Below this a "walkthrough" is a quiz with extra steps. */
const MIN_STEPS = 4;
/** A fork with two options is a coin toss, not a decision. */
const MIN_OPTIONS = 3;
/** CommitPrompt's Hebrew letter table has five entries; past that a row ships
 *  with a bare "." and no label. */
const MAX_OPTIONS = 5;

type Finding = { level: 'error' | 'warn'; rule: string; where: string; detail: string };
const findings: Finding[] = [];
const err = (rule: string, where: string, detail: string) =>
  findings.push({ level: 'error', rule, where, detail });
const warn = (rule: string, where: string, detail: string) =>
  findings.push({ level: 'warn', rule, where, detail });

/** Every question id the content bank knows, including lesson micro-drills. */
function questionIds(subject: string, topic: string): Set<string> {
  const ids = new Set<string>();
  for (const st of getSubTopics(subject, topic)) {
    for (const q of st.questions ?? []) ids.add(q.id);
    for (const step of st.lesson ?? []) if (step.drill) ids.add(step.drill.id);
  }
  for (const q of getQuestions(subject, topic)) ids.add(q.id);
  return ids;
}

function verifyReplay(map: TopicGhostReplays, replay: GhostReplay, bankIds: Set<string>) {
  const where = `${map.subject}:${map.topic}/${replay.id}`;
  const cognition = getCognitionMap(map.subject, map.topic);
  const knownMisconceptions = new Set((cognition?.misconceptions ?? []).map((m) => m.id));

  if (replay.subject !== map.subject || replay.topic !== map.topic) {
    err('replay-registry-mismatch', where, `${replay.subject}:${replay.topic}`);
  }
  if (!getSubTopic(map.subject, map.topic, replay.subTopicId)) {
    err('unknown-subtopic', where, replay.subTopicId);
  }
  if (!bankIds.has(replay.questionId)) {
    err('unknown-question', where, replay.questionId + ' is not in the content bank');
  } else {
    // Belonging to the TOPIC is not enough: a replay that walks a question from
    // a different sub-topic would sit on the wrong rung entirely, and the flat
    // id pool could never notice.
    const own = getSubTopic(map.subject, map.topic, replay.subTopicId);
    const inOwn =
      !!own &&
      ((own.questions ?? []).some((q) => q.id === replay.questionId) ||
        (own.lesson ?? []).some((st) => st.drill?.id === replay.questionId));
    if (!inOwn) {
      err(
        'question-outside-subtopic',
        where,
        replay.questionId + ' exists, but not inside ' + replay.subTopicId,
      );
    }
  }
  for (const [field, value] of [
    ['title', replay.title],
    ['prompt', replay.prompt],
    ['closing', replay.closing],
  ] as [string, string][]) {
    if (!value || !value.trim()) err('empty-field', where, field + ' is blank');
  }
  if (replay.steps.length < MIN_STEPS) {
    err('too-few-steps', where, `${replay.steps.length} < ${MIN_STEPS}`);
  }

  replay.steps.forEach((step, i) => {
    const at = `${where}#step${i + 1}`;

    if (step.stepNumber !== i + 1) {
      err('step-number-mismatch', at, `stepNumber=${step.stepNumber}, position=${i + 1}`);
    }

    const options = step.commitPrompt.options;
    if (options.length < MIN_OPTIONS) {
      err('too-few-options', at, `${options.length} < ${MIN_OPTIONS}`);
    }

    // The renderer's letter table (CommitPrompt LETTERS) holds five entries; a
    // sixth option would ship with a bare "." and no label.
    if (options.length > MAX_OPTIONS) {
      err('too-many-options', at, `${options.length} > ${MAX_OPTIONS} (the letter table runs out)`);
    }

    const ids = new Set<string>();
    const texts = new Set<string>();
    for (const o of options) {
      if (ids.has(o.id)) err('duplicate-option-id', at, o.id);
      ids.add(o.id);
      // Two options reading identically — one right, one wrong — is
      // unanswerable on screen, and id-deduplication does not catch it.
      const t = o.text.trim();
      if (!t) err('empty-option-text', at, `${o.id} has no text`);
      else if (texts.has(t)) err('duplicate-option-text', at, `${o.id}: "${t.slice(0, 40)}"`);
      texts.add(t);
      if (o.mistakeCategory && !knownMisconceptions.has(o.mistakeCategory)) {
        err('unknown-mistake-category', at, `${o.id} → ${o.mistakeCategory}`);
      }
      if (o.isCorrect && o.mistakeCategory) {
        err('mistake-category-on-correct', at, `${o.id} is correct but names a misconception`);
      }
    }

    const correct = options.filter((o) => o.isCorrect);
    if (correct.length !== 1) {
      err('correct-option-count', at, `${correct.length} options marked correct, expected exactly 1`);
    }

    // --- branches ---
    const byOption = new Map<string, number>();
    for (const b of step.branches) {
      byOption.set(b.optionId, (byOption.get(b.optionId) ?? 0) + 1);
      if (!ids.has(b.optionId)) {
        err('branch-unknown-option', at, b.optionId);
        continue;
      }
      const option = options.find((o) => o.id === b.optionId)!;
      // THE one. A branch on the right answer would walk a student who
      // reasoned correctly through why their reasoning fails.
      if (option.isCorrect) {
        err('branch-on-correct-option', at, `${b.optionId} IS the correct option`);
      }
      if (!b.whyItFails.trim() || !b.backOnTrack.trim()) {
        err('branch-empty', at, `${b.optionId} is missing whyItFails or backOnTrack`);
      }
    }
    for (const [optionId, n] of byOption) {
      if (n > 1) err('duplicate-branch', at, `${optionId} has ${n} branches`);
    }
    for (const o of options) {
      if (!o.isCorrect && !byOption.has(o.id)) {
        // A dead end: the student picks it and the walkthrough has nothing to say.
        err('missing-branch', at, `wrong option ${o.id} has no failure branch`);
      }
    }

    // The gate used to check 4 of the ~11 authored text fields, so a step with
    // a blank commit question shipped a gate that asks nothing, with 0 errors.
    const required: [string, string][] = [
      ['reveal', step.reveal],
      ['coreLogic', step.coreLogic],
      ['title', step.title],
      ['commitPrompt.question', step.commitPrompt.question],
    ];
    if (step.examinerTrap) {
      required.push(['examinerTrap.warning', step.examinerTrap.warning]);
      required.push(['examinerTrap.description', step.examinerTrap.description]);
    }
    for (const [field, value] of required) {
      if (!value || !value.trim()) err('empty-field', at, field + ' is blank');
    }
  });

  const trapped = replay.steps.filter((s) => s.examinerTrap).length;
  if (trapped === 0) {
    warn('no-examiner-traps', where, 'no step flags a matriculation pitfall');
  }
  if (trapped === replay.steps.length) {
    warn('all-steps-trapped', where, 'a red flag on every step is a red flag on none');
  }
}

/**
 * Where the correct option actually LANDS on screen.
 *
 * Options are authored correct-first for readability and scattered at render
 * time with `seededOrder(n, '<replayId>-<stepNumber>')` — the same convention,
 * and the same seed shape, as the question bank. That second half is easy to
 * forget, and forgetting it is not a cosmetic bug: the bank once shipped 428
 * questions written `correct: 0`, and a student who always pressed א scored
 * ~97% without knowing any mathematics.
 *
 * So this replays the REAL seeds and reports where the correct answer ends up.
 * With few steps a perfectly flat spread is not expected; a slot holding
 * everything is the signal that the shuffle is gone.
 */
function shuffleBalance(maps: TopicGhostReplays[]) {
  const slots = new Map<number, number>();
  let total = 0;
  for (const map of maps) {
    for (const replay of map.replays) {
      // Per-replay too, not just in aggregate: with several replays a single
      // collapsed one would hide inside a healthy overall spread, and a
      // student only ever sees one replay at a time.
      const perReplay = new Set<number>();
      let steps = 0;
      for (const step of replay.steps) {
        const opts = step.commitPrompt.options;
        const correctIdx = opts.findIndex((o) => o.isCorrect);
        if (correctIdx < 0) continue;
        // MUST match the seed built in GhostReplayLevel.
        const order = seededOrder(
          opts.length,
          `${step.stepNumber}-${replay.id}-${step.commitPrompt.question}`,
        );
        const slot = order.indexOf(correctIdx);
        slots.set(slot, (slots.get(slot) ?? 0) + 1);
        perReplay.add(slot);
        steps += 1;
        total += 1;
      }
      if (steps >= 3 && perReplay.size === 1) {
        err(
          'shuffle-collapsed',
          `${map.subject}:${map.topic}/${replay.id}`,
          `all ${steps} correct answers land in the same slot — a student would learn the position, not the maths`,
        );
      }
    }
  }
  if (total === 0) return;

  const letters = ['א', 'ב', 'ג', 'ד', 'ה'];
  const parts = [...slots.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([slot, n]) => `${letters[slot] ?? slot}=${n} (${Math.round((n / total) * 100)}%)`);
  console.log(`  correct answer lands on:  ${parts.join('  ')}   [${total} steps]\n`);

  const worst = Math.max(...slots.values());
  if (slots.size === 1 && total > 1) {
    err(
      'shuffle-missing',
      'all topics',
      `every correct answer lands in the SAME slot across ${total} steps — the render-time shuffle is not being applied`,
    );
  } else if (total >= 8 && worst / total > 0.5) {
    warn(
      'shuffle-skewed',
      'all topics',
      `one slot holds ${Math.round((worst / total) * 100)}% of correct answers`,
    );
  }
}

/**
 * SOFT BREAKS — two authored lines that markdown silently merges into one.
 *
 * MathText runs react-markdown with remarkMath + remarkGfm and nothing else.
 * Neither turns a single newline into a line break, and no CSS sets
 * `white-space: pre-wrap`, so per CommonMark a lone newline inside a paragraph
 * is a SOFT break and renders as a space. Authoring
 *
 *     חלק ממשי: $x^2 - y^2 = x$
 *     חלק מדומה: $2xy = -y$
 *
 * therefore ships as one run-on line, which is worst exactly where it matters
 * most — a step whose teaching point is that there are two separate cases.
 * Seven of these shipped in the first draft and none was visible in review.
 *
 * This parses the real source with the real parser rather than grepping: a
 * paragraph whose mdast node spans more than one line and contains no explicit
 * `break` child is a soft break. Fix by making the lines a `- ` list (remarkGfm
 * is on) or by separating them with a blank line.
 */
function checkSoftBreaks() {
  // Required lazily so the rest of the gate still runs if remark is unavailable.
  /* eslint-disable @typescript-eslint/no-require-imports */
  let unified: typeof import('unified').unified;
  let remarkParse: unknown;
  let remarkMath: unknown;
  let remarkGfm: unknown;
  try {
    unified = (require('unified') as typeof import('unified')).unified;
    remarkParse = require('remark-parse').default ?? require('remark-parse');
    remarkMath = require('remark-math').default ?? require('remark-math');
    remarkGfm = require('remark-gfm').default ?? require('remark-gfm');
  } catch {
    warn('softbreak-check-skipped', 'all topics', 'remark not resolvable from scripts/');
    return;
  }
  /* eslint-enable @typescript-eslint/no-require-imports */

  const proc = unified()
    .use(remarkParse as never)
    .use(remarkMath as never)
    .use(remarkGfm as never);

  for (const rel of readdirSync('content/ghost-replay/math5').map((f) =>
    join('content/ghost-replay/math5', f),
  )) {
    if (!rel.endsWith('.ts')) continue;
    const src = readFileSync(rel, 'utf8');
    const re = /`(?:[^`\\]|\\[\s\S])*`/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      const raw = m[0].slice(1, -1);
      if (!raw.includes('\n')) continue;
      const startLine = src.slice(0, m.index).split('\n').length;
      const text = raw.replace(/\\`/g, '`').replace(/\\\\/g, '\\');
      const tree = proc.parse(text) as { children?: unknown[] };
      const authored = text.split('\n');
      const visit = (node: Record<string, unknown>) => {
        if (node.type === 'paragraph') {
          const pos = node.position as { start: { line: number }; end: { line: number } };
          const spans = pos.end.line > pos.start.line;
          const hasBreak = JSON.stringify(node).includes('"type":"break"');
          if (spans && !hasBreak) {
            err(
              'markdown-soft-break',
              `${rel}:${startLine + pos.start.line - 1}`,
              `these ${pos.end.line - pos.start.line + 1} authored lines render as ONE: ` +
                `"${authored[pos.start.line - 1].slice(0, 40)}…" + "${authored[pos.start.line].slice(0, 40)}…"`,
            );
          }
        }
        for (const c of (node.children as Record<string, unknown>[]) ?? []) visit(c);
      };
      visit(tree as Record<string, unknown>);
    }
  }
}

function main() {
  const maps = ghostEntries();
  console.log(`verify-ghost — ${maps.length} topic(s)\n`);
  checkSoftBreaks();

  const rows: string[][] = [['topic', 'sub-topic', 'replay', 'steps', 'forks', 'branches', 'traps']];

  for (const map of maps) {
    const bankIds = questionIds(map.subject, map.topic);
    const seen = new Set<string>();
    for (const replay of map.replays) {
      if (seen.has(replay.id)) err('duplicate-replay-id', map.topic, replay.id);
      seen.add(replay.id);
      verifyReplay(map, replay, bankIds);
      rows.push([
        map.topic,
        replay.subTopicId,
        replay.id,
        String(replay.steps.length),
        String(replay.steps.reduce((n, s) => n + s.commitPrompt.options.length, 0)),
        String(replay.steps.reduce((n, s) => n + s.branches.length, 0)),
        String(replay.steps.filter((s) => s.examinerTrap).length),
      ]);
    }

    // Coverage: which sub-topics still have no walkthrough. This is the worklist.
    const covered = new Set(map.replays.map((r) => r.subTopicId));
    for (const st of getSubTopics(map.subject, map.topic)) {
      if (!covered.has(st.id)) {
        warn('subtopic-uncovered', `${map.subject}:${map.topic}`, `${st.id} has no ghost replay yet`);
      }
    }
  }

  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  for (const [n, r] of rows.entries()) {
    console.log('  ' + r.map((c, i) => c.padEnd(widths[i])).join('  '));
    if (n === 0) console.log('  ' + widths.map((w) => '-'.repeat(w)).join('  '));
  }
  console.log('');
  shuffleBalance(maps);

  const errors = findings.filter((f) => f.level === 'error');
  const warns = findings.filter((f) => f.level === 'warn');
  for (const f of [...errors, ...warns]) {
    console.log(`${f.level === 'error' ? 'ERROR' : 'warn '}  ${f.rule.padEnd(28)} ${f.where}  ${f.detail}`);
  }

  console.log(`\n${errors.length} error(s), ${warns.length} warning(s)`);
  console.log(
    'NOTE: structure only. Whether the maths is right, and whether a distractor is\n' +
      '      a mistake a real student makes, still has to be re-derived by hand.',
  );

  if (errors.length > 0 || (STRICT && warns.length > 0)) process.exit(1);
}

main();
