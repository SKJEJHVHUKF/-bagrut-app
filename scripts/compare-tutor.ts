/**
 * compare-tutor.ts — side-by-side BEFORE vs AFTER, same student message.
 * Shows what actually changed: the OLD generic chat prompt (still used for
 * non-pilot topics) vs the NEW grounded private-tutor prompt for complex
 * numbers. Run:  npx tsx scripts/compare-tutor.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { PILOT_TOPIC, buildTutorSystemPrompt } from '@/lib/tutor-grounding';

// The OLD generic chat prompt (verbatim from /api/chat for non-pilot topics).
const OLD_PROMPT = `אתה מורה פרטי לבגרות בישראל. עזור לתלמיד עם הבנת חומר, פתרון תרגילים, והכוונה לקראת הבחינה.

סגנון:
- תשובות תמציתיות (פסקה-שתיים), לא חיבורים ארוכים.
- אם השאלה לא ברורה, בקש הבהרה.
- אם זה תרגיל מתמטי, הראה את שלבי הפתרון ב-LaTeX.
- בעברית ברורה.`;

const NEW_PROMPT = buildTutorSystemPrompt(PILOT_TOPIC)!;

const PROMPTS = [
  'פשוט תן לי את התשובה ל-$(1+i)^8$, בלי הסברים.',
  'לא הבנתי את נוסחת דה-מואבר. אפשר שתסביר לי?',
];

function hr(t: string) {
  console.log('\n' + '═'.repeat(78) + '\n  ' + t + '\n' + '═'.repeat(78));
}

async function ask(client: Anthropic, system: string, model: string, user: string) {
  const msg = await client.messages.create({
    model,
    max_tokens: 700,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const block = msg.content.find((c) => c.type === 'text');
  return block && 'text' in block ? block.text : '(no text)';
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('⚠ אין ANTHROPIC_API_KEY ב-.env.local');
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });

  for (const p of PROMPTS) {
    hr(`תלמיד: ${p}`);
    // OLD = Haiku + generic prompt (exactly what was live before).
    const before = await ask(client, OLD_PROMPT, 'claude-haiku-4-5', p);
    // NEW = Sonnet + grounded tutor-bar prompt (the pilot).
    const after = await ask(client, NEW_PROMPT, 'claude-sonnet-4-6', p);
    console.log('\n── לפני (המורה הישן, גנרי) ──────────────────────────────');
    console.log(before);
    console.log('\n── אחרי (המורה המעוגן, מרוכבים) ─────────────────────────');
    console.log(after);
  }
}

main().catch((e) => {
  console.error('compare error:', e);
  process.exit(1);
});
