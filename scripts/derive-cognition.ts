/**
 * derive-cognition.ts — turn authored distractor notes into a cognition catalog.
 *
 *   npx tsx scripts/derive-cognition.ts "פונקציית ln"        # one topic
 *   npx tsx scripts/derive-cognition.ts "פונקציית ln" --write # write the file
 *
 * ============================================================
 * WHY A MODEL IS INVOLVED AT ALL
 * ============================================================
 * The misconceptions are already written. Every MCQ distractor in the bank has
 * an authored `distractorNotes` entry explaining the wrong idea that produces
 * it — 573 of them across the 14 unmapped topics.
 *
 * But they are written ABOUT THEIR QUESTION, with its numbers. Two notes that
 * describe the same misconception look like this:
 *
 *   "האי-שוויון החלש מכניס את x = 5, ושם הארגומנט הוא 5 − 5 = 0 …"
 *   "האי-שוויון החלש מכניס את x = 3, ושם הארגומנט הוא 3 − 3 = 0 …"
 *
 * Measured on the real content: normalised-prefix matching clustered only 11 of
 * 90 notes. The identity of a misconception is not in the surface string, so
 * string similarity cannot recover it — and grouping is the entire value. One
 * misconception per distractor can never accumulate evidence across questions,
 * which is the difference between a note and a diagnosis.
 *
 * So the model does exactly one job: GROUP and NAME. It never invents evidence.
 *
 * ============================================================
 * WHAT THE MODEL IS NOT TRUSTED WITH
 * ============================================================
 * Structured output enforces shape, not values — the lesson lib/teach learned
 * when `coerceCoveredIds` had to filter invented key-point ids. So every
 * reference the model returns is checked against the real content here, before
 * anything is written:
 *
 *   · questionId must exist in this topic
 *   · optionIndex must be a real option, and NEVER the correct one
 *   · subTopicId must exist
 *   · every skill referenced by a misconception must be defined
 *   · prereq edges must be acyclic and point at defined skills
 *
 * Anything that fails is DROPPED, loudly, with a count. A catalog is the app's
 * diagnosis of a student; a hallucinated trigger there tells a 17-year-old he
 * holds a wrong idea he never expressed.
 *
 * `npm run verify:cognition` is the real gate and runs the same assertions
 * independently — this is the fast feedback, not the authority.
 *
 * COST: one call per topic. Input is the topic's MCQs with their options and
 * notes; Hebrew, so it tokenises heavily. Printed per run — no estimating.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { writeFileSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { getSubTopics, allLessonKeys } from '../content/lessons';
import { hasCognitionMap } from '../content/cognition';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('✗ ANTHROPIC_API_KEY missing from .env.local');
  process.exit(1);
}
const client = new Anthropic({ apiKey });

const SUBJECT = 'math5';
const MODEL = 'claude-sonnet-4-6';

/**
 * Hebrew topic → latin file slug and export name.
 *
 * Explicit rather than transliterated: there are fifteen of them, a table is
 * readable where a transliteration is a guess, and a Hebrew filename inside an
 * `import` path is the kind of thing that works on one machine and not on the
 * build server.
 */
const SLUGS: Record<string, { slug: string; varName: string }> = {
  'פונקציית ln': { slug: 'ln-function', varName: 'lnFunctionCognition' },
  'וקטורים במרחב': { slug: 'vectors', varName: 'vectorsCognition' },
  'גאומטריה אנליטית': { slug: 'analytic-geometry', varName: 'analyticGeometryCognition' },
  'פונקציה מעריכית': { slug: 'exponential', varName: 'exponentialCognition' },
  'אלגברה': { slug: 'algebra', varName: 'algebraCognition' },
  'פונקציות': { slug: 'functions', varName: 'functionsCognition' },
  'גיאומטריה אוקלידית': { slug: 'euclidean-geometry', varName: 'euclideanGeometryCognition' },
  'סדרות': { slug: 'sequences', varName: 'sequencesCognition' },
  'חשבון דיפרנציאלי': { slug: 'differential-calculus', varName: 'differentialCalculusCognition' },
  'חשבון אינטגרלי': { slug: 'integral-calculus', varName: 'integralCalculusCognition' },
  'טריגונומטריה': { slug: 'trigonometry', varName: 'trigonometryCognition' },
  'הסתברות': { slug: 'probability', varName: 'probabilityCognition' },
  'גדילה ודעיכה': { slug: 'growth-decay', varName: 'growthDecayCognition' },
  'סטטיסטיקה': { slug: 'statistics', varName: 'statisticsCognition' },
};

