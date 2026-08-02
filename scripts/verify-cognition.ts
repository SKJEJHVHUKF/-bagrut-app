/**
 * verify-cognition.ts — integrity gate for the cognition catalog.
 *
 *   npx tsx scripts/verify-cognition.ts            (errors fail, warnings print)
 *   npx tsx scripts/verify-cognition.ts --strict   (warnings fail too)
 *
 * WHAT THIS CAN AND CANNOT TELL YOU
 * It proves the catalog is CONSISTENT WITH THE CONTENT: every skill referenced
 * exists, the prerequisite graph is acyclic, every trigger points at a real
 * MCQ option, and — the one that matters most — no trigger points at a CORRECT
 * option. That last check is the guard against the worst possible failure of
 * this feature: telling a student who answered correctly that they hold a
 * misconception.
 *
 * It cannot tell you the misconception is the RIGHT explanation for that
 * distractor. That judgement came from reading the authored `distractorNotes`
 * one by one, and re-reading them is the only way to re-check it. A green run
 * here means "nothing I examined is inconsistent", not "the pedagogy is right".
 */

import { cognitionEntries } from '../content/cognition';
import type { Skill, SkillId, TopicCognitionMap } from '../content/cognition/types';
import { getBagrutQuestions, getQuestions, getSubTopic, getSubTopics } from '../content/lessons';
import { buildSubTopicLevels } from '../lib/roadmap-levels';
import type { PracticeQuestion } from '../content/lessons/types';

const STRICT = process.argv.includes('--strict');

/** A topic below this many misconceptions is not a diagnostic layer yet. */
const MIN_MISCONCEPTIONS = 10;

type Finding = { level: 'error' | 'warn'; rule: string; where: string; detail: string };
const findings: Finding[] = [];
const err = (rule: string, where: string, detail: string) =>
  findings.push({ level: 'error', rule, where, detail });
const warn = (rule: string, where: string, detail: string) =>
  findings.push({ level: 'warn', rule, where, detail });

// ============================================================
// Question index straight from the content
// ============================================================
//
// Built here rather than imported from lib/cognition on purpose: a gate that
// asks the code under test what the content contains can only ever agree with
// itself.

type QInfo = {
  q: PracticeQuestion;
  subTopicId?: string;
  /** A bagrut sub-part rather than a bank question — open, never MCQ. */
  isBagrutPart?: boolean;
};

function questionIndex(subject: string, topic: string): Map<string, QInfo> {
  const index = new Map<string, QInfo>();
  for (const st of getSubTopics(subject, topic)) {
    for (const q of st.questions ?? []) index.set(q.id, { q, subTopicId: st.id });
    for (const step of st.lesson ?? []) {
      if (step.drill) index.set(step.drill.id, { q: step.drill, subTopicId: st.id });
    }
  }
  for (const q of getQuestions(subject, topic)) {
    if (!index.has(q.id)) index.set(q.id, { q });
  }
  // Bagrut parts, under the composite id QuestionPartCard actually records.
  // Wrapped in a PracticeQuestion-shaped stub so every downstream check
  // (kind, options, correct index) works on them unchanged — which is what
  // makes `trigger-not-mcq` reject a trigger aimed at a bagrut part.
  for (const bq of getBagrutQuestions(subject, topic)) {
    const sub = bq.subTopicId && bq.subTopicId !== 'capstone' ? bq.subTopicId : undefined;
    for (const part of bq.parts) {
      const id = `${bq.id}-${part.label}`;
      if (index.has(id)) {
        err('bagrut-part-id-collision', `${subject}:${topic}`, id);
        continue;
      }
      index.set(id, {
        q: {
          id,
          difficulty: bq.difficulty,
          kind: 'open',
          question: part.prompt,
          expected: part.expected,
          solution: { steps: part.solution.steps, finalAnswer: part.solution.final_answer, explanation: '' },
        },
        subTopicId: sub,
        isBagrutPart: true,
      });
    }
  }
  return index;
}

