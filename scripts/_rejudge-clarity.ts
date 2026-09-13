/**
 * _rejudge-clarity.ts — grade STORED replies for clarity only, so a prompt
 * layout change can be compared against the replies generated before it
 * without paying for them again.
 *
 *   npx tsx scripts/_rejudge-clarity.ts .tutor-work/ab-3.5-tuned.jsonl
 */
import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

config({ path: '.env.local' });

const JUDGE = `You grade the LAYOUT of one reply of a Hebrew maths tutor, nothing else.
Answer with one word on the first line:
CLEAR - a student can read it at a glance: one idea per line, any formula on its own line, the guiding question separated from the explanation.
DENSE - rule, formula, numbers and question packed into one paragraph, or a formula buried mid-sentence.
Then one short English sentence.`;

async function main() {
  const file = process.argv[2];
  const rows = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { reply: string; provider: string });
  const ai = new Anthropic();
  let clear = 0;
  let dense = 0;
  let inTok = 0;
  for (const r of rows) {
    if (!r.reply) continue;
    const j = await ai.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 40,
      system: JUDGE,
      messages: [{ role: 'user', content: `TUTOR REPLY:\n${r.reply.slice(0, 1200)}` }],
    });
    inTok += j.usage.input_tokens;
    const v = (j.content[0]?.type === 'text' ? j.content[0].text : '').trim().split('\n')[0].toUpperCase();
    if (v.startsWith('CLEAR')) clear++;
    else if (v.startsWith('DENSE')) dense++;
    process.stdout.write(v.startsWith('CLEAR') ? '.' : 'D');
  }
  const n = clear + dense;
  console.log(`\n${file}: clear ${clear}/${n} (${((100 * clear) / n).toFixed(0)}%) · dense ${dense} · judge ≈ $${(inTok / 1e6).toFixed(3)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