// ------------------------------------------------------------
// What the model sees: only real content, with real ids.
// ------------------------------------------------------------

type Item = { subTopicId: string; subTopicTitle: string; q: PracticeQuestion };

function collect(topic: string): { subTopics: SubTopic[]; items: Item[] } {
  const subTopics = getSubTopics(SUBJECT, topic);
  const items: Item[] = [];
  for (const st of subTopics) {
    for (const q of st.questions ?? []) {
      if (q.kind !== 'mcq') continue;
      if (!(q.distractorNotes ?? []).some((n) => n && n.trim())) continue;
      items.push({ subTopicId: st.id, subTopicTitle: st.title, q });
    }
  }
  return { subTopics, items };
}

function renderCorpus(subTopics: SubTopic[], items: Item[]): string {
  const parts: string[] = ['## תתי-הנושאים'];
  for (const st of subTopics) parts.push(`- \`${st.id}\` — ${st.title}`);
  parts.push('\n## השאלות והערות המסיחים');
  for (const { subTopicId, q } of items) {
    parts.push(`\n### \`${q.id}\` (תת-נושא \`${subTopicId}\`, רמה ${q.difficulty})`);
    parts.push(q.question);
    (q.answers ?? []).forEach((a, i) => {
      if (i === q.correct) {
        parts.push(`- [${i}] ${a}  ← התשובה הנכונה, לעולם לא טריגר`);
        return;
      }
      const note = (q.distractorNotes ?? [])[i]?.trim();
      parts.push(`- [${i}] ${a}${note ? `\n      הערה: ${note}` : '\n      (אין הערה)'}`);
    });
  }
  return parts.join('\n');
}

// ------------------------------------------------------------
// The schema. Lenient on wire, coerced here — z.enum-style strictness at the
// boundary throws on drift instead of letting us drop one bad row.
// ------------------------------------------------------------

const SCHEMA = {
  type: 'object' as const,
  properties: {
    skills: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'kebab-case, latin, unique. e.g. "ln-domain"' },
          title: { type: 'string', description: 'Short Hebrew name, student-facing.' },
          subTopicId: { type: 'string', description: 'EXACTLY one of the ids listed.' },
          prereqs: { type: 'array', items: { type: 'string' }, description: 'skill ids, acyclic' },
          band: { type: 'string', description: 'easy | mid | hard' },
        },
        required: ['id', 'title', 'subTopicId', 'prereqs', 'band'],
      },
    },
    misconceptions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'kebab-case, latin, unique.' },
          title: { type: 'string', description: 'Short Hebrew name of the WRONG IDEA.' },
          skill: { type: 'string', description: 'id of the skill it corrupts' },
          insight: {
            type: 'string',
            description:
              'One Hebrew sentence a 17-year-old reads about themselves. States the wrong idea, not the question.',
          },
          remedySubTopicId: { type: 'string' },
          triggers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'string' },
                optionIndex: { type: 'number', description: 'ORIGINAL index in answers[]' },
              },
              required: ['questionId', 'optionIndex'],
            },
          },
        },
        required: ['id', 'title', 'skill', 'insight', 'remedySubTopicId', 'triggers'],
      },
    },
    questionSkills: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questionId: { type: 'string' },
          skillIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['questionId', 'skillIds'],
      },
    },
  },
  required: ['skills', 'misconceptions', 'questionSkills'],
};