// ============================================================
// Graph checks
// ============================================================

/** Depth-first cycle detection over `prereqs`. Returns the first cycle found. */
function findCycle(skills: Skill[]): SkillId[] | null {
  const bySkill = new Map(skills.map((s) => [s.id, s]));
  const state = new Map<SkillId, 'open' | 'done'>();
  const stack: SkillId[] = [];

  function visit(id: SkillId): SkillId[] | null {
    const st = state.get(id);
    if (st === 'done') return null;
    if (st === 'open') return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, 'open');
    stack.push(id);
    for (const p of bySkill.get(id)?.prereqs ?? []) {
      if (!bySkill.has(p)) continue; // reported separately as an unknown prereq
      const cycle = visit(p);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(id, 'done');
    return null;
  }

  for (const s of skills) {
    const cycle = visit(s.id);
    if (cycle) return cycle;
  }
  return null;
}

// ============================================================
// Per-topic verification
// ============================================================

function verifyTopic(map: TopicCognitionMap) {
  const where = `${map.subject}:${map.topic}`;
  const questions = questionIndex(map.subject, map.topic);
  const skillIds = new Set(map.skills.map((s) => s.id));
  const subTopicIds = new Set(getSubTopics(map.subject, map.topic).map((s) => s.id));

  // ---- skills ----
  const seenSkill = new Set<string>();
  for (const s of map.skills) {
    if (seenSkill.has(s.id)) err('duplicate-skill-id', where, s.id);
    seenSkill.add(s.id);
    if (!subTopicIds.has(s.subTopicId)) {
      err('skill-unknown-subtopic', where, `${s.id} → ${s.subTopicId}`);
    }
    for (const p of s.prereqs) {
      if (!skillIds.has(p)) err('unknown-prereq', where, `${s.id} → ${p}`);
      if (p === s.id) err('self-prereq', where, s.id);
    }
  }

  const cycle = findCycle(map.skills);
  if (cycle) err('prereq-cycle', where, cycle.join(' → '));

  // ---- question → skills ----
  for (const [qid, ids] of Object.entries(map.questionSkills)) {
    if (!questions.has(qid)) err('questionskills-unknown-question', where, qid);
    if (ids.length === 0) err('questionskills-empty', where, qid);
    for (const id of ids) {
      if (!skillIds.has(id)) err('questionskills-unknown-skill', where, `${qid} → ${id}`);
    }
  }

  const mappedSkills = new Set<SkillId>();
  for (const ids of Object.values(map.questionSkills)) for (const id of ids) mappedSkills.add(id);
  for (const s of map.skills) {
    if (!mappedSkills.has(s.id)) {
      // A skill no question exercises can never accumulate evidence, so it can
      // only ever be reported as `unknown` — dead weight in the graph.
      err('skill-without-questions', where, s.id);
    }
  }

  for (const qid of questions.keys()) {
    if (!map.questionSkills[qid]) {
      warn('question-unmapped', where, `${qid} — falls back to its sub-topic's skills`);
    }
  }

  // ---- misconceptions ----
  if (map.misconceptions.length < MIN_MISCONCEPTIONS) {
    err(
      'too-few-misconceptions',
      where,
      `${map.misconceptions.length} < ${MIN_MISCONCEPTIONS}`,
    );
  }

  const seenMc = new Set<string>();
  const claimed = new Map<string, string>(); // "qid#idx" → misconception id
  for (const mc of map.misconceptions) {
    if (seenMc.has(mc.id)) err('duplicate-misconception-id', where, mc.id);
    seenMc.add(mc.id);

    if (!skillIds.has(mc.skill)) err('misconception-unknown-skill', where, `${mc.id} → ${mc.skill}`);
    if (mc.rootSkill && !skillIds.has(mc.rootSkill)) {
      err('misconception-unknown-rootskill', where, `${mc.id} → ${mc.rootSkill}`);
    }
    if (mc.rootSkill && mc.rootSkill === mc.skill) {
      warn('misconception-rootskill-same', where, `${mc.id} — rootSkill adds nothing`);
    }

    // remedy must resolve to a real destination
    if (!getSubTopic(map.subject, map.topic, mc.remedy.subTopicId)) {
      err('remedy-unknown-subtopic', where, `${mc.id} → ${mc.remedy.subTopicId}`);
    } else if (mc.remedy.level) {
      const st = getSubTopic(map.subject, map.topic, mc.remedy.subTopicId)!;
      const kinds = buildSubTopicLevels(map.subject, map.topic, st).map((l) => l.kind);
      if (!kinds.includes(mc.remedy.level)) {
        err(
          'remedy-missing-level',
          where,
          `${mc.id} → ${mc.remedy.subTopicId} has no '${mc.remedy.level}' rung (${kinds.join('/')})`,
        );
      }
    }

    if (mc.triggers.length === 0) err('misconception-no-triggers', where, mc.id);
    if (mc.triggers.length === 1) {
      warn('misconception-single-trigger', where, `${mc.id} — one hit can never pass 'suspected'`);
    }
    const distinctQuestions = new Set(mc.triggers.map((t) => t.questionId));
    if (mc.triggers.length > 1 && distinctQuestions.size === 1) {
      warn(
        'misconception-single-question',
        where,
        `${mc.id} — all triggers on ${[...distinctQuestions][0]}; a student who never sees it gets no signal`,
      );
    }

    for (const t of mc.triggers) {
      const info = questions.get(t.questionId);
      if (!info) {
        err('trigger-unknown-question', where, `${mc.id} → ${t.questionId}`);
        continue;
      }
      if (info.q.kind !== 'mcq' || !info.q.answers) {
        err('trigger-not-mcq', where, `${mc.id} → ${t.questionId} is '${info.q.kind}'`);
        continue;
      }
      if (!Number.isInteger(t.optionIndex) || t.optionIndex < 0 || t.optionIndex >= info.q.answers.length) {
        err(
          'trigger-index-out-of-range',
          where,
          `${mc.id} → ${t.questionId}[${t.optionIndex}] of ${info.q.answers.length}`,
        );
        continue;
      }
      // THE important one. A trigger on the correct option would mark a student
      // who answered correctly as holding a misconception.
      if (t.optionIndex === info.q.correct) {
        err(
          'trigger-on-correct-option',
          where,
          `${mc.id} → ${t.questionId}[${t.optionIndex}] IS the correct answer`,
        );
        continue;
      }
      const key = `${t.questionId}#${t.optionIndex}`;
      const owner = claimed.get(key);
      if (owner && owner !== mc.id) {
        err('trigger-claimed-twice', where, `${key}: ${owner} and ${mc.id}`);
      }
      claimed.set(key, mc.id);
    }
  }

  return { questions, claimed };
}

