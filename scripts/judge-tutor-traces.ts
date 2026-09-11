/**
 * judge-tutor-traces.ts — did the FREE answer actually answer the student?
 *
 * Every existing instrument (report:tutor, test:faq, report:accuracy) scores a
 * locally served answer as a win. None of them asks whether the served text
 * answers the sentence the student typed. This one does: it replays real
 * locally-answered turns from `tutor_trace` through today's `runTutorChain`,
 * then asks Haiku to grade "does this reply answer this message about this
 * exercise". One-off, ~200 turns, budgeted at well under $0.50.
 *
 *   npx tsx scripts/judge-tutor-traces.ts            # 200 turns, calls the API
 *   npx tsx scripts/judge-tutor-traces.ts --dry      # counts only, $0
 *   npx tsx scripts/judge-tutor-traces.ts --n 50
 *
 * Output: a per-layer table on stdout and a JSONL of every graded turn under
 * .tutor-work/judge-<date>.jsonl so verdicts can be read by a human.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { getLesson, allLessonKeys } from '../content/lessons';
import { partAsQuestion, type TutorFocus } from '../lib/tutor-presence';
import { runTutorChain, emptyChainState } from '../lib/tutor-chain';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

config({ path: '.env.local' });

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const N = Number(argv[argv.indexOf('--n') + 1]) || 200;
const DAYS = 90;
const JUDGE_MODEL = 'claude-haiku-4-5';

type Trace = {
  topic: string;
  question_id: string;
  normalized_message: string;
  used_llm: boolean | null;
  created_at: string;
};

type Screen = { question: PracticeQuestion; subTopic?: SubTopic; topic: string };

function screens(): Map<string, Screen> {
  const map = new Map<string, Screen>();
  for (const { subject, topic } of allLessonKeys()) {
    const L = getLesson(subject, topic);
    if (!L) continue;
    for (const st of L.subTopics ?? [])
      for (const q of st.questions ?? []) map.set(q.id, { question: q, subTopic: st, topic });
    for (const q of L.questions ?? []) map.set(q.id, { question: q, topic });
    for (const b of L.bagrutQuestions ?? [])
      for (const p of b.parts ?? []) {
        const q = partAsQuestion(p, { questionId: b.id });
        map.set(q.id, { question: q, topic });
      }
  }
  return map;
}

// Model-facing text in English on purpose: Hebrew costs 3-4x the tokens.
const SYSTEM = `You grade a maths tutor's reply. The student is looking at one exercise and typed one message. You get the exercise, the student's message, and the tutor's reply (all Hebrew).
Answer with ONE word on the first line:
RELEVANT - the reply addresses what the student actually asked or said, in the context of this exercise.
IRRELEVANT - the reply is about something else, ignores the student's actual sentence, answers a different question, or is a generic filler that does not engage with the message.
STALL - the reply only tells the student to re-read, try again, or asks them to say more, without any content.
Then one short English sentence explaining why.`;

// ponytail: sequential calls, ~200 turns finishes in a couple of minutes
async function judge(ai: Anthropic, exercise: string, message: string, reply: string) {
  const r = await ai.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 60,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `EXERCISE:\n${exercise.slice(0, 900)}\n\nSTUDENT:\n${message}\n\nTUTOR REPLY:\n${reply.slice(0, 1200)}`,
      },
    ],
  });
  const text = r.content[0]?.type === 'text' ? r.content[0].text.trim() : '';
  const verdict = (text.split('\n')[0] ?? '').toUpperCase().replace(/[^A-Z]/g, '');
  return {
    verdict: ['RELEVANT', 'IRRELEVANT', 'STALL'].includes(verdict) ? verdict : 'UNPARSED',
    why: text.split('\n').slice(1).join(' ').trim(),
    inTok: r.usage.input_tokens,
    outTok: r.usage.output_tokens,
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('missing Supabase credentials');
    process.exit(2);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString();
  const { data, error } = await db
    .from('tutor_trace')
    .select('topic,question_id,normalized_message,used_llm,created_at')
    .eq('used_llm', false)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20000);
  if (error) {
    console.error(`could not read tutor_trace (${error.code}: ${error.message})`);
    process.exit(2);
  }

  const byId = screens();
  const seen = new Set<string>();
  const pool: Array<{ t: Trace; s: Screen }> = [];
  let noQuestion = 0;
  for (const t of (data ?? []) as Trace[]) {
    const msg = (t.normalized_message ?? '').trim();
    if (!msg || msg.length < 3) continue;
    const s = byId.get(t.question_id);
    if (!s) {
      noQuestion++;
      continue;
    }
    const k = `${t.question_id}|${msg}`;
    if (seen.has(k)) continue;
    seen.add(k);
    pool.push({ t: { ...t, normalized_message: msg }, s });
  }
  console.log(
    `${(data ?? []).length} local turns in ${DAYS}d · ${noQuestion} with no resolvable question · ${pool.length} distinct (question, message) pairs`,
  );

  // Deterministic shuffle so a re-run grades the same sample.
  let seed = 42;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const sample = pool.slice(0, N);

  // Replay through today's chain. Local turns that today go to the model are
  // reported but not graded — there is no local text to grade.
  const replayed: Array<{ t: Trace; s: Screen; layer: string; text: string }> = [];
  let nowModel = 0;
  for (const { t, s } of sample) {
    const focus = {
      where: s.topic,
      topic: s.topic,
      subTopicId: s.subTopic?.id ?? '',
      questionText: s.question.question,
      question: s.question,
      ...(s.subTopic ? { subTopic: s.subTopic } : {}),
    } as unknown as TutorFocus;
    const r = await runTutorChain({ message: t.normalized_message, focus, state: emptyChainState() });
    if (!r.answered) {
      nowModel++;
      continue;
    }
    replayed.push({ t, s, layer: r.layer, text: r.text });
  }
  console.log(`replayed ${sample.length}: ${replayed.length} still local, ${nowModel} now go to the model`);
  if (DRY) return;

  const ai = new Anthropic();
  mkdirSync('.tutor-work', { recursive: true });
  const out = `.tutor-work/judge-${new Date().toISOString().slice(0, 10)}.jsonl`;
  const lines: string[] = [];
  const tally: Record<string, Record<string, number>> = {};
  let inTok = 0;
  let outTok = 0;
  for (const r of replayed) {
    const v = await judge(ai, r.s.question.question, r.t.normalized_message, r.text);
    inTok += v.inTok;
    outTok += v.outTok;
    const family = r.layer.split(':')[0];
    (tally[family] ??= {})[v.verdict] = ((tally[family] ??= {})[v.verdict] ?? 0) + 1;
    lines.push(
      JSON.stringify({
        topic: r.s.topic,
        question_id: r.t.question_id,
        message: r.t.normalized_message,
        layer: r.layer,
        verdict: v.verdict,
        why: v.why,
        reply: r.text,
      }),
    );
    process.stdout.write(v.verdict === 'RELEVANT' ? '.' : v.verdict === 'STALL' ? 's' : 'X');
  }
  writeFileSync(out, lines.join('\n') + '\n');

  console.log('\n\nlayer        RELEVANT  IRRELEVANT  STALL  UNPARSED');
  let all = { RELEVANT: 0, IRRELEVANT: 0, STALL: 0, UNPARSED: 0 };
  for (const [family, v] of Object.entries(tally).sort()) {
    const row = ['RELEVANT', 'IRRELEVANT', 'STALL', 'UNPARSED'].map((k) => v[k] ?? 0);
    console.log(`${family.padEnd(12)} ${row.map((n) => String(n).padStart(9)).join('  ')}`);
    all = {
      RELEVANT: all.RELEVANT + row[0],
      IRRELEVANT: all.IRRELEVANT + row[1],
      STALL: all.STALL + row[2],
      UNPARSED: all.UNPARSED + row[3],
    };
  }
  const total = replayed.length || 1;
  console.log(
    `\nTOTAL ${replayed.length}: relevant ${((100 * all.RELEVANT) / total).toFixed(1)}% · irrelevant ${((100 * all.IRRELEVANT) / total).toFixed(1)}% · stall ${((100 * all.STALL) / total).toFixed(1)}%`,
  );
  // Haiku 4.5: $1/M in, $5/M out.
  console.log(`judge cost: ${inTok} in + ${outTok} out ≈ $${(inTok / 1e6 + (5 * outTok) / 1e6).toFixed(3)}`);
  console.log(`verdicts: ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