const SYSTEM = `You group already-written misconception notes into a diagnostic catalog for an Israeli 5-unit bagrut maths app.

The notes exist. Each one explains why a specific wrong MCQ option is wrong. Your job is NOT to invent misconceptions — it is to recognise WHICH NOTES DESCRIBE THE SAME WRONG IDEA, and name it once.

Rules, in order of importance:

1. NEVER invent a questionId or an optionIndex. Every trigger must be copied from the material given to you. An option marked as the correct answer can never be a trigger.
2. A misconception with only ONE trigger is usually not worth listing: it can never accumulate enough evidence to be reported, and it only adds noise. Prefer misconceptions that appear in 2+ questions. Leave one-off distractors untagged.
3. \`insight\` is read BY THE STUDENT, about themselves. Write the wrong idea in general terms ("אתה מוותר על תחום ההגדרה כשהארגומנט מכיל משתנה"), never the specific numbers of one question.
4. Skills are the things being learned, not the questions. 3-6 per sub-topic. \`prereqs\` must be acyclic and may only reference skills you defined. A skill with no prerequisite is fine.
5. \`questionSkills\` maps each question to the 1-2 skills it actually exercises. Not every skill of its sub-topic.

Hebrew for every title and insight.

MATHS MUST BE LaTeX, wrapped in $...$ — "$\ln(e^k)=k$", not "ln(e^k)=k". These
strings are rendered through KaTeX and plain-text maths reads as broken next to
the rest of the app. But NEVER put Hebrew inside $...$: KaTeX has no bidi
support and Hebrew comes out reversed. Hebrew outside, maths inside.

Latin letters only for ids.`;

// ------------------------------------------------------------
// Validation — the part that does not trust the model.
// ------------------------------------------------------------

type RawSkill = { id: string; title: string; subTopicId: string; prereqs: string[]; band: string };
type RawTrigger = { questionId: string; optionIndex: number };
type RawMisc = {
  id: string;
  title: string;
  skill: string;
  insight: string;
  remedySubTopicId: string;
  triggers: RawTrigger[];
};

function validate(
  raw: { skills: RawSkill[]; misconceptions: RawMisc[]; questionSkills: { questionId: string; skillIds: string[] }[] },
  subTopics: SubTopic[],
  items: Item[],
) {
  const drops: string[] = [];
  const subIds = new Set(subTopics.map((s) => s.id));
  const byQuestion = new Map(items.map((i) => [i.q.id, i]));

  const skills = raw.skills.filter((s) => {
    if (!s.id || !/^[a-z0-9-]+$/.test(s.id)) return drop(drops, `skill id "${s.id}" is not kebab-case latin`);
    if (!subIds.has(s.subTopicId)) return drop(drops, `skill "${s.id}" points at unknown sub-topic "${s.subTopicId}"`);
    return true;
  });
  const skillIds = new Set(skills.map((s) => s.id));

  // Prereqs: drop dangling edges rather than the whole skill — a missing
  // prerequisite weakens the graph, an undefined one crashes the tracer.
  for (const s of skills) {
    const before = s.prereqs.length;
    s.prereqs = s.prereqs.filter((p) => skillIds.has(p) && p !== s.id);
    if (s.prereqs.length !== before) drops.push(`skill "${s.id}": dropped ${before - s.prereqs.length} dangling prereq(s)`);
    if (!['easy', 'mid', 'hard'].includes(s.band)) s.band = 'mid';
  }

  const misconceptions = raw.misconceptions
    .map((m) => {
      const triggers = m.triggers.filter((t) => {
        const item = byQuestion.get(t.questionId);
        if (!item) return drop(drops, `trigger on unknown question "${t.questionId}"`);
        const n = item.q.answers?.length ?? 0;
        if (!Number.isInteger(t.optionIndex) || t.optionIndex < 0 || t.optionIndex >= n)
          return drop(drops, `trigger "${t.questionId}"[${t.optionIndex}] is out of range`);
        if (t.optionIndex === item.q.correct)
          return drop(drops, `🔴 trigger "${t.questionId}"[${t.optionIndex}] points at the CORRECT answer`);
        return true;
      });
      return { ...m, triggers };
    })
    .filter((m) => {
      if (!skillIds.has(m.skill)) return drop(drops, `misconception "${m.id}" corrupts unknown skill "${m.skill}"`);
      if (!subIds.has(m.remedySubTopicId)) return drop(drops, `misconception "${m.id}" remedies unknown sub-topic`);
      if (!m.triggers.length) return drop(drops, `misconception "${m.id}" has no surviving trigger`);
      return true;
    });

  // ONE distractor = ONE wrong idea.
  //
  // The gate rejects a trigger claimed by two misconceptions, and it is right
  // to: a single click cannot be evidence for two conflicting diagnoses, and
  // counting it twice inflates both rates. The model produced two such
  // collisions on the first real topic — always an over-broad misconception
  // reaching for a distractor a sharper one had already explained.
  //
  // First claimant wins, deterministically by document order. Dropping from
  // BOTH would be the more cautious rule, but it discards evidence we do have;
  // and the gate re-asserts the invariant independently either way.
  const claimed = new Set<string>();
  for (const m of misconceptions) {
    m.triggers = m.triggers.filter((t) => {
      const k = `${t.questionId}#${t.optionIndex}`;
      if (claimed.has(k)) return drop(drops, `trigger ${k} already claimed — dropped from "${m.id}"`);
      claimed.add(k);
      return true;
    });
  }
  const survivingMisc = misconceptions.filter(
    (m) => m.triggers.length > 0 || drop(drops, `misconception "${m.id}" lost every trigger to a collision`),
  );

  const questionSkills = raw.questionSkills
    .map((qs) => ({ ...qs, skillIds: qs.skillIds.filter((s) => skillIds.has(s)) }))
    .filter((qs) => byQuestion.has(qs.questionId) && qs.skillIds.length > 0);

  return { skills, misconceptions: survivingMisc, questionSkills, drops };
}

