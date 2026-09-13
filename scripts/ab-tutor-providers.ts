/**
 * ab-tutor-providers.ts — the same real turns through two providers, graded.
 *
 * Takes PAID turns from `tutor_trace` (message + the question it was asked
 * on), builds the exact prompt /api/chat builds (buildTutorSystem +
 * renderFocusContext with the unit's AUTHORED candidates), runs each turn
 * through every provider that has a key, and has Haiku grade every reply:
 *
 *   RELEVANT / IRRELEVANT / STALL — does it answer the sentence?
 *   HEBREW ok / broken            — invented word forms, mixed language,
 *                                   Hebrew inside $...$ (the known small-model failure)
 *   LEAK                          — states the final answer or a step past the
 *                                   next one (the REVEALED rule)
 *
 * and prints, per provider: the three rates, tokens, and the measured $ per
 * turn from the provider's own usage counters at 2026-09 list prices.
 *
 *   npx tsx scripts/ab-tutor-providers.ts --n 100
 *   npx tsx scripts/ab-tutor-providers.ts --n 100 --dry     # build prompts, call nothing
 *
 * Env: ANTHROPIC_API_KEY (always); GEMINI_API_KEY (the Gemini arm runs only
 * if present; TUTOR_GEMINI_MODEL picks the model, default gemini-2.5-flash-lite).
 * Budget at n=100: Haiku arm ~$0.35, Gemini 2.5 Flash-Lite arm ~$0.04,
 * judge ~$0.20 for both arms.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { buildTutorSystem } from '../lib/agents/prompts';
import { TUTOR_TOOLS } from '../lib/agents/tools';
import { renderFocusContext, type TutorFocus } from '../lib/tutor-presence';
import { faqCandidates } from '../lib/tutor-faq';
import { AnthropicTutorProvider, GeminiTutorProvider, type TutorProvider, type TurnUsage } from '../lib/llm/tutor-provider';
import { allScreens } from './_screens';

config({ path: '.env.local' });

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const N = Number(argv[argv.indexOf('--n') + 1]) || 100;
const DAYS = 90;

// $/M tokens, 2026-09 list. Haiku 4.5: in 1 / cached-read 0.1 / cache-write 1.25 / out 5.
// Gemini 2.5 Flash-Lite: in 0.10 / cached 0.025 / out 0.40.
const PRICE: Record<string, { in: number; cached: number; write: number; out: number }> = {
  'claude-haiku-4-5': { in: 1, cached: 0.1, write: 1.25, out: 5 },
  'gemini-2.5-flash-lite': { in: 0.1, cached: 0.025, write: 0, out: 0.4 },
  'gemini-2.5-flash': { in: 0.3, cached: 0.075, write: 0, out: 2.5 },
};
const cost = (model: string, u: TurnUsage) => {
  const p = PRICE[model] ?? PRICE['claude-haiku-4-5'];
  return (u.input_tokens * p.in + u.cache_read_input_tokens * p.cached + u.cache_creation_input_tokens * p.write + u.output_tokens * p.out) / 1e6;
};

const JUDGE = `You grade one reply of a Hebrew maths tutor. You get the exercise, its verified solution steps, which help the student had ALREADY been shown (REVEALED; absent = nothing), the student's message, and the tutor's reply.
Answer with exactly three lines:
ANSWER: RELEVANT | IRRELEVANT | STALL   (does the reply address what the student actually wrote, in the context of this exercise; STALL = only "try again / re-read / tell me more" with no content)
HEBREW: OK | BROKEN   (BROKEN = an invented Hebrew word form, an English sentence, Hebrew letters inside $...$, or Hebrew that reads as machine-translated)
LEAK: NONE | STEP | FINAL   (STEP = states a solution step beyond the next one after REVEALED; FINAL = states the final answer while "full" is not in REVEALED)
Then one short English sentence of reasoning.`;

type Trace = { topic: string; question_id: string; normalized_message: string };

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!url || !key || !anthropicKey) {
    console.error('missing Supabase or Anthropic credentials');
    process.exit(2);
  }
  const providers: TutorProvider[] = [new AnthropicTutorProvider('claude-haiku-4-5', anthropicKey)];
  if (process.env.GEMINI_API_KEY) {
    providers.push(new GeminiTutorProvider((process.env.TUTOR_GEMINI_MODEL ?? 'gemini-2.5-flash-lite').trim(), process.env.GEMINI_API_KEY));
  } else {
    console.log('no GEMINI_API_KEY — running the Anthropic arm only');
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString();
  const { data, error } = await db
    .from('tutor_trace')
    .select('topic,question_id,normalized_message,used_llm,input_tokens')
    .eq('used_llm', true)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20000);
  if (error) {
    console.error(`could not read tutor_trace (${error.code}: ${error.message})`);
    process.exit(2);
  }
  const screens = allScreens();
  const seen = new Set<string>();
  const pool: Array<{ t: Trace; focus: TutorFocus }> = [];
  for (const t of (data ?? []) as Array<Trace & { input_tokens: number }>) {
    const msg = (t.normalized_message ?? '').trim();
    const s = screens.get(t.question_id);
    if (!msg || msg.length < 3 || !s || (t.input_tokens ?? 0) === 0) continue;
    const k = `${t.question_id}|${msg}`;
    if (seen.has(k)) continue;
    seen.add(k);
    pool.push({
      t: { ...t, normalized_message: msg },
      focus: {
        where: s.topic,
        topic: s.topic,
        subTopicId: s.subTopic?.id ?? '',
        questionText: s.question.question,
        question: s.question,
        ...(s.subTopic ? { subTopic: s.subTopic } : {}),
      } as unknown as TutorFocus,
    });
  }
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const sample = pool.slice(0, N);
  console.log(`${(data ?? []).length} paid turns in ${DAYS}d · ${pool.length} distinct with a resolvable question · sampling ${sample.length}`);
  if (DRY) return;

  const ai = new Anthropic({ apiKey: anthropicKey });
  mkdirSync('.tutor-work', { recursive: true });
  const out = `.tutor-work/ab-${new Date().toISOString().slice(0, 10)}.jsonl`;
  const lines: string[] = [];
  type Tally = { n: number; relevant: number; irrelevant: number; stall: number; hebrewBroken: number; leak: number; usd: number; inTok: number; outTok: number; cached: number; ms: number };
  const tally: Record<string, Tally> = {};
  let judgeIn = 0;
  let judgeOut = 0;

  for (const { t, focus } of sample) {
    // The exact prompt the route builds: the shared cached core + grounding,
    // then the per-turn context in the user message.
    const system = buildTutorSystem({ unitLevel: 5, formNumber: '571', topic: focus.topic, memory: '', hasQuestion: true });
    const candidates = await faqCandidates(t.normalized_message, focus);
    const context = renderFocusContext(focus, { candidates });
    const user = `[הקשר — התלמיד עובד על:]\n${context}\n\n${t.normalized_message}`;
    for (const p of providers) {
      const started = Date.now();
      let reply = '';
      let usage: TurnUsage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
      let err = '';
      try {
        const r = await p.stream(
          { system, messages: [{ role: 'user', content: user }], maxTokens: 200, temperature: 0.3, tools: p.id === 'anthropic' ? TUTOR_TOOLS : undefined },
          () => {},
        );
        reply = r.text;
        usage = r.usage;
      } catch (e) {
        err = String(e).slice(0, 200);
      }
      const ms = Date.now() - started;
      const steps = (focus.question?.solution?.steps ?? []).map((s, i) => `${i + 1}. ${s}`).join('\n').slice(0, 900);
      let verdict = { answer: 'ERROR', hebrew: '-', leak: '-', why: err };
      if (reply) {
        const j = await ai.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 90,
          system: JUDGE,
          messages: [{ role: 'user', content: `EXERCISE:\n${focus.questionText?.slice(0, 700)}\n\nSOLUTION:\n${steps}\n\nREVEALED: (absent)\n\nSTUDENT:\n${t.normalized_message}\n\nTUTOR REPLY:\n${reply.slice(0, 1200)}` }],
        });
        judgeIn += j.usage.input_tokens;
        judgeOut += j.usage.output_tokens;
        const text = j.content[0]?.type === 'text' ? j.content[0].text : '';
        const pick = (k: string) => (text.match(new RegExp(`${k}:\\s*([A-Z]+)`)) ?? [])[1] ?? '?';
        verdict = { answer: pick('ANSWER'), hebrew: pick('HEBREW'), leak: pick('LEAK'), why: text.split('\n').slice(3).join(' ').trim() };
      }
      const k = `${p.id}:${p.model}`;
      const ty = (tally[k] ??= { n: 0, relevant: 0, irrelevant: 0, stall: 0, hebrewBroken: 0, leak: 0, usd: 0, inTok: 0, outTok: 0, cached: 0, ms: 0 });
      ty.n++;
      if (verdict.answer === 'RELEVANT') ty.relevant++;
      else if (verdict.answer === 'IRRELEVANT') ty.irrelevant++;
      else if (verdict.answer === 'STALL') ty.stall++;
      if (verdict.hebrew === 'BROKEN') ty.hebrewBroken++;
      if (verdict.leak === 'STEP' || verdict.leak === 'FINAL') ty.leak++;
      ty.usd += cost(p.model, usage);
      ty.inTok += usage.input_tokens;
      ty.outTok += usage.output_tokens;
      ty.cached += usage.cache_read_input_tokens;
      ty.ms += ms;
      lines.push(JSON.stringify({ provider: k, topic: t.topic, question_id: t.question_id, message: t.normalized_message, reply, usage, ms, ...verdict }));
      process.stdout.write(verdict.answer === 'RELEVANT' ? '.' : verdict.answer === 'ERROR' ? 'E' : verdict.answer === 'STALL' ? 's' : 'X');
    }
  }
  writeFileSync(out, lines.join('\n') + '\n');

  console.log('\n\nprovider                         n  relevant  irrelev  stall  hebrew-broken  leak   $/turn   in(fresh)  cached   out   ms');
  for (const [k, v] of Object.entries(tally)) {
    const pc = (x: number) => `${((100 * x) / v.n).toFixed(0)}%`.padStart(7);
    console.log(
      `${k.padEnd(32)} ${String(v.n).padStart(3)} ${pc(v.relevant)} ${pc(v.irrelevant)} ${pc(v.stall)} ${pc(v.hebrewBroken).padStart(14)} ${pc(v.leak)}  $${(v.usd / v.n).toFixed(4)}  ${String(Math.round(v.inTok / v.n)).padStart(9)} ${String(Math.round(v.cached / v.n)).padStart(7)} ${String(Math.round(v.outTok / v.n)).padStart(5)} ${String(Math.round(v.ms / v.n)).padStart(5)}`,
    );
  }
  console.log(`\njudge: ${judgeIn} in + ${judgeOut} out ≈ $${(judgeIn / 1e6 + (5 * judgeOut) / 1e6).toFixed(3)} · replies: ${out}`);
  console.log('⚠️ $/turn here is a COLD-ish estimate: the sample cycles topics, so the Anthropic prefix cache is written more often than in production.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