// ============================================================
// Inventory — the authoring worklist
// ============================================================

function inventory(map: TopicCognitionMap, claimed: Map<string, string>) {
  const rows: string[][] = [
    ['sub-topic', 'skills', 'bank q', 'mcq', 'bagrut parts', 'misconc.', 'triggers', 'distractors tagged'],
  ];

  type Row = {
    skills: number; questions: number; mcq: number;
    bagrutParts: number; bagrutMapped: number;
    distractors: number; tagged: number;
  };
  const blank = (): Row => ({ skills: 0, questions: 0, mcq: 0, bagrutParts: 0, bagrutMapped: 0, distractors: 0, tagged: 0 });
  const bySub = new Map<string, Row>();
  for (const st of getSubTopics(map.subject, map.topic)) bySub.set(st.id, blank());
  for (const s of map.skills) {
    const row = bySub.get(s.subTopicId);
    if (row) row.skills += 1;
  }

  const index = questionIndex(map.subject, map.topic);
  let capstoneParts = 0;
  let capstoneMapped = 0;
  for (const [qid, info] of index) {
    const mapped = !!map.questionSkills[qid];
    if (info.isBagrutPart && !info.subTopicId) {
      // A capstone question belongs to no single sub-topic by design.
      capstoneParts += 1;
      if (mapped) capstoneMapped += 1;
      continue;
    }
    if (!info.subTopicId) continue;
    const row = bySub.get(info.subTopicId);
    if (!row) continue;
    if (info.isBagrutPart) {
      row.bagrutParts += 1;
      if (mapped) row.bagrutMapped += 1;
      continue;
    }
    row.questions += 1;
    if (info.q.kind === 'mcq' && info.q.answers) {
      row.mcq += 1;
      for (let i = 0; i < info.q.answers.length; i++) {
        if (i === info.q.correct) continue;
        row.distractors += 1;
        if (claimed.has(`${qid}#${i}`)) row.tagged += 1;
      }
    }
  }

  const mcBySub = new Map<string, number>();
  const trigBySub = new Map<string, number>();
  for (const mc of map.misconceptions) {
    const skill = map.skills.find((s) => s.id === mc.skill);
    const sub = skill?.subTopicId ?? '—';
    mcBySub.set(sub, (mcBySub.get(sub) ?? 0) + 1);
    trigBySub.set(sub, (trigBySub.get(sub) ?? 0) + mc.triggers.length);
  }

  for (const [sub, row] of bySub) {
    const pct = row.distractors > 0 ? Math.round((row.tagged / row.distractors) * 100) : 0;
    rows.push([
      sub,
      String(row.skills),
      String(row.questions),
      String(row.mcq),
      `${row.bagrutMapped}/${row.bagrutParts}`,
      String(mcBySub.get(sub) ?? 0),
      String(trigBySub.get(sub) ?? 0),
      `${row.tagged}/${row.distractors} (${pct}%)`,
    ]);
    if ((mcBySub.get(sub) ?? 0) < 2) {
      warn('thin-subtopic', `${map.subject}:${map.topic}`, `${sub} has fewer than 2 misconceptions`);
    }
  }

  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  for (const [n, r] of rows.entries()) {
    console.log('  ' + r.map((c, i) => c.padEnd(widths[i])).join('  '));
    if (n === 0) console.log('  ' + widths.map((w) => '-'.repeat(w)).join('  '));
  }
  if (capstoneParts > 0) {
    console.log(
      `  (plus ${capstoneMapped}/${capstoneParts} capstone bagrut parts — they belong to no single sub-topic)`,
    );
  }
}

