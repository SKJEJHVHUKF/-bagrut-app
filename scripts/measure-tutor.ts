// ============================================================
// scripts/measure-tutor.ts — MEASURE the question tutor's token cost.
// ============================================================
//
// Uses `messages.countTokens`, which is FREE — no model call, no spend.
// Run it after any edit to lib/mathscan/tutor-prompt.ts and update the
// MEASURED comment there. Do not estimate this number: an estimated per-turn
// cost in this repo was once 2.5× wrong, and it set a quota default.
//
//   npx tsx scripts/measure-tutor.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import Anthropic from '@anthropic-ai/sdk';
import { SCAN_TUTOR_CORE, buildScanTutorSystem } from '../lib/mathscan/tutor-prompt';

const SAMPLE = {
  question: 'פתור את המשוואה x^2 - 5x + 6 = 0',
  steps: [
    { title: 'הנתון', content: '$$x^{2}-5x+6 = 0$$' },
    {
      title: 'מזהים את המקדמים',
      content: '$$a = 1,\ b = -5,\ c = 6$$\n\nזיהוי נכון של המקדמים הוא מה שמונע טעות סימן בנוסחה.',
    },
    {
      title: 'מחשבים את הדיסקרימיננטה',
      content:
        '$$\Delta = \left(-5\right)^2 - 4 \cdot 1 \cdot 6 = 1$$\n\nהדיסקרימיננטה חיובית, ולכן יש שני פתרונות ממשיים שונים.',
    },
    { title: 'מציבים בנוסחה', content: '$$x_{1,2} = \frac{-b \pm \sqrt{\Delta}}{2a}$$' },
    { title: 'בדיקה — מציבים חזרה', content: '$$x = 2,\quad x = 3$$' },
  ],
  finalAnswer: '$x_{1} = 2,\quad x_{2} = 3$',
  topic: 'אלגברה',
  unitLevel: 5,
  source: 'local-cas',
};

const IN = 1 / 1_000_000;
const OUT = 5 / 1_000_000;
const HAIKU_CACHE_MINIMUM = 4096;

async function main() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const count = async (system: { type: 'text'; text: string }[], history: number) => {
    const messages = [];
    for (let i = 0; i < history; i++) {
      messages.push({ role: 'user' as const, content: 'למה עשינו את הצעד הזה?' });
      messages.push({
        role: 'assistant' as const,
        content: 'כי הדיסקרימיננטה קובעת כמה פתרונות ממשיים יש למשוואה. '.repeat(4),
      });
    }
    messages.push({ role: 'user' as const, content: 'לא הבנתי את השלב הראשון' });
    const result = await client.messages.countTokens({
      model: 'claude-haiku-4-5',
      system,
      messages,
    });
    return result.input_tokens;
  };

  const coreOnly = await count([{ type: 'text', text: SCAN_TUTOR_CORE }], 0);
  const full = buildScanTutorSystem(SAMPLE) as { type: 'text'; text: string }[];
  const turn1 = await count(full, 0);
  const turn4 = await count(full, 3);
  const turn8 = await count(full, 7);

  console.log('\n— MEASURED (countTokens, free) —');
  console.log('persona alone           ', coreOnly, 'tokens');
  console.log('persona + question ctx  ', turn1, 'tokens  (turn 1)');
  console.log('turn 4 (history grown)  ', turn4, 'tokens');
  console.log('turn 8 (history grown)  ', turn8, 'tokens');

  console.log(
    `\ncache: persona is ${coreOnly} tokens vs Haiku 4.5 minimum ${HAIKU_CACHE_MINIMUM} → ` +
      (coreOnly < HAIKU_CACHE_MINIMUM
        ? 'UNDER — the cache_control marker is a silent NO-OP on Haiku (free to declare, pays off on Sonnet, minimum 1024)'
        : 'OVER — caching is live')
  );

  const out = 350;
  const perTurn = (n: number) => n * IN + out * OUT;
  const session = [turn1, turn4, turn8].reduce((a, b) => a + b, 0) / 3;
  console.log(
    `\nper turn (turn 1): $${perTurn(turn1).toFixed(5)}  (${(perTurn(turn1) * 3.7 * 100).toFixed(2)} agorot)`
  );
  console.log(
    `full 8-turn conversation: ~$${(perTurn(session) * 8).toFixed(4)}  (${(perTurn(session) * 8 * 3.7 * 100).toFixed(1)} agorot)`
  );
  console.log('\nCap in the route: MAX_TURNS=8 per question, 20/day free, 120/day Pro.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