function drop(into: string[], why: string): false {
  into.push(why);
  return false;
}

// ------------------------------------------------------------
// Emit
// ------------------------------------------------------------

const j = (v: unknown) => JSON.stringify(v);

function emit(
  topic: string,
  slug: string,
  varName: string,
  v: ReturnType<typeof validate>,
  items: Item[],
): string {
  const lines: string[] = [];
  lines.push('// ============================================================');
  lines.push(`// Cognition catalog — ${SUBJECT} · ${topic}`);
  lines.push('// ============================================================');
  lines.push('//');
  lines.push(`// ${v.skills.length} skills · ${v.misconceptions.length} misconceptions ·`);
  lines.push(`// ${v.misconceptions.reduce((s, m) => s + m.triggers.length, 0)} triggers over ${items.length} MCQs.`);
  lines.push('//');
  lines.push('// DERIVED, not authored from scratch: every trigger below was grouped from');
  lines.push('// the `distractorNotes` already written on the question it names');
  lines.push('// (scripts/derive-cognition.ts). Each reference was checked against the real');
  lines.push('// content before this file was written, and `npm run verify:cognition`');
  lines.push('// asserts the same invariants independently — in particular that no trigger');
  lines.push('// points at a correct answer.');
  lines.push('//');
  lines.push('// Review target: the `insight` strings. They are read by the student ABOUT');
  lines.push('// THEMSELVES, so a clumsy one is worse than a missing one.');
  lines.push('');
  lines.push("import type { TopicCognitionMap } from '../types';");
  lines.push('');
  lines.push(`const SUBJECT = ${j(SUBJECT)};`);
  lines.push(`const TOPIC = ${j(topic)};`);
  lines.push('');
  lines.push(`export const ${varName}: TopicCognitionMap = {`);
  lines.push('  subject: SUBJECT,');
  lines.push('  topic: TOPIC,');
  lines.push('  skills: [');
  for (const s of v.skills) {
    lines.push(
      `    { id: ${j(s.id)}, title: ${j(s.title)}, subject: SUBJECT, topic: TOPIC, subTopicId: ${j(s.subTopicId)}, prereqs: ${j(s.prereqs)}, band: ${j(s.band)} },`,
    );
  }
  lines.push('  ],');
  lines.push('  misconceptions: [');
  for (const m of v.misconceptions) {
    lines.push('    {');
    lines.push(`      id: ${j(m.id)},`);
    lines.push(`      title: ${j(m.title)},`);
    lines.push(`      skill: ${j(m.skill)},`);
    lines.push(`      insight: ${j(m.insight)},`);
    lines.push(`      remedy: { subTopicId: ${j(m.remedySubTopicId)} },`);
    lines.push(`      triggers: [`);
    for (const t of m.triggers) lines.push(`        { questionId: ${j(t.questionId)}, optionIndex: ${t.optionIndex} },`);
    lines.push('      ],');
    lines.push('    },');
  }
  lines.push('  ],');
  lines.push('  questionSkills: {');
  for (const qs of v.questionSkills) lines.push(`    ${j(qs.questionId)}: ${j(qs.skillIds)},`);
  lines.push('  },');
  lines.push('};');
  lines.push('');
  void slug;
  return lines.join('\n');
}