// ============================================================

function main() {
  const maps = cognitionEntries();
  console.log(`verify-cognition — ${maps.length} topic catalog(s)\n`);

  for (const map of maps) {
    console.log(`## ${map.subject} · ${map.topic}`);
    console.log(
      `   ${map.skills.length} skills · ${map.misconceptions.length} misconceptions · ` +
        `${map.misconceptions.reduce((n, m) => n + m.triggers.length, 0)} triggers · ` +
        `${Object.keys(map.questionSkills).length} questions mapped\n`,
    );
    const { claimed } = verifyTopic(map);
    inventory(map, claimed);
    console.log('');
  }

  const errors = findings.filter((f) => f.level === 'error');
  const warns = findings.filter((f) => f.level === 'warn');

  for (const f of [...errors, ...warns]) {
    console.log(`${f.level === 'error' ? 'ERROR' : 'warn '}  ${f.rule.padEnd(32)} ${f.where}  ${f.detail}`);
  }

  console.log(`\n${errors.length} error(s), ${warns.length} warning(s)`);
  console.log(
    'NOTE: this gate proves the catalog is consistent with the content. It cannot\n' +
      '      judge whether a misconception is the right reading of a distractor —\n' +
      '      that still requires reading the authored distractorNotes by hand.',
  );

  if (errors.length > 0 || (STRICT && warns.length > 0)) process.exit(1);
}

main();