// ------------------------------------------------------------

async function main() {
  const topic = process.argv[2];
  const write = process.argv.includes('--write');
  if (!topic) {
    const open = allLessonKeys()
      .filter((k) => k.subject === SUBJECT && !hasCognitionMap(k.subject, k.topic))
      .map((k) => k.topic);
    console.log('usage: npx tsx scripts/derive-cognition.ts "<topic>" [--write]\n');
    console.log('topics still without a catalog:');
    for (const t of open) console.log('  ·', t);
    return;
  }

  const { subTopics, items } = collect(topic);
  if (!items.length) {
    console.error(`✗ "${topic}" has no MCQ with authored distractor notes — nothing to derive from.`);
    process.exit(1);
  }

  const corpus = renderCorpus(subTopics, items);
  console.log(`נושא: ${topic}`);
  console.log(`  ${subTopics.length} תתי-נושאים · ${items.length} שאלות אמריקאיות עם הערות`);

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    tools: [
      {
        name: 'emit_catalog',
        description: 'Return the grouped cognition catalog for this topic.',
        input_schema: SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: 'emit_catalog' },
    messages: [{ role: 'user', content: corpus }],
  });

  const block = res.content.find((b) => b.type === 'tool_use');
  if (!block || block.type !== 'tool_use') {
    console.error('✗ the model returned no catalog');
    process.exit(1);
  }

  const v = validate(
    block.input as Parameters<typeof validate>[0],
    subTopics,
    items,
  );

  const inTok = res.usage.input_tokens;
  const outTok = res.usage.output_tokens;
  const usd = (inTok / 1e6) * 3 + (outTok / 1e6) * 15;
  console.log(`  טוקנים: ${inTok} קלט · ${outTok} פלט  ≈ $${usd.toFixed(3)}`);
  console.log(
    `  תוצאה: ${v.skills.length} מיומנויות · ${v.misconceptions.length} תפיסות שגויות · ${v.misconceptions.reduce((s, m) => s + m.triggers.length, 0)} טריגרים`,
  );

  if (v.drops.length) {
    console.log(`\n  ⚠️ ${v.drops.length} הפניות נדחו (המודל המציא אותן):`);
    for (const d of v.drops.slice(0, 12)) console.log('    ·', d);
    if (v.drops.length > 12) console.log(`    … ועוד ${v.drops.length - 12}`);
  } else {
    console.log('  ✅ כל ההפניות אומתו מול התוכן האמיתי');
  }

  const naming = SLUGS[topic];
  if (!naming) {
    console.error(`
✗ no latin slug for "${topic}" — add one to SLUGS before deriving it.`);
    process.exit(1);
  }
  const { slug, varName } = naming;
  const file = emit(topic, slug, varName, v, items);

  if (!write) {
    console.log('\n--- תצוגה מקדימה (הרץ עם --write כדי לכתוב) ---\n');
    console.log(file.split('\n').slice(0, 40).join('\n'));
    console.log(`\n… ${file.split('\n').length} שורות סה"כ`);
    return;
  }

  const path = `content/cognition/${SUBJECT}/${slug}.ts`;
  writeFileSync(path, file, 'utf8');
  console.log(`\n✅ נכתב ${path}`);
  console.log(`   הוסף לרגיסטרי ב-content/cognition/index.ts:`);
  console.log(`     import { ${varName} } from './${SUBJECT}/${slug}';`);
  console.log(`     '${SUBJECT}:${topic}': ${varName},`);
  console.log(`   ואז: npm run verify:cognition`);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
